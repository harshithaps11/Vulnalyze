"""
Dependency Scanner — Detects vulnerable dependencies using pip-audit and npm audit.
Graceful no-op when tools are not installed.
"""
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any


class DependencyScanner:
    """Scans project dependencies for known vulnerabilities."""

    async def scan_python(self, requirements_path: str = "") -> List[Dict[str, Any]]:
        """
        Run pip-audit on a Python requirements file.
        Falls back gracefully if pip-audit is not installed.
        """
        findings = []
        try:
            cmd = [sys.executable, "-m", "pip_audit", "--format", "json"]
            if requirements_path and Path(requirements_path).exists():
                cmd.extend(["--requirement", requirements_path])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
            )

            if result.stdout:
                data = json.loads(result.stdout)
                # pip-audit returns a list of dependency objects
                deps = data if isinstance(data, list) else data.get("dependencies", [])
                for dep in deps:
                    for vuln in dep.get("vulns", []):
                        severity = self._map_pip_audit_severity(vuln.get("fix_versions", []))
                        findings.append({
                            "title": f"Vulnerable dependency: {dep['name']} {dep.get('version', '')}",
                            "description": f"{vuln.get('id', 'Unknown CVE')}: {vuln.get('description', 'Known vulnerability in dependency')}",
                            "severity": severity,
                            "location": f"requirements: {dep['name']}=={dep.get('version', '?')}",
                            "evidence": vuln.get("id", ""),
                            "metadata": {
                                "cweid": "1395",  # CWE-1395: Dependency on Vulnerable Third-Party Component
                                "confidence": "high",
                                "scanner": "pip-audit",
                                "vuln_id": vuln.get("id", ""),
                                "fix_versions": vuln.get("fix_versions", []),
                                "owasp": "A06:2021-Vulnerable and Outdated Components",
                            },
                        })
            print(f"pip-audit found {len(findings)} vulnerabilities.")

        except FileNotFoundError:
            print("pip-audit not installed — skipping Python dependency scan.")
        except subprocess.TimeoutExpired:
            print("pip-audit timed out — skipping.")
        except Exception as e:
            print(f"pip-audit error: {e} — skipping Python dependency scan.")

        return findings

    async def scan_npm(self, project_path: str = ".") -> List[Dict[str, Any]]:
        """
        Run npm audit on a Node.js project.
        Falls back gracefully if npm or package-lock.json is not present.
        """
        findings = []
        lock_path = Path(project_path) / "package-lock.json"
        if not lock_path.exists():
            return findings

        try:
            result = subprocess.run(
                ["npm", "audit", "--json"],
                capture_output=True,
                text=True,
                cwd=project_path,
                timeout=120,
            )

            if result.stdout:
                data = json.loads(result.stdout)
                vulnerabilities = data.get("vulnerabilities", {})
                for pkg_name, info in vulnerabilities.items():
                    severity = info.get("severity", "low")
                    for via in info.get("via", []):
                        if isinstance(via, dict):
                            findings.append({
                                "title": f"Vulnerable npm package: {pkg_name}",
                                "description": via.get("title", f"Known vulnerability in {pkg_name}"),
                                "severity": self._normalize_npm_severity(severity),
                                "location": f"package.json: {pkg_name}@{info.get('range', '?')}",
                                "evidence": via.get("url", ""),
                                "metadata": {
                                    "cweid": str(via.get("cwe", ["1395"])[0]) if via.get("cwe") else "1395",
                                    "confidence": "high",
                                    "scanner": "npm-audit",
                                    "ghsa": via.get("source", ""),
                                    "cvss_score": via.get("cvss", {}).get("score"),
                                    "owasp": "A06:2021-Vulnerable and Outdated Components",
                                },
                            })
            print(f"npm audit found {len(findings)} vulnerabilities.")

        except FileNotFoundError:
            print("npm not installed — skipping npm dependency scan.")
        except subprocess.TimeoutExpired:
            print("npm audit timed out — skipping.")
        except Exception as e:
            print(f"npm audit error: {e} — skipping.")

        return findings

    @staticmethod
    def _map_pip_audit_severity(fix_versions: list) -> str:
        """Heuristic: if no fix available, severity is higher."""
        return "high" if not fix_versions else "medium"

    @staticmethod
    def _normalize_npm_severity(severity: str) -> str:
        mapping = {
            "critical": "critical",
            "high": "high",
            "moderate": "medium",
            "low": "low",
            "info": "info",
        }
        return mapping.get(severity.lower(), "low")
