from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.vulnerability import Vulnerability
from app.schemas.vulnerability import (
    VulnerabilityCreate,
    VulnerabilityUpdate,
    VulnerabilityResponse,
    FalsePositiveUpdate
)
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=VulnerabilityResponse)
async def create_vulnerability(
    vulnerability: VulnerabilityCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_vulnerability = Vulnerability(**vulnerability.dict())
    db.add(db_vulnerability)
    db.commit()
    db.refresh(db_vulnerability)
    return db_vulnerability

@router.get("/{vulnerability_id}", response_model=VulnerabilityResponse)
async def get_vulnerability(
    vulnerability_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vulnerability

@router.put("/{vulnerability_id}/false-positive", response_model=VulnerabilityResponse)
async def mark_false_positive(
    vulnerability_id: int,
    update: FalsePositiveUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    vulnerability.is_false_positive = update.is_false_positive
    vulnerability.remediation_notes = update.notes
    db.commit()
    db.refresh(vulnerability)
    return vulnerability

@router.put("/{vulnerability_id}", response_model=VulnerabilityResponse)
async def update_vulnerability(
    vulnerability_id: int,
    update: VulnerabilityUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(vulnerability, key, value)
    
    db.commit()
    db.refresh(vulnerability)
    return vulnerability 