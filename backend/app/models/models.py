from datetime import datetime
from typing import List
from sqlalchemy import String, ForeignKey, Enum, JSON, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from uuid import UUID, uuid4

from .base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class VulnerabilitySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

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
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship(back_populates="scan")

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
    metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    scan: Mapped["Scan"] = relationship(back_populates="vulnerabilities") 