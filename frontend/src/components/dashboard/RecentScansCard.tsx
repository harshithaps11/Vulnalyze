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
    apiClient.get('/scans')
      .then(res => setScans(res.data || []))
      .catch(() => setError('Backend offline'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchScans(); }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'running':  return <Clock size={14} className="text-primary-400" />;
      case 'completed': return <Check size={14} className="text-severity-low" />;
      case 'failed':   return <AlertCircle size={14} className="text-severity-critical" />;
      case 'pending':  return <Clock size={14} className="text-severity-medium" />;
      default: return null;
    }
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchScans}
              className="text-dark-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/results" className="text-sm text-primary-500 hover:text-primary-400 flex items-center">
              View all <ExternalLink size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="space-y-3 flex-grow overflow-y-auto">
          {loading && (
            <p className="text-sm text-dark-400 text-center py-4">Loading scans...</p>
          )}
          {!loading && error && (
            <p className="text-sm text-severity-critical/80 text-center py-4">{error} — start the backend first.</p>
          )}
          {!loading && !error && scans.length === 0 && (
            <p className="text-sm text-dark-400 text-center py-4">
              No scans yet. <Link to="/scan" className="text-primary-500 hover:underline">Start your first scan →</Link>
            </p>
          )}
          {scans.map((scan) => {
            const counts = countBySeverity(scan.vulnerabilities || []);
            const total = counts.critical + counts.high + counts.medium + counts.low;
            return (
              <Link
                key={scan.uuid}
                to={`/results/${scan.uuid}`}
                className="block p-3 bg-dark-700/50 hover:bg-dark-700 rounded-md transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 mr-2">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(scan.status)}
                      <span className="font-medium text-dark-100 text-sm truncate">
                        {scan.target_url}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-1 uppercase">{scan.scan_type}</p>
                  </div>
                  <Badge
                    variant={counts.critical > 0 ? 'critical' : total > 0 ? 'high' : 'info'}
                    className="shrink-0"
                  >
                    {counts.critical > 0 && <AlertTriangle size={11} className="mr-1" />}
                    {total} issue{total !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {scan.status === 'running' && (
                  <div className="mt-2">
                    <Progress value={40} showLabel size="sm" />
                  </div>
                )}

                <div className="mt-1.5 text-xs text-dark-400">
                  {formatDate(scan.created_at)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}