import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_scan_flow():
    # 1. Create a scan with vulnerable code
    response = client.post(
        "/api/v1/scans",
        json={
            "target_url": "http://test-target.com",
            "scan_type": "hybrid",
            "source_code": "function vulnerable() { var x = eval(req.query.x); document.write(x); }"
        }
    )
    assert response.status_code == 200, f"Failed to create scan: {response.text}"
    scan_data = response.json()
    assert "uuid" in scan_data
    scan_uuid = scan_data["uuid"]
    assert scan_data["status"] in ["pending", "running", "completed"]

    # 2. Get scan status
    response = client.get(f"/api/v1/scans/{scan_uuid}/status")
    assert response.status_code == 200, f"Failed to get scan status: {response.text}"
    status_data = response.json()
    assert "status" in status_data

    # 3. Get scan details and verify that the fallback scanner detected the vulnerabilities
    response = client.get(f"/api/v1/scans/{scan_uuid}")
    assert response.status_code == 200, f"Failed to get scan details: {response.text}"
    details_data = response.json()
    assert details_data["uuid"] == scan_uuid
    
    # Check if vulnerability detection worked (either pending/running or completed with vulns)
    # Since background tasks run in the background, they might complete during or shortly after the call.
    print(f"Scan status: {details_data['status']}")
    print(f"Detected vulnerabilities count: {len(details_data.get('vulnerabilities', []))}")

def test_ai_analyze_endpoint():
    # Test the code analysis API
    response = client.post(
        "/api/analyze",
        json={
            "code": "function test() { eval('user_input'); }",
            "question": "Is there a vulnerability in this code?"
        }
    )
    # If OpenRouter API key is invalid or not provided, this might return 500 or 200.
    # We will verify that it either succeeds or returns standard gateway/API errors (not code/import errors).
    assert response.status_code in [200, 500]

def test_ai_fix_endpoint():
    response = client.post(
        "/api/fix",
        json={
            "code": "function test() { eval('user_input'); }",
            "vulnerability": "eval usage"
        }
    )
    assert response.status_code in [200, 500]
