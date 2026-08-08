# Vulnalyze 🛡️

**AI-powered security vulnerability scanner** — static code analysis + dynamic DAST scanning with a beautiful React dashboard.

---

## Quick Start (Docker)

```bash
git clone https://github.com/your-username/Vulnalyze.git
cd Vulnalyze

# Copy and configure environment variables
cp .env.example .env

# Start everything — PostgreSQL + FastAPI backend + React frontend
docker compose up
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

> **Default credentials:** `admin@vulnalyze.com` / `admin123`

---

## Project Structure

```
Vulnalyze/
├── frontend/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # UI components (dashboard, scan, results)
│   │   ├── pages/             # Route-level pages
│   │   ├── services/          # API client (axios)
│   │   └── data/              # Mock data (fallback only)
│   ├── Dockerfile
│   └── package.json
│
├── backend/                   # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   ├── core/              # Config, settings
│   │   ├── db/                # DB session
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/
│   │   │   └── scanner.py     # Static (regex/AST) + dynamic (ZAP) scanner
│   │   └── main.py            # FastAPI app entry point
│   ├── Dockerfile
│   ├── requirements.txt
│   └── setup_db.py            # DB init + seed script
│
├── docker-compose.yml         # One-command startup
├── .env.example               # Environment variable template
└── README.md
```

---

## Running Without Docker

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python setup_db.py           # Creates SQLite DB + seed data
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## How Scanning Works

```
User submits scan
      ↓
POST /api/v1/scans  (FastAPI)
      ↓
Background Task starts
      ↓
Static Scanner (regex/AST on source code)
  + Dynamic Scanner (OWASP ZAP or fallback)
      ↓
Results saved to PostgreSQL
      ↓
GET /api/v1/scans/{uuid}  →  React Dashboard
```

The scanner detects:
- **XSS** — unsafe `innerHTML` without `DOMPurify`
- **SQL Injection** — string concatenation in SQL queries
- **Command Injection** — `eval()`, `exec()`, `spawn()`
- **Weak Crypto** — MD5 / SHA-1 usage

---

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind  |
| Backend   | FastAPI, SQLAlchemy (async), uvicorn  |
| Database  | PostgreSQL (Docker) / SQLite (local)  |
| Scanner   | Semgrep (optional) + regex/AST fallback + OWASP ZAP (optional) |
| Auth      | JWT (python-jose) + bcrypt            |

## CI/CD

Vulnalyze includes a GitHub Actions pipeline that runs backend tests and frontend production builds on every pull request. On pushes to `main` or version tags, the workflow also builds and publishes Docker images for the backend and frontend to GitHub Container Registry.

---

## Environment Variables

See [`.env.example`](.env.example) for all available variables.

Key variables:
- `POSTGRES_*` — database connection (auto-configured in Docker)
- `SECRET_KEY` — JWT signing key (**change in production**)
- `OPENROUTER_API_KEY` — AI-powered remediation suggestions (optional)
