import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { PageContainer } from '../components/layout/PageContainer';
import { DashboardMetricsCard } from '../components/dashboard/DashboardMetricsCard';
import { RecentScansCard } from '../components/dashboard/RecentScansCard';
import { OWASPCoverageCard } from '../components/dashboard/OWASPCoverageCard';
import { QuickScanCard } from '../components/dashboard/QuickScanCard';
import { TeamActivityCard } from '../components/dashboard/TeamActivityCard';
import { CloudTopologyMap } from '../components/dashboard/CloudTopologyMap';
import { VulnerabilityTable } from '../components/results/VulnerabilityTable';

export function Dashboard() {
  const [liveTopology, setLiveTopology] = useState<any>(null);

  useEffect(() => {
    async function fetchLiveTopology() {
      try {
        const response = await apiClient.get('/scans');
        const scans = response.data || [];
        if (scans.length > 0) {
          const latestScan = scans[0];
          const vulns = latestScan.vulnerabilities || [];
          const hasVulns = vulns.length > 0;
          
          // Generate a dynamic topology based on the actual target URL
          const target = latestScan.target_url || 'source-code-upload';
          const isWebTarget = target.startsWith('http') || target.includes('.');

          const dynamicNodes = [
            { id: 'n1', type: 'internet', label: 'Public Internet' },
            { 
              id: 'n2', 
              type: isWebTarget ? 'waf' : 'ec2', 
              label: isWebTarget ? 'Web Gateway / ALB' : 'Ingress Controller', 
              subLabel: target,
              isVulnerable: hasVulns 
            },
            { 
              id: 'n3', 
              type: 'rds', 
              label: 'Backend Data Store', 
              subLabel: 'Internal Network', 
              isVulnerable: hasVulns 
            }
          ];

          const dynamicEdges = [
            { from: 'n1', to: 'n2', isAttackPath: hasVulns, label: hasVulns ? 'Missing Security Headers / Exposures' : 'Secure Traffic', delayMs: 0 },
            { from: 'n2', to: 'n3', isAttackPath: hasVulns, label: hasVulns ? 'Potential Lateral Movement' : 'Protected', delayMs: 1000 }
          ];

          setLiveTopology({
            nodes: dynamicNodes,
            edges: dynamicEdges,
            attackSummary: hasVulns 
              ? `Live scan of ${target} detected ${vulns.length} vulnerabilities. Attackers could exploit these perimeter weaknesses (e.g., missing strict transport security) to intercept traffic or compromise the gateway and pivot to internal data stores.`
              : undefined
          });
        }
      } catch (err) {
        console.error('Failed to fetch topology data', err);
      }
    }
    fetchLiveTopology();
  }, []);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-3">
          <div className="card welcome-banner bg-gradient-to-r from-primary-900 to-dark-800 border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vulnalyze</h2>
                <p className="text-dark-200">
                  Your comprehensive security vulnerability scanning platform. 
                  Start a scan to discover and remediate security issues.
                </p>
              </div>
              <Shield className="h-16 w-16 text-primary-400 hidden md:block" />
            </div>
          </div>
        </div>

        {/* Cloud Topology Map - Front and Center */}
        <div className="lg:col-span-3">
          {liveTopology ? (
            <CloudTopologyMap data={liveTopology} />
          ) : (
            <CloudTopologyMap />
          )}
        </div>

        {/* Recent Vulnerabilities Table */}
        <div className="lg:col-span-3">
          <VulnerabilityTable />
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