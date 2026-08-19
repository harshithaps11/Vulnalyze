import React, { useEffect, useState } from 'react';
import { Cloud, Server, Database, Shield, Globe, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';

export interface TopologyNode {
  id: string;
  type: 'internet' | 'ec2' | 'rds' | 'waf' | 'subnet';
  label: string;
  subLabel?: string;
  isVulnerable?: boolean;
}

export interface TopologyEdge {
  from: string;
  to: string;
  isAttackPath?: boolean;
  label?: string;
  delayMs?: number;
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  attackSummary?: string;
}

// Simulated backend data that would normally come from parsing Terraform state or AWS APIs
const MOCK_TOPOLOGY_DATA: TopologyData = {
  nodes: [
    { id: 'n1', type: 'internet', label: 'Public Internet' },
    { id: 'n2', type: 'ec2', label: 'Web EC2 Instance', subLabel: 'i-0a1b2c3d4e', isVulnerable: true },
    { id: 'n3', type: 'rds', label: 'Customer DB (RDS)', subLabel: 'Private Subnet', isVulnerable: true }
  ],
  edges: [
    { from: 'n1', to: 'n2', isAttackPath: true, label: 'Port 22 Open (0.0.0.0/0)', delayMs: 0 },
    { from: 'n2', to: 'n3', isAttackPath: true, label: 'Lateral Movement (IAM Role)', delayMs: 1000 }
  ],
  attackSummary: 'The Terraform misconfiguration on aws_security_group.web_sg exposes the Web EC2 Instance to the public internet on Port 22. Because this instance has an overly permissive IAM Role attached, an attacker could assume this role to access the Private RDS Database, bypassing network segmentation.'
};

export function CloudTopologyMap({ data = MOCK_TOPOLOGY_DATA }: { data?: TopologyData }) {
  const [animatePath, setAnimatePath] = useState(false);

  useEffect(() => {
    // Trigger animation after initial render
    const timer = setTimeout(() => setAnimatePath(true), 500);
    return () => clearTimeout(timer);
  }, [data]);

  const renderIcon = (type: string, isVulnerable: boolean, animatePath: boolean) => {
    const iconClass = isVulnerable && animatePath ? 'text-severity-critical' : 'text-dark-300';
    switch (type) {
      case 'internet': return <Globe size={32} className="text-dark-300 group-hover:text-primary-400" />;
      case 'ec2': return <Server size={32} className={iconClass} />;
      case 'rds': return <Database size={32} className={iconClass} />;
      case 'waf': return <Shield size={32} className={iconClass} />;
      default: return <Cloud size={32} className={iconClass} />;
    }
  };

  return (
    <Card className="p-6 bg-dark-900 border-dark-700 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <Globe className="text-primary-500" />
            Attack Surface Topology
          </h3>
          <p className="text-sm text-dark-400">Dynamically generated from infrastructure state</p>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
            <span className="text-dark-300">Secure Asset</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-severity-critical/20 border border-severity-critical animate-pulse"></div>
            <span className="text-severity-critical">Exposed Asset</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[300px] bg-dark-950/50 rounded-xl border border-dark-800 p-8 flex items-center justify-between">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none rounded-xl"></div>

        {data.nodes.map((node, index) => {
          const isLast = index === data.nodes.length - 1;
          const edgeToNext = !isLast ? data.edges.find(e => e.from === node.id && e.to === data.nodes[index + 1].id) : null;
          
          return (
            <React.Fragment key={node.id}>
              {/* Node */}
              <div className="relative z-10 flex flex-col items-center group">
                {node.isVulnerable && node.type !== 'rds' && (
                  <div className="absolute -top-3 -right-3 z-20 animate-bounce">
                    <ShieldAlert size={20} className="text-severity-critical drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors border-2 ${node.isVulnerable && animatePath && node.type !== 'internet' ? 'bg-severity-critical/10 border-severity-critical' : 'bg-dark-800 border-dark-600'}`}>
                   {node.type === 'rds' && node.isVulnerable && (
                      <div className={`absolute inset-0 bg-severity-critical/20 transition-opacity duration-1000 delay-2000 ${animatePath ? 'opacity-100' : 'opacity-0'}`}></div>
                   )}
                   {renderIcon(node.type, !!node.isVulnerable, animatePath)}
                </div>
                <span className={`mt-3 text-xs font-semibold transition-colors duration-1000 ${node.isVulnerable && animatePath ? 'text-severity-critical' : 'text-dark-300'}`}>
                  {node.label}
                </span>
                {node.subLabel && (
                  <span className="text-[10px] text-dark-400 font-mono mt-1">{node.subLabel}</span>
                )}
              </div>

              {/* Edge (if not last node) */}
              {edgeToNext && (
                <div className="flex-1 relative h-0.5 bg-dark-700 mx-4">
                  {edgeToNext.isAttackPath && (
                    <div 
                      className={`absolute inset-0 bg-severity-critical origin-left transition-transform duration-1000 ease-out ${animatePath ? 'scale-x-100' : 'scale-x-0'}`}
                      style={{ transitionDelay: `${edgeToNext.delayMs || 0}ms` }}
                    ></div>
                  )}
                  {edgeToNext.label && (
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 -mt-3 text-severity-critical transition-opacity duration-500 left-1/2 -translate-x-1/2 bg-dark-950 px-2 rounded text-[10px] font-bold border border-severity-critical/30 ${animatePath ? 'opacity-100' : 'opacity-0'}`}
                      style={{ transitionDelay: `${(edgeToNext.delayMs || 0) + 1000}ms` }}
                    >
                      {edgeToNext.label}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {data.attackSummary && (
        <div className={`mt-6 p-4 rounded-lg bg-severity-critical/10 border border-severity-critical/20 flex gap-4 transition-all duration-1000 delay-[2500ms] ${animatePath ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <AlertTriangle className="text-severity-critical shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-severity-critical mb-1">Critical Attack Path Detected</h4>
            <p className="text-xs text-dark-200 leading-relaxed font-mono">
              {data.attackSummary}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
