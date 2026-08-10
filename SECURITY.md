# Security Policy — Vulnalyze

## Authorized Scanning Notice

Vulnalyze is a security scanning tool. **Only scan targets that you own or have explicit written authorization to test.** Unauthorized scanning of systems is illegal in most jurisdictions.

## SSRF Protections

All scan targets are validated before any request is made. The following addresses are **automatically blocked**:

| Category | Blocked Ranges |
|----------|---------------|
| Loopback | `127.0.0.0/8`, `::1/128` |
| RFC1918 Private | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` |
| Link-local | `169.254.0.0/16` (includes cloud metadata) |
| IPv6 Private | `fc00::/7`, `fe80::/10` |
| Hostnames | `localhost`, `metadata.google.internal` |

These protections are enforced in `backend/app/services/ssrf_protection.py`.

## Secrets Management

### Required Practices
- **Never commit `.env` files** — `.env` is in `.gitignore`
- **Rotate secrets regularly** — especially `SECRET_KEY` and any API keys
- **Use environment variables** — all configuration is loaded from environment
- **Generate strong secrets**: `python -c "import secrets; print(secrets.token_hex(32))"`

### API Keys
- `OPENROUTER_API_KEY` — Optional. Rule-based analysis works without it.
- `ZAP_API_KEY` — Optional. HTTP header scan is the fallback.

### If You Leak a Secret
1. **Revoke immediately** at the provider's dashboard
2. **Rotate** the compromised secret
3. **Purge git history**: `git filter-repo --path .env --invert-paths`
4. **Force push** (if repo is private) or notify collaborators

## Scan Isolation

- Each scan runs in a **background task** within the FastAPI process
- Scan results are stored in the database, scoped to the user's organization
- **No cross-tenant data access** — queries always filter by `organization_id`
- Temporary files for Semgrep scanning are created with `tempfile.NamedTemporaryFile` and deleted after use

## Dependency Security

- Run `pip-audit` regularly on `backend/requirements.txt`
- The CI/CD pipeline runs dependency audits on every push
- Monitor GitHub Security Advisories for the repository

## Reporting Vulnerabilities

If you discover a security vulnerability in Vulnalyze itself, please:

1. **Do not open a public issue**
2. Email the maintainer with details of the vulnerability
3. Allow reasonable time for a fix before public disclosure

## Default Credentials

> ⚠️ The following credentials are created by `setup_db.py` for **local development only**:
> - Email: `admin@vulnalyze.com`
> - Password: `admin123`
>
> **Change these immediately** in any non-development environment.
