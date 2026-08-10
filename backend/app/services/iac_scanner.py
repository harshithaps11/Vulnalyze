"""
IaC Scanner — Infrastructure as Code security analysis.
Pure Python pattern matching: Terraform, Docker Compose, Kubernetes YAML, Dockerfile.
No external tools required.
"""
import re
from pathlib import Path
from typing import List, Dict, Any


# IaC security rules: (pattern, title, description, severity, cwe_id, file_types)
_IAC_RULES = [
    # -- Terraform --
    (
        r"cidr_blocks\s*=\s*\[?\s*\"0\.0\.0\.0/0\"\s*\]?",
        "Open CIDR Block — 0.0.0.0/0",
        "Security group or network ACL allows traffic from any IP. Restrict to specific CIDR ranges.",
        "high", "284", ["tf"],
    ),
    (
        r"ingress\s*\{[^}]*from_port\s*=\s*0[^}]*to_port\s*=\s*0",
        "Overly Permissive Ingress Rule",
        "Ingress rule allows all ports (0-0). Restrict to required ports only.",
        "high", "284", ["tf"],
    ),
    (
        r"encrypted\s*=\s*false|server_side_encryption\s*=\s*\"\"",
        "Unencrypted Storage Resource",
        "Cloud storage resource is not encrypted at rest. Enable server-side encryption.",
        "high", "311", ["tf"],
    ),

    # -- Docker / Docker Compose --
    (
        r"privileged\s*[:=]\s*true",
        "Privileged Container",
        "Container runs in privileged mode, granting full host access. Remove privileged flag.",
        "critical", "250", ["yml", "yaml", "Dockerfile"],
    ),
    (
        r"network_mode\s*[:=]\s*['\"]?host['\"]?",
        "Host Network Mode",
        "Container shares the host network namespace, bypassing network isolation.",
        "high", "284", ["yml", "yaml"],
    ),
    (
        r":latest\b",
        "Mutable Image Tag (:latest)",
        "Using :latest tag makes builds non-reproducible and may pull untested versions. Pin to a specific version.",
        "medium", "829", ["yml", "yaml", "Dockerfile"],
    ),
    (
        r"^\s*EXPOSE\s+\d+",
        "Exposed Port in Dockerfile",
        "Port is exposed in Dockerfile. Verify this is intentional and required.",
        "info", "200", ["Dockerfile"],
    ),
    (
        r"(?:password|secret|key|token)\s*[:=]\s*['\"][^'\"]{4,}['\"]",
        "Hardcoded Secret in IaC",
        "Credential or secret appears hardcoded. Use environment variables or a secrets manager.",
        "critical", "798", ["yml", "yaml", "tf", "Dockerfile"],
    ),

    # -- Kubernetes --
    (
        r"runAsRoot\s*:\s*true|runAsUser\s*:\s*0\b",
        "Container Runs as Root",
        "Container runs as root user. Set runAsNonRoot: true and use a non-root UID.",
        "high", "250", ["yml", "yaml"],
    ),
    (
        r"allowPrivilegeEscalation\s*:\s*true",
        "Privilege Escalation Allowed",
        "allowPrivilegeEscalation is true. Set to false to prevent container breakout.",
        "high", "250", ["yml", "yaml"],
    ),
    (
        r"hostPath\s*:",
        "Host Path Volume Mount",
        "Container mounts a host filesystem path. This can expose sensitive host data.",
        "medium", "284", ["yml", "yaml"],
    ),
    (
        r"readOnlyRootFilesystem\s*:\s*false",
        "Writable Root Filesystem",
        "Container root filesystem is writable. Set readOnlyRootFilesystem: true.",
        "medium", "732", ["yml", "yaml"],
    ),
]


class IaCScanner:
    """Infrastructure as Code security scanner using pattern matching."""

    async def scan_content(self, content: str, filename: str = "unknown") -> List[Dict[str, Any]]:
        """Scan IaC file content for security issues."""
        findings = []
        ext = Path(filename).suffix.lstrip(".") if "." in filename else filename

        lines = content.split("\n")
        for idx, line in enumerate(lines):
            line_num = idx + 1
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("//"):
                continue

            for pattern, title, description, severity, cwe_id, file_types in _IAC_RULES:
                # Check if rule applies to this file type
                if not any(ext.endswith(ft) or filename.endswith(ft) for ft in file_types):
                    continue

                try:
                    if re.search(pattern, line, re.IGNORECASE):
                        findings.append({
                            "title": title,
                            "description": description,
                            "severity": severity,
                            "location": f"{filename}:line {line_num}",
                            "evidence": stripped[:200],
                            "metadata": {
                                "cweid": cwe_id,
                                "confidence": "high",
                                "scanner": "vulnalyze-iac",
                                "line": line_num,
                                "owasp": "A05:2021-Security Misconfiguration",
                            },
                        })
                except re.error:
                    continue

        print(f"IaC scanner found {len(findings)} findings in {filename}")
        return findings

    async def scan_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Scan an IaC file on disk."""
        path = Path(file_path)
        if not path.exists():
            return []
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
            return await self.scan_content(content, path.name)
        except Exception as e:
            print(f"IaC scan error for {file_path}: {e}")
            return []
