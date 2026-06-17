# Implementation Plan - Build and Consolidate Vulnalyze Project

This plan addresses all architectural disconnects, split backend servers, database configuration mismatches, scanner issues, and frontend routing problems identified in the project analysis report.

## User Review Required

> [!IMPORTANT]
> - **SQLite Backend by Default:** We will configure the FastAPI app to default to SQLite (`backend/backend/data/vulnalyze.db`) if no PostgreSQL environment variables are set. This allows the application to run immediately out-of-the-box without requiring a running PostgreSQL daemon.
> - **Authentication Bypass in Dev Mode:** The FastAPI backend will auto-login the default admin user (User ID 1) if no `Authorization` header is present. This permits the frontend (which does not have a login workflow implemented) to query scan results and start scans seamlessly.
> - **FastAPI Background Tasks:** Instead of requiring Celery and RabbitMQ, background scans will be run using FastAPI's standard `BackgroundTasks` if RabbitMQ is not configured. This eliminates external message broker dependencies.

## Proposed Changes

---

### Component 1: Build & Directory Structure Configuration

We will consolidate the frontend project in the root folder, clear the redundant `/frontend` subdirectory, and update start scripts to run the dev server from the root.

#### [MODIFY] [start.bat](file:///c:/Users/Harshitha/Documents/Vulnalyze/start.bat)
Update frontend startup paths to run from the root directory instead of the `/frontend` folder.

#### [DELETE] [frontend](file:///c:/Users/Harshitha/Documents/Vulnalyze/frontend)
Delete or empty the duplicate `/frontend` directory to avoid confusions (as root has the actual SPA code).

---

### Component 2: Frontend Utilities and Integration

Create the missing `src/lib/utils.ts` helper module, update routing configuration, and implement real API calls for triggering scans, polling status, and loading results.

#### [NEW] [utils.ts](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/lib/utils.ts)
Implement missing functions imported by components (`formatDate`, `calculateTotalVulnerabilities`, `getStatusColor`, `shortenString`, `getSeverityBadgeClass`, `cn`).

#### [MODIFY] [App.tsx](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/App.tsx)
Add parameterized results routing (`/results/:scanId`) to support loading specific scan findings.

#### [MODIFY] [ScanConfiguration.tsx](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/pages/ScanConfiguration.tsx)
Make a POST request to `/api/v1/scans` to initiate a scan on the backend, and navigate to `/scan/progress/{scanId}` with the generated scan UUID.

#### [MODIFY] [ScanProgressPanel.tsx](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/components/scan/ScanProgressPanel.tsx)
Replace mock progress simulation with a polling routine that calls `/api/v1/scans/{scanId}/status` every 2 seconds. Once completed, automatically redirect the user to `/results/{scanId}`.

#### [MODIFY] [VulnerabilityTable.tsx](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/components/results/VulnerabilityTable.tsx)
Check if `scanId` is present in URL. If so, fetch the scan details and vulnerabilities from the backend. Otherwise, fallback to the default mock list.

#### [MODIFY] [wasmService.ts](file:///c:/Users/Harshitha/Documents/Vulnalyze/src/services/wasmService.ts)
Uncomment WASM package imports and initialize the module.

---

### Component 3: Backend Consolidation and Configurations

Merge AI chat endpoints into the main FastAPI application, update configuration options for SQLite defaults, and configure async SQLite session logic.

#### [MODIFY] [requirements.txt](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/requirements.txt)
Add `aiosqlite` package.

#### [MODIFY] [config.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/app/core/config.py)
Make PostgreSQL, Redis, and RabbitMQ environment fields optional. Add default values for secret key variables. Add fallback database URI to SQLite (`sqlite+aiosqlite:///backend/data/vulnalyze.db`).

#### [MODIFY] [session.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/app/db/session.py)
Exclude pool-related config params (`pool_size`, `max_overflow`) when initiating SQLite database engine.

#### [MODIFY] [main.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/app/main.py)
- Integrate the AI endpoints `/api/analyze`, `/api/fix`, `/api/explain`, `/api/best-practices`, and `/api/performance` from `backend/main.py`.
- Update `get_current_user` auth dependency to fallback to the seed admin user if no token is sent (or if it fails verification) for developer ease-of-use.

#### [DELETE] [main.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/main.py)
Remove redundant split file after consolidation.

---

### Component 4: Scan Runner and Database Operations

Make scanning self-contained and robust. Implement fallback matching inside the backend in case Semgrep or ZAP CLI run into issues locally.

#### [MODIFY] [models.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/app/models/models.py)
Set `lazy="selectin"` for Scan relationships to avoid async lazy loading crashes.

#### [MODIFY] [scanner.py](file:///c:/Users/Harshitha/Documents/Vulnalyze/backend/app/services/scanner.py)
- Prevent Redis client errors: check if `REDIS_HOST` is configured before accessing cache.
- Catch Semgrep process exits and ZAP connection failures. Implement a lightweight regex/keyword scanner fallback that parses uploaded JavaScript/TypeScript code for security issues and mocks common dynamic issues.
- Implement `run_scan_task_in_background` which runs the scanners, saves vulnerability items linked to the `Scan` row, and updates status to `completed`.

---

### Component 5: WebAssembly Module

Build the WebAssembly crate so that Vite can resolve it.

- Build command: `wasm-pack build --target web` inside `wasm/` directory.

## Verification Plan

### Automated Tests
1. Run `setup_database.bat` to rebuild/seed the SQLite database.
2. Run backend test suite if available.

### Manual Verification
1. Run `start.bat` to launch backend on port 8000 and frontend on port 3000.
2. Verify page displays properly at http://localhost:3000.
3. Perform a scan: enter code or URL in scan configuration, verify the progress panel updates by polling the backend, and check that vulnerabilities are populated on completion.
4. Verify Monaco Editor instant analysis (WASM).
5. Verify AI explanation / remediation prompts.
