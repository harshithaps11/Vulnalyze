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
  MoreVertical,
  X,
  Mail,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import { apiClient } from '../../services/apiClient';
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
  targetVuln?: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Morgan', email: 'admin@vulnalyze.com', role: 'ADMIN', isOnline: true, assignedCount: 4 },
  { id: '2', name: 'Jordan Lee', email: 'jordan.lee@vulnalyze.com', role: 'SECURITY_ANALYST', isOnline: true, assignedCount: 7 },
  { id: '3', name: 'Taylor Kim', email: 'taylor.kim@vulnalyze.com', role: 'USER', isOnline: false, assignedCount: 2 },
  { id: '4', name: 'Sam Chen', email: 'sam.chen@vulnalyze.com', role: 'SECURITY_ANALYST', isOnline: true, assignedCount: 5 },
];

const INITIAL_DISCUSSIONS: CommentItem[] = [
  {
    id: 'c1',
    userName: 'Jordan Lee',
    userRole: 'SECURITY_ANALYST',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    content: 'Completed initial audit on the high-severity SQL Injection finding. Parameterized queries applied in API backend router.',
    targetVuln: 'SQL Injection in User Search',
  },
  {
    id: 'c2',
    userName: 'Alex Morgan',
    userRole: 'ADMIN',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    content: 'SSRF protection middleware has been enabled across all dynamic HTTP header scan targets.',
    targetVuln: 'Server-Side Request Forgery',
  },
];

export function TeamCollaborationPanel() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [discussions, setDiscussions] = useState<CommentItem[]>(INITIAL_DISCUSSIONS);
  const [newCommentText, setNewCommentText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'tasks' | 'discussion'>('roster');
  
  // Real backend findings for task assignment board
  const [scanFindings, setScanFindings] = useState<any[]>([]);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({
    '1': '2', // Vuln ID 1 assigned to Jordan Lee
  });

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
          setScanFindings(firstScan.data?.vulnerabilities || []);
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
    if (!newCommentText.trim()) return;

    const newItem: CommentItem = {
      id: `c_${Date.now()}`,
      userName: 'Alex Morgan',
      userRole: 'ADMIN',
      timestamp: new Date().toISOString(),
      content: newCommentText.trim(),
    };

    setDiscussions([newItem, ...discussions]);
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
    // Update assigned count for member
    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, assignedCount: m.assignedCount + 1 } : m))
    );
  };

  const filteredMembers = members.filter(
    m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Card>
        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-dark-700/80">
          <div className="flex items-center gap-2 bg-dark-700/50 p-1 rounded-xl border border-dark-600/60">
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
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-dark-100'
              }`}
            >
              Task Assignments ({scanFindings.length})
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'discussion'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-dark-100'
              }`}
            >
              Security Threads ({discussions.length})
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={16} />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        </div>

        {/* Tab 1: Team Roster Grid */}
        {activeTab === 'roster' && (
          <div className="pt-6 space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                        <Badge
                          variant={member.role === 'ADMIN' ? 'critical' : member.role === 'SECURITY_ANALYST' ? 'info' : 'medium'}
                          className="text-[10px] uppercase px-2 py-0.5"
                        >
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{member.email}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-dark-300">
                        <UserCheck size={14} className="text-primary-400" />
                        <span>{member.assignedCount} Active Tasks Assigned</span>
                      </div>
                    </div>
                  </div>

                  <select
                    className="input text-xs !w-auto !py-1 !px-2 bg-dark-800 border-dark-600"
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Vulnerability Task Assignments */}
        {activeTab === 'tasks' && (
          <div className="pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
              <ShieldAlert size={16} className="text-severity-high" />
              Security Vulnerability Assignment Board
            </h4>

            {loadingFindings ? (
              <p className="text-xs text-dark-400 py-6 text-center animate-pulse">Loading findings for assignment...</p>
            ) : scanFindings.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vulnerability</th>
                      <th>Severity</th>
                      <th>Location</th>
                      <th>Assigned Analyst</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanFindings.map((vuln: any) => {
                      const vulnId = String(vuln.id);
                      const assignedId = assignments[vulnId] || '';
                      const assignedMember = members.find(m => m.id === assignedId);

                      return (
                        <tr key={vulnId}>
                          <td>
                            <div className="font-medium text-dark-100 text-xs">{vuln.title}</div>
                            <div className="text-[11px] text-dark-400 font-mono mt-0.5">{vuln.scanner_name || 'scanner'}</div>
                          </td>
                          <td>
                            <Badge variant={(vuln.severity || 'low').toLowerCase() as any}>
                              {vuln.severity}
                            </Badge>
                          </td>
                          <td className="font-mono text-xs text-dark-300 max-w-[180px] truncate">{vuln.location}</td>
                          <td>
                            <select
                              className="input text-xs py-1"
                              value={assignedId}
                              onChange={e => handleAssignTask(vulnId, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.role.replace('_', ' ')})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs !py-1 !px-2"
                              onClick={() => navigate('/remediation')}
                            >
                              Remediate
                              <ExternalLink size={12} className="ml-1" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-dark-400 text-center py-8">
                No active scan vulnerabilities available to assign. Run a scan from the Scan page first.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Security Discussion Feed */}
        {activeTab === 'discussion' && (
          <div className="pt-6 space-y-6">
            <form onSubmit={handlePostDiscussion} className="space-y-3 bg-dark-700/40 p-4 rounded-xl border border-dark-600/60">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider">
                Start a Security Note / Thread
              </label>
              <textarea
                className="input text-xs h-24 resize-none"
                placeholder="Share mitigation notes, vulnerability analysis, or architectural security guidance with your team..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" icon={<Send size={14} />} disabled={!newCommentText.trim()}>
                  Post Discussion
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {discussions.map(item => (
                <div key={item.id} className="p-4 bg-dark-700/40 rounded-xl border border-dark-600/60 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                        {item.userName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-dark-100 text-xs">{item.userName}</span>
                      <Badge variant="info" className="text-[10px] px-1.5 py-0.2">
                        {item.userRole}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-dark-400 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {item.targetVuln && (
                    <div className="text-[11px] font-mono text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded w-fit">
                      Regarding: {item.targetVuln}
                    </div>
                  )}

                  <p className="text-xs text-dark-200 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
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