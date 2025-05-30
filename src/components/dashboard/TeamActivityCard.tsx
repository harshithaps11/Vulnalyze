import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { mockTeamActivities } from '../../data/mockData';
import { formatDate, shortenString } from '../../lib/utils';
import { MessageSquare, Shield, UserCheck, CheckCircle, Play } from 'lucide-react';

export function TeamActivityCard() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={16} className="text-primary-500" />;
      case 'scan':
        return <Shield size={16} className="text-primary-500" />;
      case 'assignment':
        return <UserCheck size={16} className="text-severity-medium" />;
      case 'status_change':
        return <CheckCircle size={16} className="text-severity-low" />;
      case 'fix':
        return <CheckCircle size={16} className="text-severity-low" />;
      default:
        return <Play size={16} className="text-primary-500" />;
    }
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Team Activity</h3>
        
        <div className="space-y-4 flex-grow">
          {mockTeamActivities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <Avatar src={activity.user.avatar} alt={activity.user.name} size="sm" className="mr-3 mt-0.5" />
              
              <div className="flex-grow">
                <div className="flex items-center">
                  <span className="font-medium text-dark-200">{activity.user.name}</span>
                  <span className="mx-2 text-dark-500">•</span>
                  <span className="text-xs text-dark-400">{formatDate(activity.timestamp)}</span>
                </div>
                
                <div className="flex items-center mt-1">
                  <span className="mr-1.5">{getActivityIcon(activity.type)}</span>
                  <p className="text-sm text-dark-300">
                    {activity.details} <span className="text-primary-400">{shortenString(activity.target, 25)}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}