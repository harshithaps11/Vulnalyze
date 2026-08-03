import React from 'react';
import { Shield } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DashboardMetricsCard } from '../components/dashboard/DashboardMetricsCard';
import { RecentScansCard } from '../components/dashboard/RecentScansCard';
import { OWASPCoverageCard } from '../components/dashboard/OWASPCoverageCard';
import { QuickScanCard } from '../components/dashboard/QuickScanCard';
import { TeamActivityCard } from '../components/dashboard/TeamActivityCard';

export function Dashboard() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-3">
          <div className="card bg-gradient-to-r from-primary-900 to-dark-800 border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vulnalyze</h2>
                <p className="text-dark-300">
                  Your comprehensive security vulnerability scanning platform. 
                  Start a scan to discover and remediate security issues.
                </p>
              </div>
              <Shield className="h-16 w-16 text-primary-500 hidden md:block" />
            </div>
          </div>
        </div>
        
        {/* Metrics Card */}
        <div className="lg:col-span-1">
          <DashboardMetricsCard />
        </div>
        
        {/* Recent Scans */}
        <div className="lg:col-span-1">
          <RecentScansCard />
        </div>
        
        {/* OWASP Coverage */}
        <div className="lg:col-span-1">
          <OWASPCoverageCard />
        </div>
        
        {/* Quick Scan */}
        <div className="md:col-span-1">
          <QuickScanCard />
        </div>
        
        {/* Team Activity */}
        <div className="md:col-span-1 lg:col-span-2">
          <TeamActivityCard />
        </div>
      </div>
    </PageContainer>
  );
}