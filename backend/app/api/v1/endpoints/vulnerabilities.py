from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.vulnerability import Vulnerability
from app.schemas.vulnerability import (
    VulnerabilityUpdate,
    VulnerabilityResponse,
    VulnerabilityRemediation
)
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.put("/{vulnerability_id}/false-positive", response_model=VulnerabilityResponse)
def mark_as_false_positive(
    vulnerability_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a vulnerability as a false positive."""
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
    if not vulnerability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )
    
    # Check if user has access to this vulnerability's scan
    if not current_user.is_superuser:
        scan = vulnerability.scan
        if not scan or scan.organization_id not in [org.id for org in current_user.organizations]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this vulnerability"
            )
    
    vulnerability.is_false_positive = True
    db.commit()
    db.refresh(vulnerability)
    return vulnerability

@router.put("/{vulnerability_id}/remediate", response_model=VulnerabilityResponse)
def update_remediation(
    vulnerability_id: int,
    remediation: VulnerabilityRemediation,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_user)
):
    """Update vulnerability remediation information."""
    vulnerability = db.query(Vulnerability).filter(Vulnerability.id == vulnerability_id).first()
    if not vulnerability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )
    
    # Check if user has access to this vulnerability's scan
    if not current_user.is_superuser:
        scan = vulnerability.scan
        if not scan or scan.organization_id not in [org.id for org in current_user.organizations]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this vulnerability"
            )
    
    vulnerability.remediation_code = remediation.code
    vulnerability.remediation_status = remediation.status
    vulnerability.remediation_notes = remediation.notes
    db.commit()
    db.refresh(vulnerability)
    return vulnerability 