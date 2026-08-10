"""
Audit logging service — records security-relevant actions.
"""
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AuditLog


# Action constants
LOGIN = "LOGIN"
SCAN_CREATED = "SCAN_CREATED"
SCAN_COMPLETED = "SCAN_COMPLETED"
FINDING_STATUS_CHANGED = "FINDING_STATUS_CHANGED"
USER_CREATED = "USER_CREATED"
FALSE_POSITIVE_MARKED = "FALSE_POSITIVE_MARKED"


async def create_audit_log(
    db: AsyncSession,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry for a security-relevant action.

    Args:
        db: Database session.
        action: Action constant (e.g., LOGIN, SCAN_CREATED).
        resource_type: Type of resource (e.g., "scan", "vulnerability", "user").
        resource_id: ID of the affected resource.
        user_id: ID of the user who performed the action.
        details: Additional metadata as a dict.
        ip_address: Client IP address.

    Returns:
        The created AuditLog record.
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log)
    # Flush but don't commit — let the caller control the transaction
    await db.flush()
    return log
