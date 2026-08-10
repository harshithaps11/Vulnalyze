"""
Scan API routes — CRUD, status polling, summary, false-positive marking, SARIF export.
"""
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import Scan, Vulnerability, ScanStatus, User
from app.schemas.scan import (
    ScanCreate,
    ScanResponse,
    FalsePositiveRequest,
)
from app.api.deps import get_current_user
from app.services.scanner import run_scan_task_in_background

settings = get_settings()
router = APIRouter(prefix=f"{settings.API_V1_STR}/scans", tags=["scans"])


@router.post("", response_model=ScanResponse)
async def create_scan(
    scan: ScanCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new security scan and start it in the background."""
    db_scan = Scan(
        target_url=scan.target_url,
        source_code=scan.source_code,
        scan_type=scan.scan_type,
        user_id=current_user.id,
        organization_id=current_user.organization_id,
    )
    db.add(db_scan)
    await db.commit()
    await db.refresh(db_scan)

    # Start scan in background using BackgroundTasks
    background_tasks.add_task(
        run_scan_task_in_background,
        str(db_scan.uuid),
        scan.source_code or "",
        scan.target_url,
    )

    return db_scan


@router.get("", response_model=List[ScanResponse])
async def list_scans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent scans for the current user's organization."""
    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.vulnerabilities))
        .where(Scan.organization_id == current_user.organization_id)
        .order_by(Scan.created_at.desc())
        .limit(20)
    )
    scans = result.scalars().all()
    return scans


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific scan by UUID."""
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


@router.get("/{scan_id}/summary")
async def get_scan_summary(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a summary of scan results with severity breakdown."""
    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.vulnerabilities))
        .where(Scan.uuid == scan_id)
        .where(Scan.organization_id == current_user.organization_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    vulnerabilities = scan.vulnerabilities or []
    severity_breakdown = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0,
    }

    for vuln in vulnerabilities:
        severity = (vuln.severity.value if hasattr(vuln.severity, "value") else str(vuln.severity)).lower()
        if severity in severity_breakdown:
            severity_breakdown[severity] += 1
        else:
            severity_breakdown["info"] += 1

    status_value = scan.status.value if hasattr(scan.status, "value") else str(scan.status)
    risk_level = (
        "critical" if severity_breakdown["critical"] > 0
        else "high" if severity_breakdown["high"] > 0
        else "medium" if severity_breakdown["medium"] > 0
        else "low"
    )

    return {
        "scan_id": scan.uuid,
        "status": status_value,
        "target_url": scan.target_url,
        "scan_type": scan.scan_type,
        "total_vulnerabilities": len(vulnerabilities),
        "severity_breakdown": severity_breakdown,
        "risk_level": risk_level,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/{scan_id}/status")
async def get_scan_status(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll scan status for progress tracking."""
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
        "progress": scan.progress if hasattr(scan, "progress") else 0,
    }


@router.put("/{scan_id}/vulnerabilities/{vuln_id}")
async def mark_false_positive(
    scan_id: UUID,
    vuln_id: int,
    body: FalsePositiveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a vulnerability as a false positive with a reason."""
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
    vuln.false_positive_reason = body.reason
    await db.commit()

    return {"status": "success"}


@router.get("/{scan_id}/sarif")
async def get_scan_sarif(
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export scan results in SARIF v2.1.0 format for GitHub Security tab."""
    result = await db.execute(
        select(Scan)
        .options(selectinload(Scan.vulnerabilities))
        .where(Scan.uuid == scan_id)
        .where(Scan.organization_id == current_user.organization_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    from app.services.sarif import generate_sarif
    sarif_doc = generate_sarif(scan, scan.vulnerabilities or [])
    return sarif_doc
