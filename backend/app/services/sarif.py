"""
SARIF Export — Generate SARIF v2.1.0 JSON from scan results.
Compatible with GitHub Security tab, Azure DevOps, and other SARIF consumers.

Specification: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
"""
from datetime import datetime
from typing import List, Dict, Any


_SARIF_SCHEMA = "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json"
_SARIF_VERSION = "2.1.0"


def _severity_to_sarif_level(severity: str) -> str:
    """Map Vulnalyze severity to SARIF level."""
    mapping = {
        "critical": "error",
        "high": "error",
        "medium": "warning",
        "low": "note",
        "info": "note",
    }
    sev = severity.value if hasattr(severity, "value") else str(severity)
    return mapping.get(sev.lower(), "note")


def _build_rules(vulnerabilities: list) -> List[Dict[str, Any]]:
    """Build unique SARIF rule descriptors from vulnerabilities."""
    rules = {}
    for vuln in vulnerabilities:
        meta = vuln.vuln_metadata or {}
        rule_id = meta.get("rule_id") or vuln.title.lower().replace(" ", "-").replace("—", "-")[:80]
        if rule_id not in rules:
            sev = vuln.severity.value if hasattr(vuln.severity, "value") else str(vuln.severity)
            cwe_id = meta.get("cweid", "")
            help_uri = f"https://cwe.mitre.org/data/definitions/{cwe_id}.html" if cwe_id else "https://owasp.org/"
            rules[rule_id] = {
                "id": rule_id,
                "name": vuln.title[:255],
                "shortDescription": {"text": vuln.title[:255]},
                "fullDescription": {"text": vuln.description[:1000]},
                "defaultConfiguration": {
                    "level": _severity_to_sarif_level(sev),
                },
                "helpUri": help_uri,
                "properties": {
                    "security-severity": _cvss_for_severity(sev),
                    **({"tags": [meta.get("owasp")]} if meta.get("owasp") else {}),
                },
            }
    return list(rules.values())


def _cvss_for_severity(severity: str) -> str:
    """Return a representative CVSS string for a severity level."""
    mapping = {"critical": "9.5", "high": "7.5", "medium": "5.0", "low": "2.5", "info": "0.0"}
    return mapping.get(severity.lower(), "0.0")


def generate_sarif(scan, vulnerabilities: list) -> Dict[str, Any]:
    """
    Generate a valid SARIF v2.1.0 document from scan results.

    Args:
        scan: The Scan ORM object.
        vulnerabilities: List of Vulnerability ORM objects.

    Returns:
        A dict representing the full SARIF JSON document.
    """
    rules = _build_rules(vulnerabilities)
    rule_index = {r["id"]: idx for idx, r in enumerate(rules)}

    results = []
    for vuln in vulnerabilities:
        meta = vuln.vuln_metadata or {}
        rule_id = meta.get("rule_id") or vuln.title.lower().replace(" ", "-").replace("—", "-")[:80]
        sev = vuln.severity.value if hasattr(vuln.severity, "value") else str(vuln.severity)

        # Build location
        location = vuln.location or ""
        line_num = meta.get("line", 1)
        try:
            line_num = int(line_num)
        except (ValueError, TypeError):
            line_num = 1

        physical_location = {
            "artifactLocation": {
                "uri": location,
                "uriBaseId": "%SRCROOT%",
            },
        }
        if line_num > 0:
            physical_location["region"] = {
                "startLine": line_num,
                "startColumn": 1,
            }

        result_obj = {
            "ruleId": rule_id,
            "ruleIndex": rule_index.get(rule_id, 0),
            "level": _severity_to_sarif_level(sev),
            "message": {
                "text": vuln.description[:2000],
            },
            "locations": [
                {"physicalLocation": physical_location}
            ],
        }

        # Add fix suggestion if remediation exists
        if vuln.remediation:
            result_obj["fixes"] = [{
                "description": {"text": vuln.remediation[:500]},
            }]

        # Add fingerprint for deduplication
        result_obj["fingerprints"] = {
            "vulnalyzeId": str(vuln.id),
        }

        results.append(result_obj)

    scan_uuid = str(scan.uuid) if hasattr(scan, "uuid") else "unknown"
    target_url = scan.target_url if hasattr(scan, "target_url") else "unknown"

    sarif = {
        "$schema": _SARIF_SCHEMA,
        "version": _SARIF_VERSION,
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "Vulnalyze",
                        "version": "1.0.0",
                        "informationUri": "https://github.com/harshithaps11/Vulnalyze",
                        "rules": rules,
                    },
                },
                "results": results,
                "invocations": [
                    {
                        "executionSuccessful": True,
                        "endTimeUtc": datetime.utcnow().isoformat() + "Z",
                    }
                ],
                "properties": {
                    "scanId": scan_uuid,
                    "targetUrl": target_url,
                },
            }
        ],
    }

    return sarif
