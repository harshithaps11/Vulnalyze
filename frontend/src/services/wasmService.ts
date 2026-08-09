export interface Vulnerability {
  id: string;
  type: string;
  line: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  title?: string;
  cweid?: string;
}

export const initializeWasm = async () => {
  // Client-side lightweight security scanner
  return true;
};

export const scanCodeForVulnerabilities = async (code: string): Promise<[string, string][]> => {
  const results: [string, string][] = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startswith?.('#') || trimmed.startswith?.('//')) return;

    if (line.includes('innerHTML') && !line.includes('DOMPurify')) {
      results.push(['xss', `Unsanitized DOM write (innerHTML) at line ${idx + 1}`]);
    }
    if ((/SELECT|INSERT|UPDATE|DELETE/i.test(line)) && (line.includes('+') || line.includes('${') || /f['"]/.test(line))) {
      results.push(['sql_injection', `Potential SQL Injection string concatenation at line ${idx + 1}`]);
    }
    if (/\beval\(|\bexec\(|subprocess\.call.*shell\s*=\s*True|os\.system/i.test(line)) {
      results.push(['command_injection', `Dangerous dynamic code/command execution at line ${idx + 1}`]);
    }
    if (/openai\.api_key\s*=|sk-proj-|sk-prod-/i.test(line)) {
      results.push(['hardcoded_key', `Hardcoded API key / Secret token exposed at line ${idx + 1}`]);
    }
    if (/prompt\s*=\s*f['"].*\{.*user|f['"].*\{.*user.*\}.*prompt/i.test(line)) {
      results.push(['prompt_injection', `Prompt Injection risk — user input interpolated into prompt at line ${idx + 1}`]);
    }
    if (/\bmd5\(|\bsha1\(/i.test(line)) {
      results.push(['weak_hash', `Weak cryptographic hash (MD5/SHA-1) at line ${idx + 1}`]);
    }
    if (/rejectUnauthorized\s*:\s*false|verify\s*=\s*False/i.test(line)) {
      results.push(['ssl_bypass', `SSL certificate validation disabled at line ${idx + 1}`]);
    }
  });

  return results;
};

export const processWasmResults = (code: string, results: [string, string][]): Vulnerability[] => {
  const lines = code.split('\n');

  return results.map(([type, description], index) => {
    // Find exact line number matching vulnerability type
    const lineNumber = lines.findIndex((line, idx) => {
      switch (type) {
        case 'xss':
          return line.includes('innerHTML');
        case 'sql_injection':
          return /SELECT|INSERT|UPDATE|DELETE/i.test(line) && (line.includes('+') || line.includes('${') || /f['"]/.test(line));
        case 'command_injection':
          return /\beval\(|\bexec\(|subprocess\.call.*shell\s*=\s*True|os\.system/i.test(line);
        case 'hardcoded_key':
          return /openai\.api_key\s*=|sk-proj-|sk-prod-/i.test(line);
        case 'prompt_injection':
          return /prompt\s*=\s*f['"].*\{.*user|f['"].*\{.*user.*\}.*prompt/i.test(line);
        case 'weak_hash':
          return /\bmd5\(|\bsha1\(/i.test(line);
        case 'ssl_bypass':
          return /rejectUnauthorized\s*:\s*false|verify\s*=\s*False/i.test(line);
        default:
          return false;
      }
    }) + 1;

    let severity: 'low' | 'medium' | 'high' = 'medium';
    if (['command_injection', 'xss', 'hardcoded_key'].includes(type)) severity = 'high';
    if (['weak_hash', 'ssl_bypass'].includes(type)) severity = 'medium';

    return {
      id: `${type}-${index}`,
      type,
      line: lineNumber > 0 ? lineNumber : 1,
      description,
      severity
    };
  });
};