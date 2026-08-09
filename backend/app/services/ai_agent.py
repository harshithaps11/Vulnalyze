"""
ai_agent.py — LangChain-powered Security Analysis Agent for Vulnalyze

Uses LangChain to orchestrate an LLM that generates structured security
remediation advice from raw vulnerability findings. Supports:
  - OpenRouter (cloud LLMs: Claude, GPT-4, Mistral)
  - Ollama (local, free, no API key needed)
  - Raw OpenRouter fallback (direct httpx)
"""

import json
import os
from typing import List, Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()


# ---------------------------------------------------------------------------
# Helper: Build a structured security prompt from vulnerabilities
# ---------------------------------------------------------------------------
def _build_security_prompt(vulnerabilities: List[Dict[str, Any]], target: str) -> str:
    if not vulnerabilities:
        vuln_block = "No vulnerabilities were detected."
    else:
        lines = []
        for i, v in enumerate(vulnerabilities[:15], 1):  # cap at 15 to stay within token limits
            sev = v.get("severity", "unknown")
            sev_val = sev.value if hasattr(sev, "value") else str(sev)
            cwe = v.get("metadata", {}).get("cweid", "N/A")
            owasp = v.get("metadata", {}).get("owasp", "")
            lines.append(
                f"{i}. [{sev_val.upper()}] {v.get('title', 'Unknown')}\n"
                f"   CWE-{cwe} | {owasp}\n"
                f"   Location: {v.get('location', 'N/A')}\n"
                f"   Evidence: {str(v.get('evidence', ''))[:120]}\n"
                f"   Description: {v.get('description', '')[:200]}"
            )
        vuln_block = "\n\n".join(lines)

    return f"""You are a senior application security engineer performing a code review for: {target}

The automated scanner detected the following vulnerabilities:

{vuln_block}

Provide a structured security analysis report with:

1. **Executive Summary** (2–3 sentences): Overall risk posture and most critical issues.

2. **Top 3 Critical Actions** (bullet list): The three most urgent fixes with code examples.

3. **Vulnerability Remediation Table** (for each finding):
   - Issue name
   - Risk: why it matters
   - Fix: specific code change or configuration to apply
   - Reference: OWASP link or CWE

4. **AI/LLM Security Note** (if any AI-related issues): Specific guidance on securing LLM integrations, prompt injection defense, and API key management.

5. **Overall Risk Score**: Rate 0–10 and explain.

Be concise, technical, and actionable. Use markdown formatting."""


# ---------------------------------------------------------------------------
# LangChain Agent (primary)
# ---------------------------------------------------------------------------
async def run_langchain_security_agent(
    vulnerabilities: List[Dict[str, Any]],
    target: str,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run a LangChain-based security analysis agent.
    Falls back gracefully if LangChain or the API key is not available.
    """
    key = api_key or settings.OPENROUTER_API_KEY or ""
    prompt = _build_security_prompt(vulnerabilities, target)

    # ── Attempt 1: LangChain with OpenRouter ───────────────────────────────
    if key:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_core.output_parsers import StrOutputParser

            llm = ChatOpenAI(
                model="anthropic/claude-3-haiku",       # cheap + fast on OpenRouter
                openai_api_key=key,
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=0.3,
                max_tokens=2000,
                default_headers={
                    "HTTP-Referer": "https://vulnalyze.app",
                    "X-Title": "Vulnalyze Security Agent",
                }
            )

            messages = [
                SystemMessage(content=(
                    "You are an expert application security engineer specializing in "
                    "OWASP Top 10, AI/LLM security, and secure code review. "
                    "Provide precise, actionable remediation advice."
                )),
                HumanMessage(content=prompt)
            ]

            chain = llm | StrOutputParser()
            analysis = await chain.ainvoke(messages)

            return {
                "success": True,
                "engine": "LangChain + OpenRouter (Claude Haiku)",
                "model": "anthropic/claude-3-haiku",
                "analysis": analysis,
                "vulnerability_count": len(vulnerabilities),
                "target": target,
            }
        except ImportError:
            print("langchain_openai not installed — trying Ollama.")
        except Exception as e:
            print(f"LangChain OpenRouter call failed: {e} — trying Ollama.")

    # ── Attempt 2: LangChain with Ollama (local, free) ────────────────────
    try:
        from langchain_community.llms import Ollama
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        ollama_prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert application security engineer. "
                "Provide structured, actionable security remediation advice."
            )),
            ("human", "{input}")
        ])

        llm = Ollama(model="mistral", temperature=0.3)
        chain = ollama_prompt | llm | StrOutputParser()
        analysis = await chain.ainvoke({"input": prompt})

        return {
            "success": True,
            "engine": "LangChain + Ollama (Mistral — local)",
            "model": "mistral",
            "analysis": analysis,
            "vulnerability_count": len(vulnerabilities),
            "target": target,
        }
    except Exception as e:
        print(f"Ollama not available: {e} — using rule-based remediation.")

    # ── Attempt 3: Built-in rule-based remediation (no LLM needed) ────────
    return _rule_based_remediation(vulnerabilities, target)


# ---------------------------------------------------------------------------
# Rule-based remediation fallback (works without any API key)
# ---------------------------------------------------------------------------
_REMEDIATION_DB: Dict[str, Dict[str, str]] = {
    "79":  {"fix": "Use DOMPurify.sanitize() before assigning to innerHTML; use textContent instead of innerHTML for plain text.", "ref": "https://owasp.org/www-community/attacks/xss/"},
    "89":  {"fix": "Use parameterized queries or an ORM. Never concatenate user input into SQL strings.", "ref": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"},
    "78":  {"fix": "Replace eval()/exec() with safe alternatives. For subprocess, use a list of arguments with shell=False.", "ref": "https://owasp.org/www-community/attacks/Command_Injection"},
    "327": {"fix": "Replace MD5/SHA-1 with SHA-256 or bcrypt/argon2 for passwords.", "ref": "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"},
    "798": {"fix": "Move secrets to environment variables. Use python-dotenv locally and a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production.", "ref": "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password"},
    "502": {"fix": "Never deserialize untrusted data with pickle. Use JSON or a schema-validated format.", "ref": "https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data"},
    "347": {"fix": "Reject JWTs with 'none' algorithm. Always specify allowed algorithms explicitly.", "ref": "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/"},
    "295": {"fix": "Always verify SSL certificates in production. Use httpx/requests with verify=True (default).", "ref": "https://owasp.org/www-community/vulnerabilities/Improper_Certificate_Validation"},
    "918": {"fix": "Validate and allowlist target URLs server-side. Reject private IP ranges (10.x, 192.168.x, 127.x).", "ref": "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery"},
    "94":  {"fix": "Sanitize all user inputs used in LLM prompts. Implement prompt injection defense with input/output validators.", "ref": "https://owasp.org/www-project-top-10-for-large-language-model-applications/"},
}

def _rule_based_remediation(vulnerabilities: List[Dict[str, Any]], target: str) -> Dict[str, Any]:
    """Generate structured remediation advice using our built-in knowledge base."""
    if not vulnerabilities:
        return {
            "success": True,
            "engine": "Vulnalyze Built-in Rule Engine",
            "model": "rule-based",
            "analysis": "✅ No vulnerabilities detected. Ensure you run scans regularly as your codebase evolves.",
            "vulnerability_count": 0,
            "target": target,
        }

    # Severity counts
    sev_counts: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in vulnerabilities:
        sev = v.get("severity", "low")
        sev_val = sev.value if hasattr(sev, "value") else str(sev)
        sev_counts[sev_val] = sev_counts.get(sev_val, 0) + 1

    risk_score = min(10, sev_counts["critical"] * 3 + sev_counts["high"] * 2 + sev_counts["medium"] * 1)

    lines = [
        f"## [VULNALYZE] Security Analysis Report — {target}\n",
        f"### Executive Summary\n",
        f"The scan identified **{len(vulnerabilities)} vulnerabilities** "
        f"({sev_counts['critical']} Critical, {sev_counts['high']} High, "
        f"{sev_counts['medium']} Medium, {sev_counts['low']} Low). "
        f"Overall risk score: **{risk_score}/10**. "
        + ("Immediate action required on critical findings." if sev_counts["critical"] > 0 else
           "Address high-severity findings as a priority."),
        "\n---\n",
        "### Remediation Guidance\n"
    ]

    seen_cwes = set()
    for v in vulnerabilities:
        cwe = v.get("metadata", {}).get("cweid", "")
        sev = v.get("severity", "low")
        sev_val = (sev.value if hasattr(sev, "value") else str(sev)).upper()
        title = v.get("title", "Unknown")
        location = v.get("location", "N/A")
        owasp = v.get("metadata", {}).get("owasp", "")

        key_label = f"{title}:{location}"
        if key_label in seen_cwes:
            continue
        seen_cwes.add(key_label)

        remediation = _REMEDIATION_DB.get(cwe, {})
        fix = remediation.get("fix", "Review this vulnerability manually and apply the principle of least privilege.")
        ref = remediation.get("ref", f"https://cwe.mitre.org/data/definitions/{cwe}.html" if cwe else "https://owasp.org/")

        lines.append(f"#### [{sev_val}] {title}")
        lines.append(f"- **Location:** `{location}`")
        if owasp:
            lines.append(f"- **OWASP:** {owasp}")
        if cwe:
            lines.append(f"- **CWE:** CWE-{cwe}")
        lines.append(f"- **Fix:** {fix}")
        lines.append(f"- **Reference:** [{ref}]({ref})\n")

    lines.append(f"\n---\n### Overall Risk Score: {risk_score}/10")

    return {
        "success": True,
        "engine": "Vulnalyze Built-in Rule Engine",
        "model": "rule-based",
        "analysis": "\n".join(lines),
        "vulnerability_count": len(vulnerabilities),
        "target": target,
        "risk_score": risk_score,
        "severity_breakdown": sev_counts,
    }
