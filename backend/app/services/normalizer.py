"""
Normalizer — Unified finding schema and deduplication across all scanners.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any


@dataclass
class UnifiedFinding:
    """Common schema for findings from any scanner."""
    title: str
    description: str
    severity: str  # info, low, medium, high, critical
    location: str
    evidence: str = ""
    scanner_name: str = ""
    rule_id: str = ""
    cwe_id: str = ""
    owasp_category: str = ""
    cvss_score: Optional[float] = None
    file_path: str = ""
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    confidence: str = "medium"  # low, medium, high
    impact: str = ""
    remediation: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def normalize_finding(raw: Dict[str, Any], scanner_name: str = "") -> UnifiedFinding:
    """
    Convert a scanner-specific finding dict into a UnifiedFinding.
    Handles both the existing Vulnalyze format and new scanner outputs.
    """
    severity = raw.get("severity", "low")
    if hasattr(severity, "value"):
        severity = severity.value

    meta = raw.get("metadata", {})

    return UnifiedFinding(
        title=raw.get("title", "Unknown Finding"),
        description=raw.get("description", ""),
        severity=str(severity).lower(),
        location=raw.get("location", ""),
        evidence=str(raw.get("evidence", ""))[:500],
        scanner_name=scanner_name or meta.get("scanner", "unknown"),
        rule_id=meta.get("rule_id", raw.get("rule_id", "")),
        cwe_id=str(meta.get("cweid", raw.get("cwe_id", ""))),
        owasp_category=meta.get("owasp", raw.get("owasp_category", "")),
        cvss_score=raw.get("cvss_score"),
        file_path=raw.get("file_path", ""),
        line_number=meta.get("line", raw.get("line_number")),
        column_number=raw.get("column_number"),
        confidence=meta.get("confidence", raw.get("confidence", "medium")),
        impact=raw.get("impact", ""),
        remediation=raw.get("remediation", ""),
        metadata=meta,
    )


def deduplicate_findings(findings: List[UnifiedFinding]) -> List[UnifiedFinding]:
    """
    Remove duplicate findings based on (title, location, scanner_name).
    Keeps the first occurrence of each unique finding.
    """
    seen = set()
    unique = []
    for f in findings:
        key = (f.title, f.location, f.scanner_name)
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique
