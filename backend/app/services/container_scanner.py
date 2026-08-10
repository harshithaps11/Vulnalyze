"""
Container Scanner — Trivy subprocess wrapper for container image/filesystem scanning.
Graceful no-op when Trivy is not installed.
"""
import json
import subprocess
from typing import List, Dict, Any


class ContainerScanner:
    """Scans container images and filesystems for vulnerabilities using Trivy."""

    def __init__(self, trivy_path: str = "trivy"):
        self.trivy_path = trivy_path

    async def scan_image(self, image: str) -> List[Dict[str, Any]]:
        """
        Scan a container image with Trivy.
        Graceful no-op if Trivy is not installed.
        """
        return await self._run_trivy(["image", "--format", "json", image], f"image:{image}")

    async def scan_filesystem(self, path: str) -> List[Dict[str, Any]]:
        """
        Scan a filesystem path with Trivy.
        Graceful no-op if Trivy is not installed.
        """
        return await self._run_trivy(["fs", "--format", "json", path], f"fs:{path}")

    async def _run_trivy(self, args: List[str], target_label: str) -> List[Dict[str, Any]]:
        """Run Trivy with given arguments and parse JSON output."""
        findings = []
        try:
            cmd = [self.trivy_path] + args + ["--quiet"]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
            )

            if not result.stdout:
                return findings

            data = json.loads(result.stdout)
            findings = self._parse_trivy_output(data, target_label)
            print(f"Trivy found {len(findings)} vulnerabilities in {target_label}")

        except FileNotFoundError:
            print(f"Trivy not installed at '{self.trivy_path}' — skipping container scan.")
        except subprocess.TimeoutExpired:
            print("Trivy timed out — skipping container scan.")
        except json.JSONDecodeError as e:
            print(f"Failed to parse Trivy JSON output: {e}")
        except Exception as e:
            print(f"Container scan error: {e}")

        return findings

    @staticmethod
    def _parse_trivy_output(data: dict, target_label: str) -> List[Dict[str, Any]]:
        """Parse Trivy JSON output into finding dicts."""
        findings = []

        # Trivy output format: {"Results": [{"Vulnerabilities": [...]}]}
        results = data.get("Results", [])
        for result in results:
            target = result.get("Target", target_label)
            vulns = result.get("Vulnerabilities") or []

            for vuln in vulns:
                severity = ContainerScanner._map_trivy_severity(vuln.get("Severity", "UNKNOWN"))
                findings.append({
                    "title": f"Container Vulnerability: {vuln.get('VulnerabilityID', 'Unknown')} in {vuln.get('PkgName', '?')}",
                    "description": vuln.get("Description", vuln.get("Title", "Known vulnerability in container dependency")),
                    "severity": severity,
                    "location": f"{target}: {vuln.get('PkgName', '?')}@{vuln.get('InstalledVersion', '?')}",
                    "evidence": f"CVE: {vuln.get('VulnerabilityID', 'N/A')} | Fixed: {vuln.get('FixedVersion', 'not available')}",
                    "metadata": {
                        "cweid": "1395",
                        "confidence": "high",
                        "scanner": "trivy",
                        "vuln_id": vuln.get("VulnerabilityID", ""),
                        "pkg_name": vuln.get("PkgName", ""),
                        "installed_version": vuln.get("InstalledVersion", ""),
                        "fixed_version": vuln.get("FixedVersion", ""),
                        "cvss_score": ContainerScanner._extract_cvss(vuln),
                        "owasp": "A06:2021-Vulnerable and Outdated Components",
                    },
                })

        return findings

    @staticmethod
    def _map_trivy_severity(severity: str) -> str:
        mapping = {
            "CRITICAL": "critical",
            "HIGH": "high",
            "MEDIUM": "medium",
            "LOW": "low",
            "UNKNOWN": "info",
        }
        return mapping.get(severity.upper(), "info")

    @staticmethod
    def _extract_cvss(vuln: dict) -> float | None:
        """Extract CVSS score from Trivy vulnerability data."""
        cvss = vuln.get("CVSS", {})
        # Try NVD first, then any other source
        for source in ("nvd", "redhat", "ghsa"):
            if source in cvss:
                score = cvss[source].get("V3Score") or cvss[source].get("V2Score")
                if score:
                    return float(score)
        return None
