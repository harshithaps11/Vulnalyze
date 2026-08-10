from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Enum, JSON, Boolean, Text, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from uuid import UUID, uuid4

from .base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    SECURITY_ANALYST = "security_analyst"


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    STATIC_SCAN = "static_scan"
    DEPENDENCY_SCAN = "dependency_scan"
    CONTAINER_SCAN = "container_scan"
    DYNAMIC_SCAN = "dynamic_scan"
    NETWORK_SCAN = "network_scan"
    NORMALIZING = "normalizing"
    COMPLETED = "completed"
    FAILED = "failed"


class VulnerabilitySeverity(str, enum.Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    IGNORED = "ignored"
    FIXED = "fixed"


class User(Base):
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organization.id"))

    organization: Mapped["Organization"] = relationship(back_populates="users")
    scans: Mapped[List["Scan"]] = relationship(back_populates="user")


class Organization(Base):
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)

    users: Mapped[List["User"]] = relationship(back_populates="organization")
    scans: Mapped[List["Scan"]] = relationship(back_populates="organization")


class Scan(Base):
    uuid: Mapped[UUID] = mapped_column(default=uuid4, unique=True, index=True)
    status: Mapped[ScanStatus] = mapped_column(Enum(ScanStatus), default=ScanStatus.PENDING)
    target_url: Mapped[str] = mapped_column(String(255))
    source_code: Mapped[str] = mapped_column(Text, nullable=True)
    scan_type: Mapped[str] = mapped_column(String(50))  # static, dynamic, hybrid
    results: Mapped[dict] = mapped_column(JSON, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    organization_id: Mapped[int] = mapped_column(ForeignKey("organization.id"))

    user: Mapped["User"] = relationship(back_populates="scans")
    organization: Mapped["Organization"] = relationship(back_populates="scans")
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship(back_populates="scan", lazy="selectin")


class Vulnerability(Base):
    scan_id: Mapped[int] = mapped_column(ForeignKey("scan.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[VulnerabilitySeverity] = mapped_column(Enum(VulnerabilitySeverity))
    location: Mapped[str] = mapped_column(String(255))
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    is_false_positive: Mapped[bool] = mapped_column(Boolean, default=False)
    false_positive_reason: Mapped[str] = mapped_column(Text, nullable=True)
    remediation: Mapped[str] = mapped_column(Text, nullable=True)
    vuln_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)

    # ── New fields (Phase 2) ────────────────────────────────────────────────
    rule_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cwe_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    owasp_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cvss_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    line_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    column_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confidence: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    impact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    scanner_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    finding_status: Mapped[FindingStatus] = mapped_column(
        Enum(FindingStatus), default=FindingStatus.OPEN, nullable=True
    )

    scan: Mapped["Scan"] = relationship(back_populates="vulnerabilities")


class AuditLog(Base):
    """Tracks security-relevant actions for compliance and forensics."""
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100))  # LOGIN, SCAN_CREATED, FINDING_STATUS_CHANGED, etc.
    resource_type: Mapped[str] = mapped_column(String(50))  # scan, vulnerability, user
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6