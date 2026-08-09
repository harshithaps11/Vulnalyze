import asyncio
from app.services.scanner import ScannerService

code = (
    "openai.api_key = 'sk-proj-a1b2c3d4e5f6g7h8i9j0'\n"
    "prompt = f'User says: {user_message}'\n"
    "document.getElementById('result').innerHTML = output\n"
    "query = \"SELECT * FROM users WHERE id = '\" + user_id + \"'\"\n"
    "return pickle.loads(config_bytes)\n"
    "yaml.load(config_str)\n"
    "password = 'admin123'\n"
    "verify=False\n"
    "const token = Math.random().toString(36);\n"
)

svc = ScannerService()
results = asyncio.run(svc.run_semgrep(code))
print(f"Found {len(results)} vulnerabilities:")
for r in results:
    sev = r["severity"].value if hasattr(r["severity"], "value") else r["severity"]
    print(f"  [{sev.upper()}] {r['title']} @ {r['location']}")
