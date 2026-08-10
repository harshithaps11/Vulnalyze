"""
SSRF Protection — Validates target URLs before scanning.
Blocks internal/private network addresses to prevent Server-Side Request Forgery.
"""
import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple


# Private/reserved CIDR blocks that must never be scanned
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),         # RFC1918
    ipaddress.ip_network("172.16.0.0/12"),      # RFC1918
    ipaddress.ip_network("192.168.0.0/16"),     # RFC1918
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local (includes cloud metadata 169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),          # "This" network
    ipaddress.ip_network("::1/128"),            # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),           # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),          # IPv6 link-local
]

# Hostnames that must always be blocked
_BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",        # GCP metadata
    "metadata.internal",
}


def validate_scan_target(url: str) -> Tuple[bool, str]:
    """
    Validate a scan target URL against SSRF protections.

    Returns:
        (is_valid, reason) — True if safe to scan, False with explanation if blocked.
    """
    if not url or not url.strip():
        return False, "URL is empty"

    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format"

    # Must have a scheme
    if parsed.scheme not in ("http", "https"):
        return False, f"Unsupported scheme: {parsed.scheme!r}. Only http:// and https:// are allowed."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL has no hostname"

    # Check blocked hostnames
    hostname_lower = hostname.lower()
    if hostname_lower in _BLOCKED_HOSTNAMES:
        return False, f"Hostname {hostname!r} is blocked (internal/reserved)"

    # Resolve hostname to IP and check against blocked networks
    try:
        addr_infos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for _family, _type, _proto, _canonname, sockaddr in addr_infos:
            ip_str = sockaddr[0]
            try:
                ip = ipaddress.ip_address(ip_str)
                for network in _BLOCKED_NETWORKS:
                    if ip in network:
                        return False, f"IP {ip_str} resolves to a blocked private/reserved network ({network})"
            except ValueError:
                continue
    except socket.gaierror:
        # DNS resolution failed — allow the scan attempt; the scanner will handle the error
        pass

    return True, "OK"
