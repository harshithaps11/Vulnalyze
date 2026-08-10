"""
Risk Engine — Deterministic risk score calculation from findings.
"""
from typing import List, Dict, Any


# CVSS score to severity mapping
def cvss_to_severity(cvss: float) -> str:
    if cvss >= 9.0:
        return "critical"
    elif cvss >= 7.0:
        return "high"
    elif cvss >= 4.0:
        return "medium"
    elif cvss >= 0.1:
        return "low"
    return "info"


def calculate_severity_breakdown(findings: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count findings by severity level."""
    breakdown = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.get("severity", "low")
        if hasattr(sev, "value"):
            sev = sev.value
        sev = str(sev).lower()
        if sev in breakdown:
            breakdown[sev] += 1
        else:
            breakdown["info"] += 1
    return breakdown


def calculate_risk_score(findings: List[Dict[str, Any]]) -> int:
    """
    Calculate an overall risk score (0–10) from findings.

    Scoring formula:
      critical × 3 + high × 2 + medium × 1
    Capped at 10.
    """
    breakdown = calculate_severity_breakdown(findings)
    raw = (
        breakdown["critical"] * 3
        + breakdown["high"] * 2
        + breakdown["medium"] * 1
    )
    return min(10, raw)


def risk_level_label(score: int) -> str:
    """Convert numeric risk score to a human-readable label."""
    if score >= 8:
        return "critical"
    elif score >= 5:
        return "high"
    elif score >= 3:
        return "medium"
    elif score >= 1:
        return "low"
    return "none"
