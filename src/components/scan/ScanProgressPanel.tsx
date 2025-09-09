import React, { useState, useEffect } from 'react';
import { Pause, StopCircle, Terminal } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { generateScanLogs } from '../../data/mockData';

interface ScanProgressPanelProps {
  scanId: string;
  scanName: string;
  onStop?: () => void;
  onPause?: () => void;
}

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
  
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Simulate scan progress
  useEffect(() => {
    if (progress >= 100) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 2;
        return prev + increment > 100 ? 100 : prev + increment;
      });
      
      // Add new logs occasionally
      if (Math.random() > 0.7) {
        setLogs(prev => [...prev, ...generateScanLogs(1)]);
        
        // Occasionally add a vulnerability
        if (Math.random() > 0.8) {
          const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;
          const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
          
          setVulnerabilities(prev => ({
            ...prev,
            [randomSeverity]: prev[randomSeverity] + 1
          }));
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [progress]);
  
  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{scanName}</h2>
            <p className="text-sm text-dark-400">Scan ID: {scanId}</p>
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
                  ${log.includes('Critical') ? 'text-severity-critical' : ''}
                  ${log.includes('High') ? 'text-severity-high' : ''}
                  ${log.includes('Medium') ? 'text-severity-medium' : ''}
                  ${log.includes('Low') ? 'text-severity-low' : ''}
                  ${log.includes('Info') ? 'text-severity-info' : ''}
                  ${!log.includes('Critical') && !log.includes('High') && !log.includes('Medium') && 
                    !log.includes('Low') && !log.includes('Info') ? 'text-dark-300' : ''}
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