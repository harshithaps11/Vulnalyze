import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, StopCircle, Terminal } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../services/apiClient';

interface ScanProgressPanelProps {
  scanId: string;
  scanName: string;
  onStop?: () => void;
  onPause?: () => void;
}

// Deterministic log messages per phase — no Math.random()
const PENDING_LOGS = [
  "Initializing scan configuration...",
  "Authenticating with scanner backend...",
  "Queuing scan task...",
  "Waiting for scanner worker dispatch...",
];

const RUNNING_LOGS = [
  "Running static analysis (AST / Regex scanner)...",
  "Scanning for XSS vulnerabilities (innerHTML, eval)...",
  "Checking for SQL injection patterns...",
  "Checking for command injection patterns...",
  "Checking for weak cryptographic hash usage...",
  "Running dynamic analysis checks...",
  "Aggregating scan results...",
  "Writing findings to database...",
];

export function ScanProgressPanel({ 
  scanId, 
  scanName, 
  onStop, 
  onPause 
}: ScanProgressPanelProps) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  });
  const [scanStatus, setScanStatus] = useState<string>('pending');
  
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Poll scan status from backend
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let pendingLogIndex = 0;
    let runningLogIndex = 0;

    // Add initial log
    setLogs(["Connecting to Vulnalyze scanner backend..."]);

    const pollStatus = async () => {
      if (scanId === 'new-scan') {
        // No real scan — just navigate to results
        setProgress(100);
        setTimeout(() => navigate('/results'), 1500);
        return;
      }

      try {
        const response = await apiClient.get(`/scans/${scanId}/status`);
        const { status } = response.data;
        setScanStatus(status);

        if (status === 'pending') {
          setProgress(5);
          if (pendingLogIndex < PENDING_LOGS.length) {
            setLogs(prev => {
              const next = PENDING_LOGS[pendingLogIndex];
              if (prev.includes(next)) return prev;
              return [...prev, next];
            });
            pendingLogIndex++;
          }
        } else if (status === 'running') {
          // Progress moves from 10% toward 90% smoothly
          setProgress(prev => {
            const next = prev + (90 - prev) * 0.15;
            return Math.min(next, 88);
          });
          if (runningLogIndex < RUNNING_LOGS.length) {
            setLogs(prev => {
              const next = RUNNING_LOGS[runningLogIndex];
              if (prev.includes(next)) return prev;
              return [...prev, next];
            });
            runningLogIndex++;
          }
        } else if (status === 'completed') {
          setProgress(100);
          clearInterval(intervalId);

          // Fetch full scan to get real vulnerability counts
          try {
            const scanResponse = await apiClient.get(`/scans/${scanId}`);
            const vulns: any[] = scanResponse.data?.vulnerabilities || [];
            const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
            vulns.forEach((v: any) => {
              const sev = v.severity?.toLowerCase();
              if (sev === 'critical') counts.critical++;
              else if (sev === 'high') counts.high++;
              else if (sev === 'medium') counts.medium++;
              else if (sev === 'low') counts.low++;
              else counts.info++;
            });
            setVulnerabilities(counts);
            const total = vulns.length;
            setLogs(prev => [
              ...prev,
              `Scan COMPLETED — ${total} vulnerabilit${total === 1 ? 'y' : 'ies'} found.`,
              "Redirecting to scan results..."
            ]);
          } catch {
            setLogs(prev => [...prev, "Scan COMPLETED. Redirecting to results..."]);
          }

          setTimeout(() => navigate(`/results/${scanId}`), 1800);
        } else if (status === 'failed') {
          setProgress(100);
          clearInterval(intervalId);
          setLogs(prev => [...prev, "ERROR: Scan task encountered an error. Check backend logs."]);
          setScanStatus('failed');
        }
      } catch (err) {
        console.error("Error polling scan status:", err);
        setError("Unable to connect to the scanning backend at http://localhost:8000. Make sure it is running.");
        clearInterval(intervalId);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [scanId, navigate]);
  
  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const statusColors: Record<string, string> = {
    pending: 'text-severity-medium',
    running: 'text-primary-400',
    completed: 'text-severity-low',
    failed: 'text-severity-critical',
  };

  return (
    <Card>
      <div className="flex flex-col h-full">
        {error && (
          <div className="mb-4 rounded-md border border-severity-critical/20 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{scanName}</h2>
            <p className="text-sm text-dark-400">
              Scan ID: <span className="font-mono text-xs">{scanId}</span>
              {' · '}
              <span className={`font-medium uppercase text-xs ${statusColors[scanStatus] || 'text-dark-400'}`}>
                {scanStatus}
              </span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Pause size={16} />}
              onClick={onPause}
            >
              Pause
            </Button>
            <Button
              variant="danger"
              icon={<StopCircle size={16} />}
              onClick={onStop}
            >
              Stop
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-dark-300">Progress</span>
            <span className="text-sm text-dark-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-dark-300 mb-2">Vulnerabilities Found</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="critical">
              Critical: {vulnerabilities.critical}
            </Badge>
            <Badge variant="high">
              High: {vulnerabilities.high}
            </Badge>
            <Badge variant="medium">
              Medium: {vulnerabilities.medium}
            </Badge>
            <Badge variant="low">
              Low: {vulnerabilities.low}
            </Badge>
            <Badge variant="info">
              Info: {vulnerabilities.info}
            </Badge>
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center mb-2">
            <Terminal size={16} className="mr-2 text-dark-400" />
            <h3 className="text-sm font-medium text-dark-300">Live Logs</h3>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-dark-900 rounded-md p-3 h-64 overflow-y-auto font-mono text-xs"
          >
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className={`
                  ${log.includes('COMPLETED') || log.includes('completed') ? 'text-severity-low' : ''}
                  ${log.includes('ERROR') || log.includes('failed') ? 'text-severity-critical' : ''}
                  ${log.includes('RUNNING') || log.includes('running') || log.includes('Running') ? 'text-primary-400' : ''}
                  ${log.includes('PENDING') || log.includes('Waiting') || log.includes('Queuing') ? 'text-severity-medium' : ''}
                  ${!log.includes('COMPLETED') && !log.includes('completed') 
                    && !log.includes('ERROR') && !log.includes('failed')
                    && !log.includes('RUNNING') && !log.includes('running') && !log.includes('Running')
                    && !log.includes('PENDING') && !log.includes('Waiting') && !log.includes('Queuing')
                    ? 'text-dark-300' : ''}
                `}>
                  {log}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <span className="text-dark-500">Waiting for scan to start...</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}