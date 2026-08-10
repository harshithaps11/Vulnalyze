import asyncio
import json
import os
import re
import tempfile
import httpx
from pathlib import Path
from typing import List, Dict, Any
from app.core.config import get_settings
from app.models.models import Vulnerability, VulnerabilitySeverity

settings = get_settings()

# Initialize Redis client optionally
redis_client = None
try:
    import redis.asyncio as redis
    if settings.REDIS_HOST:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
except Exception as e:
    print(f"Redis not available (optional): {str(e)}")

# Initialize Celery optionally (requires RabbitMQ)
celery_app = None
try:
    from celery import Celery
    if settings.RABBITMQ_HOST:
        celery_app = Celery(
            'vulnalyze',
            broker=f'amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}@{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}//'
        )
except Exception as e:
    print(f"Celery/RabbitMQ not available (optional): {str(e)}")


# ---------------------------------------------------------------------------
# OWASP Top 10 + AI Security Pattern Definitions
# ---------------------------------------------------------------------------
# Each rule: (regex_pattern, title, description, severity, cwe_id, confidence)
VULN_RULES = [
    # ── A01: Broken Access Control ──────────────────────────────────────────
    (
        r"request\.(user|session)\s*=\s*",
        "Broken Access Control — Session Tampering",
        "Direct assignment to request.user or request.session can allow privilege escalation.",
        VulnerabilitySeverity.HIGH, "284", "high"
    ),
    (
        r"\.hasRole\(|isAdmin\s*==\s*True|is_admin\s*==\s*true",
        "Insecure Direct Object Reference (IDOR)",
        "Hard-coded role or admin check may be bypassed; use proper RBAC/ABAC frameworks.",
        VulnerabilitySeverity.MEDIUM, "639", "medium"
    ),

    # ── A02: Cryptographic Failures ──────────────────────────────────────────
    (
        r"\bmd5\s*\(|\bMD5\s*\(|hashlib\.md5",
        "Weak Cryptographic Hash — MD5",
        "MD5 is cryptographically broken; use SHA-256 or bcrypt for password hashing.",
        VulnerabilitySeverity.HIGH, "327", "high"
    ),
    (
        r"\bsha1\s*\(|\bsha-1\b|hashlib\.sha1",
        "Weak Cryptographic Hash — SHA-1",
        "SHA-1 is deprecated for cryptographic use; replace with SHA-256 or stronger.",
        VulnerabilitySeverity.HIGH, "327", "high"
    ),
    (
        r"DES\s*\.|3DES\s*\.|RC4\s*\.",
        "Weak Cipher Algorithm",
        "DES, 3DES, and RC4 are obsolete ciphers; use AES-256-GCM.",
        VulnerabilitySeverity.HIGH, "327", "high"
    ),
    (
        r"password\s*=\s*['\"][^'\"]{1,20}['\"]|passwd\s*=\s*['\"][^'\"]{1,20}['\"]",
        "Hardcoded Password / Secret",
        "Password or secret is hardcoded in source code; use environment variables or a secrets manager.",
        VulnerabilitySeverity.CRITICAL, "798", "high"
    ),
    (
        r"(?:api_key|API_KEY|secret_key|SECRET_KEY|token)\s*=\s*['\"][A-Za-z0-9_\-]{10,}['\"]",
        "Hardcoded API Key / Token",
        "API key or secret token is hardcoded; store in environment variables or a vault.",
        VulnerabilitySeverity.CRITICAL, "798", "high"
    ),

    # ── A03: Injection ───────────────────────────────────────────────────────
    (
        r"innerHTML\s*=(?!=)|\.write\s*\(",
        "Cross-Site Scripting (XSS) — Unsafe DOM Write",
        "Assigning unsanitized user input to innerHTML or document.write() enables XSS attacks.",
        VulnerabilitySeverity.HIGH, "79", "high"
    ),
    (
        r"(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)[\s\S]{0,60}['\"\s]\+|f['\"].*SELECT.*\{",
        "SQL Injection — String Concatenation",
        "SQL query built with string concatenation or f-string; use parameterized queries / ORM.",
        VulnerabilitySeverity.HIGH, "89", "high"
    ),
    (
        r"\beval\s*\(|\bexec\s*\(|\bexecfile\s*\(|\bcompile\s*\(",
        "Command/Code Injection — Dynamic Code Execution",
        "Dynamic execution of user-controlled code (eval/exec) enables remote code execution.",
        VulnerabilitySeverity.HIGH, "78", "high"
    ),
    (
        r"subprocess\.call\(.*shell\s*=\s*True|os\.system\s*\(|os\.popen\s*\(",
        "OS Command Injection",
        "Shell command built with user input; use subprocess with a list and shell=False.",
        VulnerabilitySeverity.HIGH, "78", "high"
    ),
    (
        r"Runtime\.getRuntime\(\)\.exec\(|ProcessBuilder\(",
        "Java Command Injection",
        "Java Runtime.exec() or ProcessBuilder with unsanitized input allows OS command injection.",
        VulnerabilitySeverity.HIGH, "78", "high"
    ),
    (
        r"xmlrpclib\.|etree\.fromstring\(|lxml\.etree|parseString\(",
        "XML External Entity (XXE) Injection",
        "XML parser may process external entities; disable DTD processing and external entities.",
        VulnerabilitySeverity.HIGH, "611", "medium"
    ),
    (
        r"yaml\.load\s*\([^)]*Loader\s*=\s*None|\byaml\.load\s*\([^)]*\)",
        "Unsafe YAML Deserialization",
        "yaml.load() without SafeLoader can execute arbitrary Python code; use yaml.safe_load().",
        VulnerabilitySeverity.HIGH, "502", "high"
    ),
    (
        r"pickle\.loads?\s*\(|marshal\.loads?\s*\(|shelve\.open\s*\(",
        "Insecure Deserialization — Pickle/Marshal",
        "Deserializing untrusted data with pickle/marshal allows arbitrary code execution.",
        VulnerabilitySeverity.CRITICAL, "502", "high"
    ),

    # ── A04: Insecure Design ─────────────────────────────────────────────────
    (
        r"DEBUG\s*=\s*True|APP_DEBUG\s*=\s*true|debug\s*=\s*True",
        "Debug Mode Enabled",
        "Debug mode is enabled; this exposes stack traces and internal details in production.",
        VulnerabilitySeverity.MEDIUM, "94", "high"
    ),

    # ── A05: Security Misconfiguration ───────────────────────────────────────
    (
        r"verify\s*=\s*False|VERIFY_SSL\s*=\s*False|ssl_verify\s*=\s*False|rejectUnauthorized\s*:\s*false",
        "SSL Certificate Verification Disabled",
        "Disabling SSL certificate verification allows man-in-the-middle attacks.",
        VulnerabilitySeverity.HIGH, "295", "high"
    ),
    (
        r"allow_origins\s*=\s*\[?\s*['\*]['\]|cors\s*\(\s*\{\s*origin\s*:\s*['\*]",
        "Wildcard CORS Policy",
        "Allowing all origins (*) in CORS policy exposes APIs to cross-origin attacks.",
        VulnerabilitySeverity.MEDIUM, "346", "medium"
    ),

    # ── A07: Authentication Failures ─────────────────────────────────────────
    (
        r"jwt\.decode\(.*algorithms\s*=\s*\[.*none.*\]|alg.*none",
        "JWT Algorithm 'none' Attack",
        "JWT decoded with 'none' algorithm allows forgery of tokens without a signature.",
        VulnerabilitySeverity.CRITICAL, "347", "high"
    ),
    (
        r"token_required\s*=\s*False|@login_required.*skip|require_auth\s*=\s*False",
        "Authentication Bypass",
        "Authentication requirement is skipped or disabled; all endpoints must enforce auth.",
        VulnerabilitySeverity.HIGH, "306", "high"
    ),
    (
        r"random\s*\.\s*random\(\)|Math\.random\(\)",
        "Insecure Random — Not Cryptographically Secure",
        "Math.random() / random.random() is not cryptographically secure; use secrets module or crypto.getRandomValues().",
        VulnerabilitySeverity.MEDIUM, "338", "high"
    ),

    # ── A08: Software and Data Integrity ────────────────────────────────────
    (
        r"__import__\s*\(|importlib\.import_module\s*\(",
        "Dynamic Module Import",
        "Dynamic imports from user-controlled input allow arbitrary code loading.",
        VulnerabilitySeverity.HIGH, "94", "medium"
    ),

    # ── A09: Logging Failures ────────────────────────────────────────────────
    (
        r"print\s*\(\s*password|print\s*\(\s*token|console\.log\s*\(\s*password|console\.log\s*\(\s*secret",
        "Sensitive Data Logged",
        "Password or secret token is being logged; remove sensitive data from log statements.",
        VulnerabilitySeverity.MEDIUM, "532", "high"
    ),

    # ── A10: SSRF ────────────────────────────────────────────────────────────
    (
        r"requests\.get\(.*request\.|httpx\.get\(.*request\.|fetch\s*\(\s*req\.",
        "Server-Side Request Forgery (SSRF)",
        "User-controlled URL passed to HTTP client may allow SSRF — validate and allowlist URLs.",
        VulnerabilitySeverity.HIGH, "918", "medium"
    ),

    # ── AI / LLM Security (Aviatrix-relevant) ──────────────────────────────
    (
        r"openai\.api_key\s*=\s*['\"][A-Za-z0-9_\-]{10,}['\"]|OPENAI_API_KEY\s*=\s*['\"][^'\"]+['\"]",
        "AI Credential Exposure — OpenAI Key Hardcoded",
        "OpenAI API key is hardcoded; store in environment variables. Exposed keys risk billing abuse and data leakage.",
        VulnerabilitySeverity.CRITICAL, "798", "high"
    ),
    (
        r"anthropic\.Anthropic\(api_key\s*=\s*['\"]|ANTHROPIC_API_KEY\s*=\s*['\"][^'\"]+['\"]",
        "AI Credential Exposure — Anthropic Key Hardcoded",
        "Anthropic API key is hardcoded in source; use environment variables to prevent leakage.",
        VulnerabilitySeverity.CRITICAL, "798", "high"
    ),
    (
        r"f['\"].*\{.*user.*\}.*['\"].*(?:prompt|llm|chat|completion)|prompt\s*=\s*f['\"].*\{",
        "Prompt Injection Risk — Unsanitized User Input in LLM Prompt",
        "User-controlled input is interpolated directly into an LLM prompt without sanitization, enabling prompt injection attacks.",
        VulnerabilitySeverity.HIGH, "94", "high"
    ),
    (
        r"system_prompt\s*=\s*['\"]|SYSTEM_PROMPT\s*=\s*['\"]",
        "LLM System Prompt Exposure",
        "System prompt is hardcoded in source; consider externalizing to config to prevent leakage via code exposure.",
        VulnerabilitySeverity.MEDIUM, "312", "medium"
    ),
    (
        r"(?:llm|model|chain)\.(?:invoke|run|call|predict)\(.*request\.|response\[.*(output|content|text)\]\s*[^;]",
        "Unvalidated LLM Output",
        "LLM output is used directly without validation; AI responses must be sanitized before use to prevent XSS or injection.",
        VulnerabilitySeverity.MEDIUM, "116", "medium"
    ),
    (
        r"langchain.*ConversationBufferMemory|memory\.chat_memory",
        "Unbounded LLM Conversation Memory",
        "Using ConversationBufferMemory without size limits can expose prior conversation context across sessions.",
        VulnerabilitySeverity.LOW, "400", "medium"
    ),
]


class ScannerService:
    def __init__(self):
        try:
            from zapv2 import ZAPv2
            self.zap = ZAPv2(
                apikey=settings.ZAP_API_KEY,
                proxies={'http': f'http://{settings.ZAP_HOST}:{settings.ZAP_PORT}',
                        'https': f'http://{settings.ZAP_HOST}:{settings.ZAP_PORT}'}
            )
        except Exception as e:
            print(f"ZAP client initialization warning: {str(e)}")
            self.zap = None

    async def run_semgrep(self, code: str, language: str = "auto") -> List[Dict[str, Any]]:
        """Run Semgrep static analysis on the provided code."""
        temp_file_path = None
        # Determine file extension
        ext_map = {"python": ".py", "javascript": ".js", "java": ".java", "typescript": ".ts"}
        ext = ext_map.get(language, ".js")
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix=ext, delete=False, encoding='utf-8') as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            import subprocess
            import sys
            # Use semgrep from the same venv as Python so it's always found
            venv_bin = Path(sys.executable).parent
            semgrep_bin = str(venv_bin / "semgrep")
            cmd = [semgrep_bin, "scan", "--config", "auto", "--json", "--quiet", temp_file_path]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if res.returncode not in (0, 1):
                raise RuntimeError(f"Semgrep exit {res.returncode}: {res.stderr[:200]}")
            data = json.loads(res.stdout)

            vulnerabilities = []
            for result in data.get('results', []):
                vuln = {
                    'title': result['extra'].get('metadata', {}).get('owasp', result['check_id'].split('.')[-1].replace('-', ' ').title()),
                    'description': result['extra']['message'],
                    'severity': self._map_semgrep_severity(result['extra']['severity']),
                    'location': f"code:{result['start']['line']}",
                    'evidence': result['extra'].get('lines', '').strip()[:300],
                    'metadata': {
                        'rule_id': result['check_id'],
                        'confidence': result['extra'].get('metadata', {}).get('confidence', 'medium'),
                        'scanner': 'semgrep'
                    }
                }
                vulnerabilities.append(vuln)
            print(f"Semgrep found {len(vulnerabilities)} findings.")
            # Always also run our enhanced rule-based scanner and merge
            rule_based = self._real_static_scan(code)
            # De-duplicate by title+location
            seen = {(v['title'], v['location']) for v in vulnerabilities}
            for v in rule_based:
                if (v['title'], v['location']) not in seen:
                    vulnerabilities.append(v)
                    seen.add((v['title'], v['location']))
            return vulnerabilities
        except FileNotFoundError:
            print("Semgrep not found — using enhanced rule-based scanner.")
            return self._real_static_scan(code)
        except Exception as e:
            print(f"Semgrep execution failed ({e}) — using enhanced rule-based scanner.")
            return self._real_static_scan(code)
        finally:
            if temp_file_path:
                try:
                    Path(temp_file_path).unlink(missing_ok=True)
                except Exception:
                    pass

    def _real_static_scan(self, code: str) -> List[Dict[str, Any]]:
        """
        Enhanced static scanner: 30+ OWASP Top 10 + AI security rules across
        Python, JavaScript, Java, SQL. Each rule fires on a per-line basis.
        """
        vulnerabilities = []
        lines = code.split('\n')

        for idx, line in enumerate(lines):
            line_num = idx + 1
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith('//'):
                continue

            for (pattern, title, description, severity, cwe_id, confidence) in VULN_RULES:
                try:
                    match = re.search(pattern, line, re.IGNORECASE)
                except re.error:
                    continue
                if match:
                    vulnerabilities.append({
                        'title': title,
                        'description': description,
                        'severity': severity,
                        'location': f"code:line {line_num}",
                        'evidence': stripped[:200],
                        'metadata': {
                            'cweid': cwe_id,
                            'confidence': confidence,
                            'scanner': 'vulnalyze-ruleset',
                            'line': line_num,
                            'owasp': self._cwe_to_owasp(cwe_id)
                        }
                    })
        return vulnerabilities

    def _cwe_to_owasp(self, cwe_id: str) -> str:
        mapping = {
            "79": "A03:2021-Injection",
            "89": "A03:2021-Injection",
            "78": "A03:2021-Injection",
            "94": "A03:2021-Injection",
            "502": "A08:2021-Software and Data Integrity Failures",
            "327": "A02:2021-Cryptographic Failures",
            "798": "A02:2021-Cryptographic Failures",
            "347": "A07:2021-Identification and Authentication Failures",
            "306": "A07:2021-Identification and Authentication Failures",
            "338": "A07:2021-Identification and Authentication Failures",
            "284": "A01:2021-Broken Access Control",
            "639": "A01:2021-Broken Access Control",
            "295": "A05:2021-Security Misconfiguration",
            "346": "A05:2021-Security Misconfiguration",
            "532": "A09:2021-Security Logging and Monitoring Failures",
            "918": "A10:2021-Server-Side Request Forgery",
            "611": "A03:2021-Injection",
            "312": "A02:2021-Cryptographic Failures",
            "116": "A03:2021-Injection",
            "400": "A04:2021-Insecure Design",
        }
        return mapping.get(cwe_id, "OWASP Top 10")

    async def run_http_header_scan(self, url: str) -> List[Dict[str, Any]]:
        """
        Real HTTP security header scanner — no ZAP needed.
        Checks for missing/weak security headers per OWASP Security Headers Project.
        """
        vulnerabilities = []
        headers_to_send = {"User-Agent": "Vulnalyze-Security-Scanner/1.0 (Mozilla/5.0; Windows NT 10.0; Win64; x64)"}
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True, verify=False, headers=headers_to_send) as client:
                try:
                    response = await client.get(url)
                except Exception as e:
                    return [{
                        'title': 'URL Not Reachable',
                        'description': f'The target URL could not be reached: {str(e)[:150]}. Dynamic header scan skipped.',
                        'severity': VulnerabilitySeverity.LOW,
                        'location': url,
                        'evidence': str(e)[:200],
                        'metadata': {'cweid': '16', 'confidence': 'high', 'scanner': 'header-scan'}
                    }]

            headers = {k.lower(): v for k, v in response.headers.items()}

            # Rule: Missing Content-Security-Policy
            if 'content-security-policy' not in headers:
                vulnerabilities.append({
                    'title': 'Missing Content-Security-Policy Header',
                    'description': 'No CSP header found. CSP prevents XSS, clickjacking, and data injection attacks by controlling resource loading.',
                    'severity': VulnerabilitySeverity.HIGH,
                    'location': url,
                    'evidence': 'Header not present in HTTP response',
                    'metadata': {'cweid': '79', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Missing Strict-Transport-Security
            if 'strict-transport-security' not in headers:
                vulnerabilities.append({
                    'title': 'Missing HTTP Strict-Transport-Security (HSTS)',
                    'description': 'HSTS header is absent. Without it, browsers may downgrade to HTTP allowing MITM attacks.',
                    'severity': VulnerabilitySeverity.HIGH,
                    'location': url,
                    'evidence': 'Strict-Transport-Security not in response headers',
                    'metadata': {'cweid': '319', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A02:2021-Cryptographic Failures'}
                })

            # Rule: Missing X-Frame-Options
            if 'x-frame-options' not in headers and 'content-security-policy' not in headers:
                vulnerabilities.append({
                    'title': 'Missing X-Frame-Options — Clickjacking Risk',
                    'description': 'X-Frame-Options header is not set. The page can be embedded in an iframe enabling clickjacking attacks.',
                    'severity': VulnerabilitySeverity.MEDIUM,
                    'location': url,
                    'evidence': 'X-Frame-Options not in response headers',
                    'metadata': {'cweid': '1021', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Missing X-Content-Type-Options
            if 'x-content-type-options' not in headers:
                vulnerabilities.append({
                    'title': 'Missing X-Content-Type-Options Header',
                    'description': 'Without "nosniff", browsers may MIME-sniff responses away from the declared content-type.',
                    'severity': VulnerabilitySeverity.MEDIUM,
                    'location': url,
                    'evidence': 'X-Content-Type-Options not in response headers',
                    'metadata': {'cweid': '16', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Missing Referrer-Policy
            if 'referrer-policy' not in headers:
                vulnerabilities.append({
                    'title': 'Missing Referrer-Policy Header',
                    'description': 'No Referrer-Policy header; browsers may leak full URL paths in the Referer header to third parties.',
                    'severity': VulnerabilitySeverity.LOW,
                    'location': url,
                    'evidence': 'Referrer-Policy not in response headers',
                    'metadata': {'cweid': '200', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Missing Permissions-Policy
            if 'permissions-policy' not in headers:
                vulnerabilities.append({
                    'title': 'Missing Permissions-Policy Header',
                    'description': 'Permissions-Policy is absent; browser features (camera, microphone, geolocation) are not restricted.',
                    'severity': VulnerabilitySeverity.LOW,
                    'location': url,
                    'evidence': 'Permissions-Policy not in response headers',
                    'metadata': {'cweid': '16', 'confidence': 'medium', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Server header exposes version
            server_header = headers.get('server', '')
            if server_header and any(c.isdigit() for c in server_header):
                vulnerabilities.append({
                    'title': 'Server Version Disclosure',
                    'description': f'Server header reveals version info: "{server_header}". This aids targeted attacks.',
                    'severity': VulnerabilitySeverity.LOW,
                    'location': url,
                    'evidence': f'Server: {server_header}',
                    'metadata': {'cweid': '200', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: X-Powered-By header
            if 'x-powered-by' in headers:
                vulnerabilities.append({
                    'title': 'X-Powered-By Header Exposed',
                    'description': f'X-Powered-By header reveals technology stack: "{headers["x-powered-by"]}". Remove to reduce information leakage.',
                    'severity': VulnerabilitySeverity.LOW,
                    'location': url,
                    'evidence': f'X-Powered-By: {headers["x-powered-by"]}',
                    'metadata': {'cweid': '200', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A05:2021-Security Misconfiguration'}
                })

            # Rule: Missing Anti-CSRF (heuristic)
            if response.status_code == 200 and 'set-cookie' in headers:
                cookie_header = headers['set-cookie']
                if 'samesite' not in cookie_header.lower():
                    vulnerabilities.append({
                        'title': 'Cookie Missing SameSite Attribute — CSRF Risk',
                        'description': 'Session cookie does not have SameSite=Strict or Lax, making it vulnerable to Cross-Site Request Forgery.',
                        'severity': VulnerabilitySeverity.MEDIUM,
                        'location': url,
                        'evidence': f'Set-Cookie: {cookie_header[:150]}',
                        'metadata': {'cweid': '352', 'confidence': 'medium', 'scanner': 'header-scan', 'owasp': 'A01:2021-Broken Access Control'}
                    })
                if 'httponly' not in cookie_header.lower():
                    vulnerabilities.append({
                        'title': 'Cookie Missing HttpOnly Flag',
                        'description': 'Session cookie is accessible via JavaScript (no HttpOnly); XSS can steal session tokens.',
                        'severity': VulnerabilitySeverity.MEDIUM,
                        'location': url,
                        'evidence': f'Set-Cookie: {cookie_header[:150]}',
                        'metadata': {'cweid': '1004', 'confidence': 'high', 'scanner': 'header-scan', 'owasp': 'A07:2021-Identification and Authentication Failures'}
                    })

            print(f"HTTP header scan found {len(vulnerabilities)} findings for {url}")
        except Exception as e:
            print(f"HTTP header scan error: {e}")
        return vulnerabilities

    async def run_zap(self, url: str) -> List[Dict[str, Any]]:
        """Run OWASP ZAP dynamic analysis if available, otherwise real HTTP header scan."""
        try:
            if not self.zap or not settings.ZAP_API_KEY:
                raise ValueError("ZAP client or API key not configured — falling back to HTTP header scan")
            # Start new scan
            scan_id = self.zap.spider.scan(url)
            while int(self.zap.spider.status(scan_id)) < 100:
                await asyncio.sleep(5)
            active_scan_id = self.zap.ascan.scan(url)
            while int(self.zap.ascan.status(active_scan_id)) < 100:
                await asyncio.sleep(5)
            alerts = self.zap.core.alerts()
            vulnerabilities = []
            for alert in alerts:
                vuln = {
                    'title': alert['name'],
                    'description': alert['description'],
                    'severity': self._map_zap_severity(alert['risk']),
                    'location': alert['url'],
                    'evidence': alert['evidence'],
                    'metadata': {
                        'cweid': alert.get('cweid'),
                        'wascid': alert.get('wascid'),
                        'confidence': alert.get('confidence', 'medium'),
                        'scanner': 'owasp-zap'
                    }
                }
                vulnerabilities.append(vuln)
            return vulnerabilities
        except Exception as e:
            print(f"OWASP ZAP not available ({e}) — running real HTTP header scan instead.")
            return await self.run_http_header_scan(url)

    def _map_semgrep_severity(self, severity: str) -> VulnerabilitySeverity:
        severity_map = {
            'ERROR': VulnerabilitySeverity.HIGH,
            'WARNING': VulnerabilitySeverity.MEDIUM,
            'INFO': VulnerabilitySeverity.LOW
        }
        return severity_map.get(severity.upper(), VulnerabilitySeverity.LOW)

    def _map_zap_severity(self, risk: str) -> VulnerabilitySeverity:
        risk_map = {
            'High': VulnerabilitySeverity.HIGH,
            'Medium': VulnerabilitySeverity.MEDIUM,
            'Low': VulnerabilitySeverity.LOW,
            'Informational': VulnerabilitySeverity.LOW
        }
        return risk_map.get(risk, VulnerabilitySeverity.LOW)

    async def get_cached_results(self, key: str) -> List[Dict[str, Any]]:
        try:
            if redis_client:
                cached = await redis_client.get(key)
                if cached:
                    return json.loads(cached)
        except Exception as e:
            print(f"Redis get error: {str(e)}")
        return None

    async def cache_results(self, key: str, results: List[Dict[str, Any]], ttl: int = 86400):
        try:
            if redis_client:
                await redis_client.setex(key, ttl, json.dumps(results))
        except Exception as e:
            print(f"Redis set error: {str(e)}")


def run_hybrid_scan(scan_id: str, code: str, url: str):
    """Run hybrid scan (registered as Celery task when available)."""
    scanner = ScannerService()
    static_results = asyncio.run(scanner.run_semgrep(code)) if code else []
    dynamic_results = asyncio.run(scanner.run_zap(url)) if url else []
    all_results = static_results + dynamic_results
    asyncio.run(scanner.cache_results(f"scan:{scan_id}", all_results))
    return all_results

# Register as Celery task when Celery is available
if celery_app is not None:
    run_hybrid_scan = celery_app.task(run_hybrid_scan)


async def run_scan_task_in_background(scan_uuid: str, code: str, url: str):
    """Async background task to run the hybrid scan and save results to SQLite/Postgres DB."""
    from app.db.session import AsyncSessionLocal
    from app.models.models import Scan, Vulnerability, ScanStatus, VulnerabilitySeverity, FindingStatus
    from app.services.ssrf_protection import validate_scan_target
    from app.services.iac_scanner import IaCScanner
    from app.services.risk_engine import calculate_risk_score
    from sqlalchemy import select
    from uuid import UUID

    print(f"Starting background scan task for UUID: {scan_uuid}")

    # 1. Update Scan Status to RUNNING
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Scan).where(Scan.uuid == UUID(scan_uuid)))
        db_scan = result.scalar_one_or_none()
        if not db_scan:
            print(f"Scan record not found for UUID: {scan_uuid}")
            return
        db_scan.status = ScanStatus.RUNNING
        await db.commit()

    # 2. SSRF Target Validation
    if url and url not in ("", "http://", "https://"):
        is_safe, reason = validate_scan_target(url)
        if not is_safe:
            print(f"SSRF Protection blocked URL target: {url} ({reason})")
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Scan).where(Scan.uuid == UUID(scan_uuid)))
                db_scan = result.scalar_one_or_none()
                if db_scan:
                    db_vuln = Vulnerability(
                        scan_id=db_scan.id,
                        title="SSRF Protection — Target Blocked",
                        description=f"Target URL {url} was blocked by Server-Side Request Forgery protection: {reason}",
                        severity=VulnerabilitySeverity.HIGH,
                        location=url,
                        evidence=reason,
                        cwe_id="918",
                        owasp_category="A10:2021-Server-Side Request Forgery",
                        scanner_name="ssrf-protection",
                        finding_status=FindingStatus.OPEN,
                        vuln_metadata={"blocked_reason": reason}
                    )
                    db.add(db_vuln)
                    db_scan.status = ScanStatus.COMPLETED
                    db_scan.results = {"vulnerabilities_count": 1, "ssrf_blocked": True}
                    await db.commit()
            return

    # 3. Run all scanner engines
    scanner = ScannerService()
    static_results = []
    dynamic_results = []
    iac_results = []

    if code:
        # Run static Semgrep / Rule scanner
        static_results = await scanner.run_semgrep(code)
        # Run IaC pattern scanner
        iac_scanner = IaCScanner()
        iac_results = await iac_scanner.scan_content(code, "source_code.py")

    if url and url not in ("", "http://", "https://"):
        dynamic_results = await scanner.run_zap(url)

    all_results = static_results + iac_results + dynamic_results

    # 4. Cache results (if Redis exists)
    await scanner.cache_results(f"scan:{scan_uuid}", all_results)

    # 5. Save results to DB with extended fields and update Scan Status
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Scan).where(Scan.uuid == UUID(scan_uuid)))
        db_scan = result.scalar_one_or_none()
        if not db_scan:
            print(f"Scan record not found on database update for UUID: {scan_uuid}")
            return

        for res in all_results:
            evidence = res.get('evidence') or ''
            if isinstance(evidence, str):
                evidence = evidence[:500]

            meta = res.get('metadata', {})
            sev_raw = res.get('severity', VulnerabilitySeverity.LOW)
            if isinstance(sev_raw, str):
                try:
                    sev = VulnerabilitySeverity(sev_raw.lower())
                except ValueError:
                    sev = VulnerabilitySeverity.LOW
            else:
                sev = sev_raw

            db_vuln = Vulnerability(
                scan_id=db_scan.id,
                title=str(res['title'])[:255],
                description=str(res['description']),
                severity=sev,
                location=str(res['location'])[:255],
                evidence=evidence,
                rule_id=meta.get('rule_id', ''),
                cwe_id=str(meta.get('cweid', '')),
                owasp_category=meta.get('owasp', ''),
                confidence=meta.get('confidence', 'medium'),
                scanner_name=meta.get('scanner', 'vulnalyze-engine'),
                finding_status=FindingStatus.OPEN,
                vuln_metadata=meta
            )
            db.add(db_vuln)

        risk_score = calculate_risk_score(all_results)
        db_scan.status = ScanStatus.COMPLETED
        db_scan.results = {
            "vulnerabilities_count": len(all_results),
            "risk_score": risk_score
        }
        await db.commit()
        print(f"Scan {scan_uuid} completed — {len(all_results)} vulnerabilities saved (Risk Score: {risk_score}/10).")