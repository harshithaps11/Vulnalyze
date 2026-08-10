# Vulnalyze — Application Security Platform

An integrated security scanning platform combining static analysis (SAST), dynamic analysis (DAST), dependency scanning, IaC scanning, and AI-powered remediation.

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────┐
│   Frontend   │───▶│   FastAPI Backend │───▶│  PostgreSQL   │
│  React/Vite  │    │   (API + Scan)   │    │  (or SQLite)  │
└─────────────┘    └──────┬───────────┘    └───────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Semgrep  │ │  ZAP     │ │ AI Agent │
        │ (SAST)   │ │ (DAST)   │ │(LangChain│
        └──────────┘ └──────────┘ └──────────┘
```

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Static Analysis (SAST)** | ✅ Working | Semgrep + 30+ built-in regex rules |
| **HTTP Header Scan** | ✅ Working | Real httpx requests, OWASP headers |
| **Dynamic Analysis (DAST)** | ✅ Working | OWASP ZAP (falls back to header scan) |
| **AI Remediation** | ✅ Working | LangChain + OpenRouter + Ollama + rule-based fallback |
| **Dependency Scanning** | ✅ Available | pip-audit + npm audit (optional) |
| **IaC Scanning** | ✅ Available | Terraform, Docker, K8s patterns |
| **Container Scanning** | ✅ Available | Trivy wrapper (optional) |
| **Network Scanning** | ✅ Available | Nmap wrapper (optional) |
| **SARIF Export** | ✅ Available | v2.1.0, GitHub Security compatible |
| **SSRF Protection** | ✅ Enforced | Blocks private/reserved IPs |
| **Audit Logging** | ✅ Available | Tracks security-relevant actions |
| **JWT Authentication** | ✅ Working | bcrypt + HS256 |
| **RBAC** | ✅ Working | ADMIN, USER, SECURITY_ANALYST |

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- (Optional) Docker & Docker Compose

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/harshithaps11/Vulnalyze.git
cd Vulnalyze

# 2. Set up environment
cp .env.example .env
# Edit .env with your values (especially SECRET_KEY)

# 3. Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python setup_db.py
uvicorn app.main:app --reload

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Services: Backend (:8000), Frontend (:5173), PostgreSQL (:5432), Redis (:6379), ZAP (:8080)

### Default Dev Credentials

> ⚠️ **DEVELOPMENT ONLY** — Change immediately in production.

- **Email:** `admin@vulnalyze.com`
- **Password:** `admin123`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | JWT login |
| POST | `/api/v1/auth/register` | User registration |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/scans` | Create a new scan |
| GET | `/api/v1/scans` | List recent scans |
| GET | `/api/v1/scans/{id}` | Get scan details |
| GET | `/api/v1/scans/{id}/status` | Poll scan status |
| GET | `/api/v1/scans/{id}/summary` | Severity breakdown |
| GET | `/api/v1/scans/{id}/sarif` | SARIF v2.1.0 export |
| POST | `/api/v1/scans/{id}/ai-analyze` | AI remediation |
| PUT | `/api/v1/scans/{id}/vulnerabilities/{vid}` | Mark false positive |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/health/ready` | Readiness check |
| POST | `/api/analyze` | AI code analysis |
| POST | `/api/fix` | AI code fix |
| POST | `/api/explain` | AI code explanation |
| POST | `/api/best-practices` | AI best practices |
| POST | `/api/performance` | AI performance analysis |

## Scanner Capabilities

### Built-in Rule Engine (30+ rules)
- **A01** Broken Access Control (IDOR, session tampering)
- **A02** Cryptographic Failures (MD5, SHA-1, DES, hardcoded secrets)
- **A03** Injection (XSS, SQLi, command injection, XXE, YAML, pickle)
- **A04** Insecure Design (debug mode)
- **A05** Security Misconfiguration (SSL bypass, wildcard CORS)
- **A07** Authentication Failures (JWT none, auth bypass, insecure random)
- **A08** Software Integrity (dynamic imports)
- **A09** Logging Failures (sensitive data in logs)
- **A10** SSRF (user-controlled URLs)
- **AI/LLM** Prompt injection, API key exposure, unvalidated LLM output

### External Scanners (Optional)
- **Semgrep** — Professional SAST rules (`auto` config)
- **OWASP ZAP** — Full spider + active scan DAST
- **pip-audit** / **npm audit** — Dependency vulnerability scanning
- **Trivy** — Container image vulnerability scanning
- **Nmap** — Network port/service scanning

## Running Tests

```bash
# Backend tests
cd backend && python -m pytest tests/ -v

# Security test benchmark
python security-tests/test_detection.py

# Frontend build
cd frontend && npm run build
```

## License

See [LICENSE](./LICENSE) for details.
