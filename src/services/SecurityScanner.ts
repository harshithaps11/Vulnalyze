// services/SecurityScanner.ts
import { ScanResult } from '../types';

export class SecurityScanner {
  private static instance: SecurityScanner;
  
  static getInstance(): SecurityScanner {
    if (!SecurityScanner.instance) {
      SecurityScanner.instance = new SecurityScanner();
    }
    return SecurityScanner.instance;
  }

  async loadWasm(): Promise<void> {
    // Simulate WebAssembly module loading
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async scanCode(code: string): Promise<ScanResult[]> {
    // Simulate WebAssembly scanning
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const results: ScanResult[] = [];
    
    // XSS Detection
    if (code.includes('innerHTML') && !code.includes('DOMPurify')) {
      results.push({
        id: 'xss-1',
        vulnerability: 'Cross-Site Scripting (XSS)',
        severity: 'high',
        file: 'component.tsx',
        line: code.split('\n').findIndex(line => line.includes('innerHTML')) + 1,
        code: code.split('\n').find(line => line.includes('innerHTML')) || '',
        description: 'Potential XSS vulnerability due to unsafe innerHTML usage',
        fix_suggestion: 'Use DOMPurify.sanitize() or textContent instead'
      });
    }

    // SQL Injection Detection  
    if (code.includes('SELECT') && code.includes('+')) {
      results.push({
        id: 'sql-1',
        vulnerability: 'SQL Injection',
        severity: 'critical',
        file: 'database.ts',
        line: code.split('\n').findIndex(line => line.includes('SELECT')) + 1,
        code: code.split('\n').find(line => line.includes('SELECT')) || '',
        description: 'Potential SQL injection due to string concatenation',
        fix_suggestion: 'Use parameterized queries or prepared statements'
      });
    }

    // Command Injection Detection
    if (code.includes('exec(') || code.includes('system(')) {
      results.push({
        id: 'cmd-1',
        vulnerability: 'Command Injection',
        severity: 'critical',
        file: 'server.ts',
        line: code.split('\n').findIndex(line => line.includes('exec(') || line.includes('system(')) + 1,
        code: code.split('\n').find(line => line.includes('exec(') || line.includes('system(')) || '',
        description: 'Potential command injection vulnerability',
        fix_suggestion: 'Use safe alternatives or proper input validation'
      });
    }

    // Insecure Crypto Detection
    if (code.includes('md5') || code.includes('sha1')) {
      results.push({
        id: 'crypto-1',
        vulnerability: 'Weak Cryptographic Hash',
        severity: 'medium',
        file: 'auth.ts',
        line: code.split('\n').findIndex(line => line.includes('md5') || line.includes('sha1')) + 1,
        code: code.split('\n').find(line => line.includes('md5') || line.includes('sha1')) || '',
        description: 'Usage of weak cryptographic hash functions',
        fix_suggestion: 'Use SHA-256 or stronger hash functions'
      });
    }

    return results;
  }

  autoFix(code: string, vulnerability: string): string {
    switch (vulnerability) {
      case 'Cross-Site Scripting (XSS)':
        return code.replace(
          /element\.innerHTML\s*=\s*(.+)/g,
          'element.textContent = $1'
        );
      case 'SQL Injection':
        return code.replace(
          /SELECT \* FROM users WHERE id = (['"`])\s*\+\s*(.+?)\s*\+\s*\1/g,
          'SELECT * FROM users WHERE id = ?; // Use parameterized query with: [$2]'
        );
      case 'Command Injection':
        return code.replace(
          /(exec|system)\((.+?)\)/g,
          '// $1($2) - REMOVED: Use safe alternatives'
        );
      case 'Weak Cryptographic Hash':
        return code.replace(
          /(md5|sha1)\(/g,
          'sha256('
        );
      default:
        return code;
    }
  }

  validatePayload(payload: string): boolean {
    // Basic validation to prevent actual malicious usage
    const dangerousPatterns = [
      /document\.cookie/i,
      /window\.location/i,
      /eval\(/i,
      /function\s*\(/i,
      /<iframe/i,
      /javascript:/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(payload));
  }
}