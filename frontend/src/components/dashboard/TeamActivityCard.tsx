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
        const items: ActivityItem[] = scans.slice(0, 5).map((scan: any) => ({
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
        return <Shield size={16} className="text-primary-500" />;
      case 'status_change':
        return <CheckCircle size={16} className="text-severity-low" />;
      default:
        return <Play size={16} className="text-primary-500" />;
    }
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Team Activity</h3>

        {loading ? (
          <div className="space-y-4 flex-grow animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-dark-700/60 rounded-md" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4 flex-grow">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start bg-dark-800/50 p-2.5 rounded-lg border border-dark-700/50">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs mr-3 mt-0.5 border border-primary-500/30">
                  {activity.userName.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center">
                    <span className="font-medium text-dark-100 text-xs">{activity.userName}</span>
                    <span className="mx-2 text-dark-500">•</span>
                    <span className="text-[11px] text-dark-400">{formatDate(activity.timestamp)}</span>
                  </div>

                  <div className="flex items-center mt-1">
                    <span className="mr-1.5">{getActivityIcon(activity.type)}</span>
                    <p className="text-xs text-dark-300">
                      {activity.details} <span className="text-primary-400 font-mono">{shortenString(activity.target, 25)}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow py-8 text-center text-dark-400">
            <AlertCircle size={20} className="mb-1" />
            <p className="text-xs">No scan activity logged yet.</p>
          </div>
        )}
      </div>
    </Card>
  );
}