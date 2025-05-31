export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
  isOnline?: boolean;
}

export interface Scan {
  id: string;
  name: string;
  target: string;
  type: 'static' | 'dynamic' | 'hybrid';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  startedAt: string;
  completedAt?: string;
  vulnerabilityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  creator: User;
}

export interface Vulnerability {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: Severity;
  location: string;
  lineNumber?: number;
  status: 'open' | 'in-progress' | 'fixed' | 'false-positive';
  owasp?: string;
  cwe?: string;
  cvss?: string;
  remediation?: string;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  vulnerabilityId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface TeamActivity {
  id: string;
  type: 'comment' | 'assignment' | 'status_change' | 'scan' | 'fix';
  user: User;
  target: string;
  details: string;
  timestamp: string;
}

export interface ScanConfiguration {
  url?: string;
  code?: string;
  type: 'static' | 'dynamic' | 'hybrid';
  advanced?: {
    authentication?: {
      username?: string;
      password?: string;
      token?: string;
    };
    customPayloads?: string[];
    excludePaths?: string[];
  };
}


// types/index.ts
export interface VulnerabilityNode {
  id: string;
  type: 'vulnerability' | 'asset' | 'attack_vector';
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cve?: string;
  description: string;
  x?: number;
  y?: number;
}

export interface VulnerabilityEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'exploits' | 'leads_to' | 'requires' | 'mitigates';
  weight: number;
}

export interface Comment {
  id: string;
  vulnerabilityId: string;
  author: string;
  content: string;
  timestamp: Date;
  mentions: string[];
  resolved: boolean;
}

export interface PayloadTest {
  id: string;
  name: string;
  payload: string;
  type: 'xss' | 'sql_injection' | 'command_injection' | 'custom';
  timestamp: Date;
  result?: 'vulnerable' | 'safe' | 'error';
  response?: string;
}

export interface ScanResult {
  id: string;
  vulnerability: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  code: string;
  description: string;
  fix_suggestion?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type TabId = 'sandbox' | 'visualization' | 'explainer' | 'collaboration' | 'payload';

export interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}