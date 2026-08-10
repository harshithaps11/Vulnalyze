"""
Network Scanner — Nmap subprocess wrapper with SSRF-safe target validation.
Graceful no-op when nmap is not installed.
"""
import subprocess
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

from app.services.ssrf_protection import validate_scan_target


class NetworkScanner:
    """Network port/service scanner using nmap."""

    def __init__(self, nmap_path: str = "nmap"):
        self.nmap_path = nmap_path

    async def scan(self, target: str, ports: str = "1-1000") -> List[Dict[str, Any]]:
        """
        Run nmap scan on a target.
        Returns findings for open ports and detected services.
        Graceful no-op if nmap is not installed.
        """
        findings = []

        # SSRF protection — validate target before scanning
        is_valid, reason = validate_scan_target(f"http://{target}")
        if not is_valid:
            print(f"Network scan blocked for target {target}: {reason}")
            return [{
                "title": "Network Scan Target Blocked",
                "description": f"Target {target} was blocked by SSRF protection: {reason}",
                "severity": "info",
                "location": target,
                "evidence": reason,
                "metadata": {
                    "cweid": "918",
                    "confidence": "high",
                    "scanner": "network-scanner",
                    "owasp": "A10:2021-Server-Side Request Forgery",
                },
            }]

        try:
            cmd = [
                self.nmap_path,
                "-sV",          # Version detection
                "--open",       # Only show open ports
                "-oX", "-",     # XML output to stdout
                "-p", ports,
                "-T4",          # Aggressive timing
                "--max-retries", "1",
                target,
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode not in (0, 1) and not result.stdout:
                print(f"nmap exited with code {result.returncode}: {result.stderr[:200]}")
                return findings

            findings = self._parse_nmap_xml(result.stdout, target)
            print(f"Network scanner found {len(findings)} findings for {target}")

        except FileNotFoundError:
            print(f"nmap not installed at '{self.nmap_path}' — skipping network scan.")
        except subprocess.TimeoutExpired:
            print("nmap timed out — skipping network scan.")
        except Exception as e:
            print(f"Network scan error: {e}")

        return findings

    @staticmethod
    def _parse_nmap_xml(xml_output: str, target: str) -> List[Dict[str, Any]]:
        """Parse nmap XML output into findings."""
        findings = []
        if not xml_output.strip():
            return findings

        try:
            root = ET.fromstring(xml_output)
        except ET.ParseError as e:
            print(f"Failed to parse nmap XML: {e}")
            return findings

        for host in root.findall(".//host"):
            host_addr = target
            addr_el = host.find("address")
            if addr_el is not None:
                host_addr = addr_el.get("addr", target)

            ports_el = host.find("ports")
            if ports_el is None:
                continue

            for port in ports_el.findall("port"):
                state_el = port.find("state")
                if state_el is None or state_el.get("state") != "open":
                    continue

                port_id = port.get("portid", "?")
                protocol = port.get("protocol", "tcp")
                service_el = port.find("service")
                service_name = service_el.get("name", "unknown") if service_el is not None else "unknown"
                service_version = service_el.get("version", "") if service_el is not None else ""
                product = service_el.get("product", "") if service_el is not None else ""

                service_desc = f"{product} {service_version}".strip() or service_name

                # Determine severity based on port/service
                severity = "info"
                if int(port_id) in (21, 23, 25, 445, 3389):
                    severity = "high"  # Commonly exploited services
                elif int(port_id) in (80, 443, 8080, 8443):
                    severity = "low"   # Web services (expected)
                else:
                    severity = "medium"

                findings.append({
                    "title": f"Open Port: {port_id}/{protocol} ({service_name})",
                    "description": f"Port {port_id}/{protocol} is open running {service_desc}. Verify this service is required and properly secured.",
                    "severity": severity,
                    "location": f"{host_addr}:{port_id}",
                    "evidence": f"State: open | Service: {service_desc}",
                    "metadata": {
                        "cweid": "200",
                        "confidence": "high",
                        "scanner": "nmap",
                        "port": port_id,
                        "protocol": protocol,
                        "service": service_name,
                        "version": service_version,
                        "owasp": "A05:2021-Security Misconfiguration",
                    },
                })

        return findings
