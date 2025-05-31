//import init, { scan_code } from '../../wasm/pkg';

let wasmInitialized = false;

export const initializeWasm = async () => {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
};

export const scanCodeForVulnerabilities = async (code: string) => {
  await initializeWasm();
  return scan_code(code);
};

export interface Vulnerability {
  id: string;
  type: string;
  line: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const processWasmResults = (code: string, results: [string, string][]): Vulnerability[] => {
  return results.map(([type, description], index) => {
    // Find the line number where the vulnerability occurs
    const lines = code.split('\n');
    const lineNumber = lines.findIndex(line => {
      switch (type) {
        case 'xss':
          return line.includes('innerHTML');
        case 'sql_injection':
          return line.toUpperCase().includes('SELECT') ||
                 line.toUpperCase().includes('INSERT') ||
                 line.toUpperCase().includes('UPDATE') ||
                 line.toUpperCase().includes('DELETE');
        case 'command_injection':
          return line.includes('eval') ||
                 line.includes('exec') ||
                 line.includes('system');
        default:
          return false;
      }
    }) + 1;

    return {
      id: `${type}-${index}`,
      type,
      line: lineNumber || 1,
      description,
      severity: type === 'xss' ? 'high' : type === 'sql_injection' ? 'medium' : 'low'
    };
  });
}; 