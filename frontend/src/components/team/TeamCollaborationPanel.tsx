import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  Send, 
  X,
  Mail,
  Clock,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import { apiClient, authApi } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SECURITY_ANALYST' | 'USER';
  isOnline: boolean;
  assignedCount: number;
}

interface CommentItem {
  id: string;
  userName: string;
  userRole: string;
  timestamp: string;
  content: string;
  targetVulnId?: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Morgan', email: 'admin@vulnalyze.com', role: 'ADMIN', isOnline: true, assignedCount: 4 },
  { id: '2', name: 'Jordan Lee', email: 'jordan.lee@vulnalyze.com', role: 'SECURITY_ANALYST', isOnline: true, assignedCount: 7 },
  { id: '3', name: 'Taylor Kim', email: 'taylor.kim@vulnalyze.com', role: 'USER', isOnline: false, assignedCount: 2 },
  { id: '4', name: 'Sam Chen', email: 'sam.chen@vulnalyze.com', role: 'SECURITY_ANALYST', isOnline: true, assignedCount: 5 },
];

export function TeamCollaborationPanel() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [discussions, setDiscussions] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'triage'>('triage');
  
  // Real backend findings for task assignment board
  const [scanFindings, setScanFindings] = useState<any[]>([]);
  const [loadingFindings, setLoadingFindings] = useState(false);
  
  const userRole = authApi.getRole();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  
  // Selection state for split-pane Triage Hub
  const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);

  // Invite Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SECURITY_ANALYST' | 'USER'>('SECURITY_ANALYST');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Fetch real scan findings from backend to populate team tasks
  useEffect(() => {
    async function fetchFindings() {
      setLoadingFindings(true);
      try {
        const res = await apiClient.get('/scans');
        const scans = res.data || [];
        if (scans.length > 0) {
          const firstScan = await apiClient.get(`/scans/${scans[0].uuid}`);
          const vulns = firstScan.data?.vulnerabilities || [];
          setScanFindings(vulns);
          if (vulns.length > 0) {
            setSelectedVulnId(String(vulns[0].id));
          }
          
          // Seed some initial mock assignments and discussions based on real data
          if (vulns.length > 0) {
            setAssignments({ [String(vulns[0].id)]: '2' });
            setDiscussions([
              {
                id: 'c1',
                userName: 'Jordan Lee',
                userRole: 'SECURITY_ANALYST',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                content: 'I am taking a look at this finding now. Looks like we need to implement parameterized queries.',
                targetVulnId: String(vulns[0].id),
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load team task findings:', err);
      } finally {
        setLoadingFindings(false);
      }
    }

    fetchFindings();
  }, []);

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedVulnId) return;

    const newItem: CommentItem = {
      id: `c_${Date.now()}`,
      userName: 'Alex Morgan',
      userRole: 'ADMIN',
      timestamp: new Date().toISOString(),
      content: newCommentText.trim(),
      targetVulnId: selectedVulnId
    };

    setDiscussions([...discussions, newItem]);
    setNewCommentText('');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    const newMember: TeamMember = {
      id: String(Date.now()),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      isOnline: true,
      assignedCount: 0,
    };

    setMembers([...members, newMember]);
    setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
    setTimeout(() => {
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteSuccess(null);
    }, 1200);
  };

  const handleAssignTask = (vulnId: string, memberId: string) => {
    setAssignments(prev => ({ ...prev, [vulnId]: memberId }));
    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, assignedCount: m.assignedCount + 1 } : m))
    );
  };

  const filteredMembers = members.filter(
    m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedVuln = scanFindings.find(v => String(v.id) === selectedVulnId);
  const activeDiscussions = discussions.filter(d => d.targetVulnId === selectedVulnId);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">Team Members</p>
              <h3 className="text-2xl font-bold text-dark-100 mt-1">{members.length}</h3>
              <p className="text-[11px] text-severity-low font-medium mt-1">
                {members.filter(m => m.isOnline).length} Active Online
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-600/15 text-primary-400 flex items-center justify-center border border-primary-500/30">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">Assigned Tasks</p>
              <h3 className="text-2xl font-bold text-dark-100 mt-1">
                {scanFindings.length > 0 ? scanFindings.length : Object.keys(assignments).length + 8}
              </h3>
              <p className="text-[11px] text-severity-medium font-medium mt-1">In Security Triage</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-severity-medium/15 text-severity-medium flex items-center justify-center border border-severity-medium/30">
              <ShieldAlert size={20} />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">Resolution Rate</p>
              <h3 className="text-2xl font-bold text-dark-100 mt-1">92.4%</h3>
              <p className="text-[11px] text-severity-low font-medium mt-1">↑ 4.2% this week</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-severity-low/15 text-severity-low flex items-center justify-center border border-severity-low/30">
              <ShieldCheck size={20} />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">Discussions</p>
              <h3 className="text-2xl font-bold text-dark-100 mt-1">{discussions.length}</h3>
              <p className="text-[11px] text-primary-400 font-medium mt-1">Active Threads</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <MessageSquare size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Collaboration Hub */}
      <Card className="!p-0 overflow-hidden flex flex-col h-[700px]">
        {/* Navigation Tabs & Actions */}
        <div className="flex justify-between items-center p-4 border-b border-dark-700/80 bg-dark-800/50">
          <div className="flex items-center gap-2 bg-dark-700/50 p-1 rounded-xl border border-dark-600/60">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'triage'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-dark-100'
              }`}
            >
              Security Triage Hub ({scanFindings.length})
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'roster'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-dark-100'
              }`}
            >
              Team Roster ({members.length})
            </button>
          </div>

          {activeTab === 'roster' && userRole === 'ADMIN' && (
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={16} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Tab 1: Security Triage Hub (Split Pane) */}
          {activeTab === 'triage' && (
            <div className="flex h-full">
              {/* Left Column: Vulnerability List */}
              <div className="w-1/3 border-r border-dark-700/80 bg-dark-800/30 overflow-y-auto custom-scrollbar flex flex-col">
                {loadingFindings ? (
                  <div className="flex-1 flex items-center justify-center text-dark-400 text-xs animate-pulse p-4">
                    Loading finding backlog...
                  </div>
                ) : scanFindings.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-dark-400 text-xs p-4 text-center">
                    No vulnerabilities found in the latest scan.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {scanFindings.map(vuln => {
                      const vId = String(vuln.id);
                      const isSelected = selectedVulnId === vId;
                      const isAssigned = !!assignments[vId];
                      return (
                        <div 
                          key={vId}
                          onClick={() => setSelectedVulnId(vId)}
                          className={`p-4 border-b border-dark-700/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-dark-700/30 border-l-2 border-l-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={(vuln.severity || 'low').toLowerCase() as any} className="text-[9px]">
                              {vuln.severity}
                            </Badge>
                            {isAssigned && (
                              <UserCheck size={14} className="text-primary-500" title="Assigned" />
                            )}
                          </div>
                          <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-400' : 'text-dark-100'}`}>
                            {vuln.title}
                          </h4>
                          <p className="text-xs text-dark-400 font-mono truncate mt-1">{vuln.location}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Triage Details & Chat */}
              <div className="w-2/3 bg-dark-800/10 flex flex-col h-full overflow-hidden">
                {selectedVuln ? (
                  <>
                    <div className="p-6 border-b border-dark-700/80 flex-shrink-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={(selectedVuln.severity || 'low').toLowerCase() as any}>
                              {selectedVuln.severity}
                            </Badge>
                            <span className="text-xs text-dark-400 font-mono bg-dark-700/50 px-2 py-0.5 rounded">
                              {selectedVuln.scanner_name || 'SAST'}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-dark-100 mb-2">{selectedVuln.title}</h2>
                          <p className="text-sm text-dark-300 font-mono mb-4">{selectedVuln.location}</p>
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300"
                          icon={<Bot size={16} />}
                          onClick={() => {
                            // Fix navigation state pass-through!
                            navigate('/remediation', {
                              state: {
                                code: selectedVuln.evidence || `// Vulnerability: ${selectedVuln.title}\n// Location: ${selectedVuln.location}`,
                                line: selectedVuln.lineNumber || 1,
                                title: selectedVuln.title,
                                vulnId: selectedVuln.id,
                                description: selectedVuln.description
                              }
                            });
                          }}
                        >
                          Auto-Fix with AI Crew
                        </Button>
                      </div>

                      <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/50 mb-4">
                        <p className="text-sm text-dark-200">{selectedVuln.description}</p>
                      </div>

                      <div className="flex items-center justify-between bg-dark-700/30 p-3 rounded-lg border border-dark-600/30">
                        <span className="text-sm font-medium text-dark-200">Assignment</span>
                        {userRole === 'ADMIN' ? (
                          <select
                            className="input text-xs w-48 py-1.5"
                            value={assignments[String(selectedVuln.id)] || ''}
                            onChange={e => handleAssignTask(String(selectedVuln.id), e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.role.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-primary-400">
                            {assignments[String(selectedVuln.id)] ? members.find(m => m.id === assignments[String(selectedVuln.id)])?.name : 'Unassigned'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {activeDiscussions.length === 0 ? (
                        <div className="text-center py-8 text-dark-400 text-sm">
                          No discussions yet. Start the triage thread below.
                        </div>
                      ) : (
                        activeDiscussions.map(item => (
                          <div key={item.id} className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs border border-primary-500/20">
                                  {item.userName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="font-semibold text-dark-100 text-xs">{item.userName}</span>
                                <Badge variant="info" className="text-[9px] px-1.5 py-0.2 uppercase">
                                  {item.userRole.replace('_', ' ')}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-dark-400 flex items-center gap-1">
                                <Clock size={12} />
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-dark-200 leading-relaxed pl-9">{item.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 border-t border-dark-700/80 bg-dark-800/50">
                      <form onSubmit={handlePostDiscussion} className="flex gap-2 relative">
                        <input
                          type="text"
                          className="input flex-1 text-sm bg-dark-900 border-dark-600 pr-12"
                          placeholder="Add triage notes or discuss mitigation..."
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                        />
                        <Button 
                          type="submit" 
                          variant="primary" 
                          className="absolute right-1 top-1 bottom-1 !p-2"
                          disabled={!newCommentText.trim()}
                        >
                          <Send size={16} />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-dark-400 p-8 text-center">
                    <ShieldCheck size={48} className="text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-200 mb-2">Select a finding to triage</h3>
                    <p className="text-sm max-w-md">Choose a vulnerability from the backlog to assign team members, discuss mitigation, and trigger automated AI remediation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Team Roster */}
          {activeTab === 'roster' && (
            <div className="p-6 space-y-4 h-full overflow-y-auto">
              <div className="relative max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  className="input pl-10 text-xs"
                  placeholder="Search team members by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60 hover:border-dark-500 transition-all flex items-start justify-between shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-sm border border-primary-500/30">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-800 ${
                            member.isOnline ? 'bg-severity-low' : 'bg-dark-500'
                          }`}
                          title={member.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-dark-100">{member.name}</h4>
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5 mb-2">{member.email}</p>
                        <select
                          className="input text-[10px] uppercase font-semibold !w-auto !py-1 !px-2 bg-dark-800 border-dark-600 text-primary-400"
                          value={member.role}
                          onChange={e => {
                            const newRole = e.target.value as any;
                            setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, role: newRole } : m)));
                          }}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="SECURITY_ANALYST">Security Analyst</option>
                          <option value="USER">Developer</option>
                        </select>
                        <div className="flex items-center gap-2 mt-3 text-xs text-dark-300">
                          <UserCheck size={14} className="text-primary-400" />
                          <span>{member.assignedCount} Tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Invite Team Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-dark-700">
              <h3 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                <UserPlus size={18} className="text-primary-400" />
                Invite Team Member
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-dark-400 hover:text-dark-100 p-1">
                <X size={18} />
              </button>
            </div>

            {inviteSuccess && (
              <div className="p-3 bg-severity-low/10 border border-severity-low/30 rounded-lg text-xs text-severity-low">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Full Name</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="Morgan Vance"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="email"
                    className="input pl-10 text-xs"
                    placeholder="morgan@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Role Assignment</label>
                <select
                  className="input text-xs"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                >
                  <option value="SECURITY_ANALYST">Security Analyst (Triages & Remediates Findings)</option>
                  <option value="ADMIN">Admin (Full Workspace Management)</option>
                  <option value="USER">Developer (Views assigned tasks & code fixes)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}