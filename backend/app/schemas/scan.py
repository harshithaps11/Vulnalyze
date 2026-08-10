"""
Pydantic schemas for scan and vulnerability endpoints.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.models import ScanStatus, VulnerabilitySeverity


class ScanCreate(BaseModel):
    target_url: str
    source_code: Optional[str] = None
    scan_type: str


class VulnerabilityResponse(BaseModel):
    id: int
    scan_id: int
    title: str
    description: str
    severity: VulnerabilitySeverity
    location: str
    evidence: Optional[str] = None
    is_false_positive: bool
    false_positive_reason: Optional[str] = None
    remediation: Optional[str] = None
    vuln_metadata: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScanResponse(BaseModel):
    id: int
    uuid: UUID
    status: ScanStatus
    target_url: str
    scan_type: str
    created_at: datetime
    vulnerabilities: List[VulnerabilityResponse]

    class Config:
        from_attributes = True


class FalsePositiveRequest(BaseModel):
    reason: str


class ScanSummaryResponse(BaseModel):
    scan_id: UUID
    status: str
    target_url: str
    scan_type: str
    total_vulnerabilities: int
    severity_breakdown: dict
    risk_level: str
    generated_at: str
