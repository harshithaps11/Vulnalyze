import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Rocket, 
  ShieldAlert, 
  Search, 
  GitPullRequest, 
  Server,
  Loader2,
  AlertTriangle,
  Play,
  ExternalLink
} from 'lucide-react';

interface RepoTarget {
  id: string;
  name: string;
  language: string;
  status: 'pending' | 'analyzing' | 'generating' | 'pr_created' | 'failed';
  prUrl?: string;
}

const MOCK_REPOS: RepoTarget[] = [
  { id: '1', name: 'core-auth-service', language: 'TypeScript', status: 'pending' },
  { id: '2', name: 'payment-gateway-api', language: 'Python', status: 'pending' },
  { id: '3', name: 'user-profile-dashboard', language: 'React', status: 'pending' },
  { id: '4', name: 'internal-admin-tool', language: 'Go', status: 'pending' },
  { id: '5', name: 'legacy-billing-cron', language: 'Java', status: 'pending' },
  { id: '6', name: 'notification-worker', language: 'Node.js', status: 'pending' },
];

export function Campaigns() {
  const [selectedVuln, setSelectedVuln] = useState<string>('');
  const [isCampaignActive, setIsCampaignActive] = useState(false);
  const [repos, setRepos] = useState<RepoTarget[]>(MOCK_REPOS);
  const [campaignProgress, setCampaignProgress] = useState(0);

  const startCampaign = () => {
    if (!selectedVuln) return;
    setIsCampaignActive(true);
    setRepos(MOCK_REPOS.map(r => ({ ...r, status: 'pending' })));
    setCampaignProgress(0);

    let currentProgress = 0;
    
    // Staggered status updates for realism
    MOCK_REPOS.forEach((repo, index) => {
      // 1. Analyze phase
      setTimeout(() => {
        setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, status: 'analyzing' } : r));
      }, 1000 + (index * 800));

      // 2. Generation phase
      setTimeout(() => {
        setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, status: 'generating' } : r));
      }, 3000 + (index * 1200));

      // 3. PR Created phase
      setTimeout(() => {
        setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, status: 'pr_created', prUrl: `https://github.com/company/${repo.name}/pull/42` } : r));
        currentProgress += (100 / MOCK_REPOS.length);
        setCampaignProgress(Math.min(Math.round(currentProgress), 100));
      }, 6000 + (index * 1500));
    });
  };

  const getStatusBadge = (status: RepoTarget['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="low" className="bg-dark-700 text-dark-300">Pending</Badge>;
      case 'analyzing': return <Badge variant="info" className="animate-pulse"><Search size={12} className="mr-1 inline" /> Analyzing Codebase</Badge>;
      case 'generating': return <Badge variant="medium" className="animate-pulse"><Loader2 size={12} className="mr-1 inline animate-spin" /> Generating Fix via AI</Badge>;
      case 'pr_created': return <Badge variant="low" className="bg-emerald-500/20 text-emerald-400"><GitPullRequest size={12} className="mr-1 inline" /> PR Created</Badge>;
      case 'failed': return <Badge variant="critical"><AlertTriangle size={12} className="mr-1 inline" /> Failed</Badge>;
    }
  };

  return (
    <PageContainer
      title="Fleet-Wide Campaigns"
      description="Deploy autonomous AI agents to remediate systemic vulnerabilities across your entire organization."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Launcher */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Campaign Launcher" subtitle="Configure and launch a massive AI fix operation">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Target Vulnerability</label>
                <select 
                  className="input w-full"
                  value={selectedVuln}
                  onChange={(e) => setSelectedVuln(e.target.value)}
                  disabled={isCampaignActive}
                >
                  <option value="">Select a vulnerability to fix...</option>
                  <option value="sqli">CWE-89: SQL Injection (14 affected repos)</option>
                  <option value="log4j">CVE-2021-44228: Log4Shell (6 affected repos)</option>
                  <option value="xss">CWE-79: Cross-Site Scripting (22 affected repos)</option>
                </select>
              </div>

              {selectedVuln && !isCampaignActive && (
                <div className="p-4 bg-dark-800 border border-dark-700 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-dark-200 mb-2">
                    <Server size={16} className="text-primary-400" />
                    <span>Targeting <strong>{MOCK_REPOS.length} Repositories</strong></span>
                  </div>
                  <p className="text-xs text-dark-400">Vulnalyze CrewAI agents will clone, analyze, fix, and open Pull Requests for all affected repositories in parallel.</p>
                </div>
              )}

              <Button 
                variant="primary" 
                className={`w-full py-3 text-sm font-bold ${isCampaignActive ? 'opacity-50 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
                icon={isCampaignActive ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                onClick={startCampaign}
                disabled={!selectedVuln || isCampaignActive}
              >
                {isCampaignActive ? 'Campaign Running...' : 'Launch Fleet-Wide AI Fix'}
              </Button>
            </div>
          </Card>

          {isCampaignActive && (
            <Card className="bg-gradient-to-br from-primary-900/20 to-dark-900 border-primary-500/30">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Rocket size={16} className="text-primary-400" />
                Campaign Metrics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dark-300">Overall Progress</span>
                    <span className="text-primary-400 font-bold">{campaignProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-500 ease-out"
                      style={{ width: `${campaignProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-dark-800/50 rounded border border-dark-700">
                    <div className="text-2xl font-bold text-white">{repos.filter(r => r.status === 'pr_created').length}</div>
                    <div className="text-[10px] text-dark-400 uppercase">PRs Created</div>
                  </div>
                  <div className="p-3 bg-dark-800/50 rounded border border-dark-700">
                    <div className="text-2xl font-bold text-white">{repos.length}</div>
                    <div className="text-[10px] text-dark-400 uppercase">Total Targets</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Fleet Status */}
        <div className="lg:col-span-2">
          <Card title="Live Fleet Operations" subtitle="Real-time monitoring of AI agents across your infrastructure" className="h-full">
            {!selectedVuln ? (
              <div className="flex flex-col items-center justify-center h-64 text-dark-400">
                <ShieldAlert size={48} className="text-dark-600 mb-4" />
                <p>Select a vulnerability to map affected repositories.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Repository</th>
                      <th>Language</th>
                      <th>Agent Status</th>
                      <th>Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repos.map(repo => (
                      <tr key={repo.id}>
                        <td>
                          <div className="font-semibold text-sm text-dark-100 flex items-center gap-2">
                            <Server size={14} className="text-dark-400" />
                            {repo.name}
                          </div>
                        </td>
                        <td>
                          <span className="text-xs font-mono text-dark-300 bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                            {repo.language}
                          </span>
                        </td>
                        <td>
                          {getStatusBadge(repo.status)}
                        </td>
                        <td>
                          {repo.status === 'pr_created' ? (
                            <a 
                              href={repo.prUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                            >
                              View PR <ExternalLink size={12} />
                            </a>
                          ) : repo.status === 'pending' ? (
                            <span className="text-xs text-dark-500">-</span>
                          ) : (
                            <span className="text-xs text-dark-400 font-mono">processing...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
