import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, AlertTriangle, Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { apiClient } from '../../services/apiClient';
import { formatDate } from '../../lib/utils';

interface ScanEntry {
  uuid: string;
  target_url: string;
  scan_type: string;
  status: string;
  created_at: string;
  vulnerabilities: any[];
}

function countBySeverity(vulns: any[]) {
  return vulns.reduce(
    (acc, v) => {
      const s = v.severity?.toLowerCase();
      if (s === 'critical') acc.critical++;
      else if (s === 'high') acc.high++;
      else if (s === 'medium') acc.medium++;
      else if (s === 'low') acc.low++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

export function RecentScansCard() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = () => {
    setLoading(true);
    setError(null);
    apiClient
      .get('/scans')
      .then(res => setScans(res.data || []))
      .catch(() => setError('Backend offline'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock size={14} className="text-primary-400" />;
      case 'completed':
        return <Check size={14} className="text-severity-low" />;
      case 'failed':
        return <AlertCircle size={14} className="text-severity-critical" />;
      case 'pending':
        return <Clock size={14} className="text-severity-medium" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Recent Scans</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchScans}
              className="text-dark-400 hover:text-dark-100 transition-colors p-1 rounded hover:bg-dark-700"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/results" className="text-xs font-medium text-primary-500 hover:text-primary-400 flex items-center">
              View all <ExternalLink size={12} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Fixed max-height scrollable container */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar flex-grow">
          {loading && (
            <div className="space-y-2 py-2 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-dark-700/50 rounded-lg" />
              ))}
            </div>
          )}
          {!loading && error && (
            <p className="text-xs text-severity-critical text-center py-6">{error} — start the backend first.</p>
          )}
          {!loading && !error && scans.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-dark-400 mb-2">No scans recorded yet.</p>
              <Link to="/scan" className="text-xs text-primary-500 hover:underline font-medium">
                Start your first scan →
              </Link>
            </div>
          )}
          {!loading &&
            scans.map(scan => {
              const counts = countBySeverity(scan.vulnerabilities || []);
              const total = counts.critical + counts.high + counts.medium + counts.low;
              return (
                <Link
                  key={scan.uuid}
                  to={`/results/${scan.uuid}`}
                  className="block p-3 bg-dark-700/80 hover:bg-dark-700 rounded-lg transition-colors border border-dark-600/60 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 mr-2">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(scan.status)}
                        <span className="font-medium text-dark-100 text-xs truncate max-w-[150px]">
                          {scan.target_url}
                        </span>
                      </div>
                      <p className="text-[10px] text-dark-400 mt-0.5 uppercase tracking-wide font-mono">
                        {scan.scan_type}
                      </p>
                    </div>
                    <Badge
                      variant={counts.critical > 0 ? 'critical' : total > 0 ? 'high' : 'info'}
                      className="shrink-0 text-[10px] px-2 py-0.5"
                    >
                      {counts.critical > 0 && <AlertTriangle size={10} className="mr-1" />}
                      {total} issue{total !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {scan.status === 'running' && (
                    <div className="mt-2">
                      <Progress value={40} showLabel size="sm" />
                    </div>
                  )}

                  <div className="mt-1.5 text-[11px] text-dark-400 flex items-center justify-between">
                    <span>{formatDate(scan.created_at)}</span>
                    <span className="font-mono text-[10px] uppercase text-dark-400">{scan.status}</span>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </Card>
  );
}