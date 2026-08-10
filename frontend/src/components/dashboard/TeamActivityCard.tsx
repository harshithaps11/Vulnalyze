import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { formatDate, shortenString } from '../../lib/utils';
import { Shield, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ActivityItem {
  id: string;
  type: string;
  userName: string;
  target: string;
  details: string;
  timestamp: string;
}

export function TeamActivityCard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await apiClient.get('/scans');
        const scans = response.data || [];
        const items: ActivityItem[] = scans.slice(0, 10).map((scan: any) => ({
          id: scan.uuid || String(scan.id),
          type: 'scan',
          userName: 'Admin User',
          target: scan.target_url || 'Source Code',
          details: `Completed ${scan.scan_type || 'hybrid'} scan on`,
          timestamp: scan.created_at || new Date().toISOString(),
        }));
        setActivities(items);
      } catch (err) {
        console.error('Failed to fetch team activities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return <Shield size={14} className="text-primary-500" />;
      case 'status_change':
        return <CheckCircle size={14} className="text-severity-low" />;
      default:
        return <Play size={14} className="text-primary-500" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-dark-100 mb-3">Team Activity</h3>

        {loading ? (
          <div className="space-y-3 flex-grow animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-dark-700/40 rounded-lg" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar flex-grow">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start bg-dark-700/40 p-2.5 rounded-lg border border-dark-700/50 hover:border-dark-600 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-[11px] mr-2.5 mt-0.5 border border-primary-500/30 shrink-0">
                  {activity.userName.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center">
                    <span className="font-medium text-dark-100 text-xs">{activity.userName}</span>
                    <span className="mx-1.5 text-dark-400">•</span>
                    <span className="text-[10px] text-dark-400">{formatDate(activity.timestamp)}</span>
                  </div>

                  <div className="flex items-center mt-0.5">
                    <span className="mr-1.5 shrink-0">{getActivityIcon(activity.type)}</span>
                    <p className="text-xs text-dark-300 truncate">
                      {activity.details} <span className="text-primary-400 font-mono font-medium">{shortenString(activity.target, 30)}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow py-6 text-center text-dark-400">
            <AlertCircle size={20} className="mb-1" />
            <p className="text-xs">No scan activity logged yet.</p>
          </div>
        )}
      </div>
    </Card>
  );
}