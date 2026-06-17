import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Settings() {
  return (
    <PageContainer title="Settings" description="Manage product preferences and team security defaults.">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card title="Security Defaults" subtitle="These settings shape how the platform behaves for your team.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-dark-300">
            <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
              <p className="text-white font-medium">Scan notifications</p>
              <p className="mt-1">Enable alerts when scans complete or fail.</p>
            </div>
            <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
              <p className="text-white font-medium">Default severity threshold</p>
              <p className="mt-1">Highlight high and critical findings first.</p>
            </div>
            <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
              <p className="text-white font-medium">Retention policy</p>
              <p className="mt-1">Keep scan history for 90 days by default.</p>
            </div>
            <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
              <p className="text-white font-medium">CORS origin</p>
              <p className="mt-1">Local development is enabled for port 5173.</p>
            </div>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Save changes</Button>
            <Button variant="outline">Reset defaults</Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}