"""
Security Test Benchmark — validates that the Vulnalyze scanner detects known vulnerabilities.

Run from the project root:
    python security-tests/test_detection.py

Or via pytest:
    python -m pytest security-tests/test_detection.py -v
"""
import json
import sys
from pathlib import Path

# Add backend to path so we can import the scanner
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

SAMPLES_DIR = Path(__file__).resolve().parent / "samples"
EXPECTED_FILE = SAMPLES_DIR / "expected_findings.json"


def load_expected():
    with open(EXPECTED_FILE) as f:
        return json.load(f)


def run_scanner_on_file(filepath: str) -> list:
    """Run the Vulnalyze rule-based scanner on a single file."""
    from app.services.scanner import ScannerService
    scanner = ScannerService()
    code = Path(filepath).read_text(encoding="utf-8", errors="replace")
    return scanner._real_static_scan(code)


def test_all_samples():
    """Test that the scanner detects expected vulnerabilities in all sample files."""
    expected = load_expected()
    total_samples = 0
    total_detected = 0
    total_expected = 0
    failures = []

    print("\n" + "=" * 70)
    print("VULNALYZE SCANNER BENCHMARK")
    print("=" * 70)

    for filename, spec in expected.items():
        filepath = SAMPLES_DIR / filename
        if not filepath.exists():
            print(f"  [SKIP]: {filename} not found")
            continue

        total_samples += 1
        findings = run_scanner_on_file(str(filepath))
        total_detected += len(findings)
        min_expected = spec["min_findings"]
        total_expected += min_expected

        # Check minimum finding count
        passed = len(findings) >= min_expected

        # Check that at least one expected CWE was detected
        detected_cwes = set()
        for f in findings:
            cwe = f.get("metadata", {}).get("cweid", "")
            if cwe:
                detected_cwes.add(cwe)

        cwe_hit = any(cwe in detected_cwes for cwe in spec.get("expected_cwes", []))

        status = "[PASS]" if (passed and cwe_hit) else "[FAIL]"
        if not (passed and cwe_hit):
            failures.append(filename)

        print(f"\n  {status}: {filename}")
        print(f"         Findings: {len(findings)} (min expected: {min_expected})")
        print(f"         CWEs detected: {detected_cwes or 'none'}")
        print(f"         Expected CWEs: {spec.get('expected_cwes', [])}")

    print("\n" + "=" * 70)
    print(f"RESULTS: {total_samples - len(failures)}/{total_samples} samples passed")
    print(f"Total findings detected: {total_detected}")
    if failures:
        print(f"Failed samples: {', '.join(failures)}")
    print("=" * 70 + "\n")

    # For pytest: assert all passed
    assert len(failures) == 0, f"Scanner failed to detect expected vulnerabilities in: {failures}"


if __name__ == "__main__":
    test_all_samples()
