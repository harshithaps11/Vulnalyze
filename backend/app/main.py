from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from uuid import UUID
import httpx
import os

from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import User, Scan, Vulnerability, ScanStatus
from app.services.scanner import ScannerService, run_hybrid_scan, run_scan_task_in_background

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
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    auth_header = request.headers.get("Authorization")
    email = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
        except JWTError:
            pass
            
    if not email:
        # Development mode bypass: default to the admin user (id=1)
        result = await db.execute(select(User).where(User.id == 1))
        user = result.scalar_one_or_none()
        if user:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
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
    background_tasks: BackgroundTasks,
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
    
    # Start scan in background using BackgroundTasks
    background_tasks.add_task(run_scan_task_in_background, str(db_scan.uuid), scan.source_code or "", scan.target_url)
    
    return db_scan

@app.get(f"{settings.API_V1_STR}/scans/{{scan_id}}", response_model=ScanResponse)
async def get_scan(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.vulnerabilities))
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

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

class CodeRequest(BaseModel):
    code: str

class CodeAnalysisRequest(CodeRequest):
    question: str

class CodeFixRequest(CodeRequest):
    vulnerability: str

async def call_openrouter(messages: List[dict], temperature: float = 0.7) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
            },
            json={
                "model": "anthropic/claude-3-opus-20240229",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 1000
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="OpenRouter API error")
        
        return response.json()

@app.post("/api/analyze")
async def analyze_code(request: CodeAnalysisRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a security-focused AI assistant. Analyze the following code and provide detailed, actionable feedback. Focus on security vulnerabilities, best practices, and potential improvements. Format your response in a clear, structured way with specific examples and fixes."
            },
            {
                "role": "user",
                "content": f"Code to analyze:\n```javascript\n{request.code}\n```\n\nQuestion: {request.question}"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fix")
async def get_code_fix(request: CodeFixRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a security-focused AI assistant. Provide a specific code fix for the given vulnerability. Return ONLY the fixed code, with no explanations or additional text."
            },
            {
                "role": "user",
                "content": f"Fix this vulnerability in the code:\n```javascript\n{request.code}\n```\n\nVulnerability: {request.vulnerability}"
            }
        ]
        
        result = await call_openrouter(messages, temperature=0.3)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain")
async def explain_code(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a code explanation expert. Explain the following code in detail, focusing on its purpose, functionality, and key concepts. Format your response in a clear, structured way."
            },
            {
                "role": "user",
                "content": f"Explain this code:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/best-practices")
async def get_best_practices(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a code quality expert. Analyze the following code and provide a list of best practices suggestions. Return the response as a JSON array of objects with 'type', 'description', 'impact', and 'priority' fields."
            },
            {
                "role": "user",
                "content": f"Analyze this code for best practices:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/performance")
async def analyze_performance(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a performance optimization expert. Analyze the following code and provide performance metrics and recommendations. Return the response as a JSON array of objects with 'metric', 'value', and 'recommendation' fields."
            },
            {
                "role": "user",
                "content": f"Analyze this code for performance:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 