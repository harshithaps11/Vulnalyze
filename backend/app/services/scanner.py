import asyncio
import json
from typing import List, Dict, Any
import semgrep
from zapv2 import ZAPv2
from app.core.config import get_settings
from app.models.models import Vulnerability, VulnerabilitySeverity
import redis.asyncio as redis
from celery import Celery

settings = get_settings()

# Initialize Redis client
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)

# Initialize Celery
celery_app = Celery(
    'vulnalyze',
    broker=f'amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}@{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}//'
)

class ScannerService:
    def __init__(self):
        self.zap = ZAPv2(
            apikey=settings.ZAP_API_KEY,
            proxies={'http': f'http://{settings.ZAP_HOST}:{settings.ZAP_PORT}',
                    'https': f'http://{settings.ZAP_HOST}:{settings.ZAP_PORT}'}
        )

    async def run_semgrep(self, code: str) -> List[Dict[str, Any]]:
        """Run Semgrep static analysis on the provided code."""
        try:
            # Create temporary file with code
            with open('temp_code.js', 'w') as f:
                f.write(code)
            
            # Run Semgrep
            results = semgrep.main.main(['--config', settings.SEMGREP_RULES_PATH, 'temp_code.js'])
            
            # Process results
            vulnerabilities = []
            for result in results:
                vuln = {
                    'title': result['check_id'],
                    'description': result['message'],
                    'severity': self._map_semgrep_severity(result['severity']),
                    'location': f"{result['path']}:{result['start']['line']}",
                    'evidence': result['extra']['lines'],
                    'metadata': {
                        'rule_id': result['check_id'],
                        'confidence': result['extra'].get('confidence', 'medium')
                    }
                }
                vulnerabilities.append(vuln)
            
            return vulnerabilities
        except Exception as e:
            print(f"Error running Semgrep: {str(e)}")
            return []

    async def run_zap(self, url: str) -> List[Dict[str, Any]]:
        """Run OWASP ZAP dynamic analysis on the provided URL."""
        try:
            # Start new scan
            scan_id = self.zap.spider.scan(url)
            
            # Wait for spider to complete
            while int(self.zap.spider.status(scan_id)) < 100:
                await asyncio.sleep(5)
            
            # Start active scan
            active_scan_id = self.zap.ascan.scan(url)
            
            # Wait for active scan to complete
            while int(self.zap.ascan.status(active_scan_id)) < 100:
                await asyncio.sleep(5)
            
            # Get results
            alerts = self.zap.core.alerts()
            
            # Process results
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
                        'confidence': alert.get('confidence', 'medium')
                    }
                }
                vulnerabilities.append(vuln)
            
            return vulnerabilities
        except Exception as e:
            print(f"Error running ZAP: {str(e)}")
            return []

    def _map_semgrep_severity(self, severity: str) -> VulnerabilitySeverity:
        """Map Semgrep severity to our VulnerabilitySeverity enum."""
        severity_map = {
            'ERROR': VulnerabilitySeverity.HIGH,
            'WARNING': VulnerabilitySeverity.MEDIUM,
            'INFO': VulnerabilitySeverity.LOW
        }
        return severity_map.get(severity.upper(), VulnerabilitySeverity.LOW)

    def _map_zap_severity(self, risk: str) -> VulnerabilitySeverity:
        """Map ZAP risk level to our VulnerabilitySeverity enum."""
        risk_map = {
            'High': VulnerabilitySeverity.HIGH,
            'Medium': VulnerabilitySeverity.MEDIUM,
            'Low': VulnerabilitySeverity.LOW,
            'Informational': VulnerabilitySeverity.LOW
        }
        return risk_map.get(risk, VulnerabilitySeverity.LOW)

    async def get_cached_results(self, key: str) -> List[Dict[str, Any]]:
        """Get cached scan results from Redis."""
        cached = await redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None

    async def cache_results(self, key: str, results: List[Dict[str, Any]], ttl: int = 86400):
        """Cache scan results in Redis."""
        await redis_client.setex(key, ttl, json.dumps(results))

@celery_app.task
def run_hybrid_scan(scan_id: str, code: str, url: str):
    """Celery task to run hybrid scan."""
    scanner = ScannerService()
    
    # Run scans concurrently
    static_results = asyncio.run(scanner.run_semgrep(code))
    dynamic_results = asyncio.run(scanner.run_zap(url))
    
    # Merge results
    all_results = static_results + dynamic_results
    
    # Cache results
    asyncio.run(scanner.cache_results(f"scan:{scan_id}", all_results))
    
    return all_results 