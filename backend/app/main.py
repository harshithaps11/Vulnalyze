from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from uuid import UUID

from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import User, Scan, Vulnerability, ScanStatus
from app.services.scanner import ScannerService, run_hybrid_scan

settings = get_settings()
app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Pydantic models
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_id: int

class ScanCreate(BaseModel):
    target_url: str
    source_code: Optional[str] = None
    scan_type: str

class ScanResponse(BaseModel):
    id: int
    uuid: UUID
    status: ScanStatus
    target_url: str
    scan_type: str
    created_at: datetime
    vulnerabilities: List[dict]

# Authentication
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.post(f"{settings.API_V1_STR}/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post(f"{settings.API_V1_STR}/scans", response_model=ScanResponse)
async def create_scan(
    scan: ScanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create scan record
    db_scan = Scan(
        target_url=scan.target_url,
        source_code=scan.source_code,
        scan_type=scan.scan_type,
        user_id=current_user.id,
        organization_id=current_user.organization_id
    )
    db.add(db_scan)
    await db.commit()
    await db.refresh(db_scan)
    
    # Start scan in background
    run_hybrid_scan.delay(str(db_scan.uuid), scan.source_code or "", scan.target_url)
    
    return db_scan

@app.get(f"{settings.API_V1_STR}/scans/{{scan_id}}", response_model=ScanResponse)
async def get_scan(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Scan)
        .where(Scan.uuid == scan_id)
        .where(Scan.organization_id == current_user.organization_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@app.put(f"{settings.API_V1_STR}/scans/{{scan_id}}/vulnerabilities/{{vuln_id}}")
async def mark_false_positive(
    scan_id: UUID,
    vuln_id: int,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify scan belongs to user's organization
    result = await db.execute(
        select(Scan)
        .where(Scan.uuid == scan_id)
        .where(Scan.organization_id == current_user.organization_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Update vulnerability
    result = await db.execute(
        select(Vulnerability)
        .where(Vulnerability.id == vuln_id)
        .where(Vulnerability.scan_id == scan.id)
    )
    vuln = result.scalar_one_or_none()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    vuln.is_false_positive = True
    vuln.false_positive_reason = reason
    await db.commit()
    
    return {"status": "success"}

@app.get(f"{settings.API_V1_STR}/scans/{{scan_id}}/status")
async def get_scan_status(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Scan)
        .where(Scan.uuid == scan_id)
        .where(Scan.organization_id == current_user.organization_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return {
        "status": scan.status,
        "progress": scan.progress if hasattr(scan, 'progress') else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 