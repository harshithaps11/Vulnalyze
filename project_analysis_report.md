# Vulnalyze Project Analysis Report

This report provides a comprehensive overview of the **Vulnalyze** project. It details the existing architecture, highlights the current defects and architectural disconnects, assesses AI model connectivity, and outlines the roadmap required to make this project production-ready.

---

## 1. Project Overview & Capabilities

Vulnalyze is designed as a next-generation OWASP vulnerability scanner combined with interactive visual feedback, live in-browser remediation, and collaborative tools.

### Core Intended Features:
* **Hybrid Scanning:** Static analysis (powered by Semgrep) and Dynamic analysis (powered by OWASP ZAP).
* **Live Remediation Sandbox:** In-browser code editing (Monaco Editor) with instant WebAssembly-based rescans and automated quick fixes.
* **AI-Powered Explanations:** Real-time analysis of code snippets to explain vulnerabilities, recommend best practices, and suggest performance optimizations.
* **Attack Path Visualization:** Interactive D3.js force-directed graphs showing chained exploit vectors.
* **Team Warfare & Collaboration:** Real-time team communication, comment tracking, and gamified leaderboards.

---

## 2. Current Architecture & Structural Disconnects

Upon scanning the codebase, multiple severe structural discrepancies and bugs were identified that prevent the project from running or working in a live environment.

```mermaid
graph TD
    subgraph Frontend (Discrepancy)
        RootFolder["Root /src (Actual Code)"]
        FrontendFolder["/frontend (Empty / Non-Functional)"]
    end
    subgraph Backend (Split)
        MainPy["backend/main.py (AI Endpoints - OpenRouter)"]
        AppMainPy["backend/app/main.py (Auth, Scan Profiles, SQLite/Postgres DB)"]
    end
    subgraph Services
        Wasm["wasm/ (Rust compiled to WebAssembly)"]
        Scanners["Semgrep & ZAP Scanners (Async Tasks)"]
    end

    RootFolder -.->|Calls API| MainPy
    FrontendFolder -->|start.bat tries to run this| Error1["Crashes (No Scripts/Files)"]
    MainPy -->|Has Hardcoded Key| OpenRouter["OpenRouter API"]
    AppMainPy -->|Requires Celery/RabbitMQ| Celery["Celery Task Runner"]
```

### A. Frontend Directory Disconnection
* **The Bug:** The actual frontend source code (components, styles, routes, configurations) is located in the **root** folder (`/src`, `/index.html`, `/vite.config.ts`, etc.). However, there is a subfolder named `/frontend` which is mostly empty except for a boilerplate `package.json` that does not contain a `scripts` section.
* **The Consequence:** The startup script `start.bat` changes directory into `%~dp0frontend` and runs `npm run dev`. This fails because the `/frontend` directory lacks a dev script and does not contain the actual app.

### B. Dual/Split Backend Files
* The backend is split into two non-integrated Python entry points:
  1. `backend/main.py`: Contains the AI-related endpoints (`/api/analyze`, `/api/fix`, `/api/explain`, `/api/best-practices`, `/api/performance`) calling the OpenRouter API.
  2. `backend/app/main.py`: Contains endpoints for user authentication (`/api/v1/auth/login`), scan creation (`/api/v1/scans`), and scan status management.
* **The Consequence:** Only one backend server can run on port `8000` at a time. If `backend/app/main.py` is started (as configured in `start.bat`), the frontend's AI queries fail with a `404 Not Found`. If `backend/main.py` is started, authentication and scan recording fail.

### C. Database Mismatch
* **The Bug:** `backend/setup_db.py` sets up a local **SQLite** database (`backend/data/vulnalyze.db`) and inserts seed data. However, the FastAPI application configuration (`backend/app/core/config.py`) and session creator (`backend/app/db/session.py`) are configured to use **PostgreSQL** with an asynchronous driver (`postgresql+asyncpg://...`).
* **The Consequence:** The application will fail to start or connect to the database unless a PostgreSQL database server is active and configured in a `.env` file, meaning the SQLite tables created during setup are completely ignored by the main app.

### D. Mock Scan Progress and Scanner Disconnection
* **The Bug:** The scanning interface does not actually connect to the FastAPI backend.
  * `ScanProgressPanel.tsx` uses a standard client-side `setInterval` timer with `Math.random()` to simulate scanning progress and mock vulnerabilities.
  * `wasmService.ts` has the WebAssembly imports commented out (`//import init, { scan_code } ...`), meaning it cannot perform live client-side scanning.

---

## 3. What's Not Working (Summary of Key Bugs)

1. **`start.bat` Frontend Launch:** Fails immediately because it tries to launch from the empty `/frontend` directory.
2. **AI Endpoints (404 Error):** If the backend is run via `backend/app/main.py`, all AI features (AI Assistant, AI Explainer) are broken because those endpoints are only defined in `backend/main.py`.
3. **Database Connectivity Crash:** The backend expects a PostgreSQL database via the `asyncpg` driver, but the setup script configures SQLite.
4. **Celery Scan Execution:** The scan task (`run_hybrid_scan` in `backend/app/services/scanner.py`) is queued via Celery:
   ```python
   run_hybrid_scan.delay(str(db_scan.uuid), scan.source_code or "", scan.target_url)
   ```
   This requires Celery worker processes and a RabbitMQ broker to be running, which are not set up or launched in the dev environment.
5. **Static/Dynamic Scanners:** 
   * Calling `semgrep.main.main()` directly in Python can crash or exit the server process.
   * ZAP scanner expects an active OWASP ZAP daemon running locally, which is not running.

---

## 4. Model Connection: Is it Needed?

**Yes, a model connection is absolutely needed.**
The core value proposition of Vulnalyze (remediation suggestions, code explanation, best practice analysis, and custom refactoring suggestions) relies heavily on Large Language Models.

### Security Warning ⚠️
In `backend/main.py`, there is a hardcoded OpenRouter API key:
```python
OPENROUTER_API_KEY = "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"
```
> [!WARNING]
> Hardcoding credentials in source files is a severe security risk. This key should be revoked immediately and replaced with an environment variable loaded at runtime (e.g., `os.getenv("OPENROUTER_API_KEY")`).

---

## 5. Roadmap to Build a Production-Ready Project

To transition this project from its current prototype state into a secure, production-ready system, the following steps must be taken:

### Step 1: Directory Clean-up & Build Configurations
* Move all frontend files (dependencies, Vite configs, components) into a single designated directory (either consolidate at the root or move the root files inside `/frontend`).
* Update the root `package.json` and Netlify settings to build from the correct path.

### Step 2: Backend Consolidation
* Merge `backend/main.py` and `backend/app/main.py` into a unified FastAPI application.
* Move the AI routes into an APIRouter (e.g., `/api/v1/ai`) inside the `backend/app/api` structure.

### Step 3: Database & Config Unification
* Decide on the target database. For production, PostgreSQL is highly recommended.
* Create a database migration strategy using Alembic (already installed) to initialize tables in PostgreSQL instead of relying on a standalone SQLite python script.
* Ensure all database settings, OpenRouter keys, and Celery broker URLs are loaded via environment variables (`.env`) rather than hardcoded.

### Step 4: Robust Scan Processing
* Reconfigure the static scanner to execute the `semgrep` command via subprocess or use a dedicated Docker wrapper to avoid crashing the main FastAPI thread.
* For ZAP dynamic scanning, set up a containerized ZAP service and connect via the API.
* Implement a polling mechanism or WebSockets on the frontend to query the scan status from `/api/v1/scans/{scan_id}/status` rather than simulating progress using `setInterval`.

### Step 5: WebAssembly compilation
* Compile the Rust project in `wasm/` using `wasm-pack build --target web`.
* Uncomment the WASM imports in `src/services/wasmService.ts` and initialize the WASM runtime correctly in the browser for instant client-side code analysis in the Monaco editor.
