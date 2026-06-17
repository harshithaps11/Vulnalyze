import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { currentUser } from '../data/mockData';

export function Profile() {
  return (
    <PageContainer title="Your Profile" description="Review your account details and access preferences.">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="lg" status="online" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">{currentUser.name}</h2>
              <p className="text-dark-400">{currentUser.email}</p>
              <p className="mt-2 text-sm text-dark-300">Role: {currentUser.role}</p>
            </div>
            <Button variant="secondary">Edit Profile</Button>
          </div>
        </Card>

        <Card title="Account Status" subtitle="Current session and visibility settings.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-dark-400">Team visibility</p>
              <p className="text-white">Enabled</p>
            </div>
            <div>
              <p className="text-dark-400">MFA</p>
              <p className="text-white">Not configured</p>
            </div>
            <div>
              <p className="text-dark-400">Last active</p>
              <p className="text-white">Just now</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}