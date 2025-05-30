import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, AlertTriangle, Check, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { mockScans } from '../../data/mockData';
import { formatDate, calculateTotalVulnerabilities, getStatusColor } from '../../lib/utils';

export function RecentScansCard() {
  const statusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className="text-primary-500" />;
      case 'completed':
        return <Check size={16} className="text-severity-low" />;
      case 'failed':
        return <AlertCircle size={16} className="text-severity-critical" />;
      case 'scheduled':
        return <Clock size={16} className="text-severity-medium" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
          <Link to="/scans" className="text-sm text-primary-500 hover:text-primary-400 flex items-center">
            View all <ExternalLink size={14} className="ml-1" />
          </Link>
        </div>
        
        <div className="space-y-4 flex-grow">
          {mockScans.map((scan) => (
            <div key={scan.id} className="p-3 bg-dark-700/50 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-dark-100">{scan.name}</span>
                    <span className={`ml-2 flex items-center ${getStatusColor(scan.status)}`}>
                      {statusIcon(scan.status)}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{scan.target}</p>
                </div>
                <Badge 
                  variant={scan.vulnerabilityCount.critical > 0 ? 'critical' : 'info'}
                  className="ml-2"
                >
                  {scan.vulnerabilityCount.critical > 0 && (
                    <AlertTriangle size={12} className="mr-1" />
                  )}
                  {calculateTotalVulnerabilities(scan.vulnerabilityCount)} issues
                </Badge>
              </div>
              
              {scan.status === 'running' && (
                <div className="mt-2">
                  <Progress value={scan.progress || 0} showLabel size="sm" />
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2 text-xs text-dark-400">
                <span>
                  {scan.completedAt 
                    ? `Completed ${formatDate(scan.completedAt)}` 
                    : `Started ${formatDate(scan.startedAt)}`}
                </span>
                <span>{scan.type.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}