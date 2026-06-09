/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, UserMinus, Send, MessageSquare, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import api from '../services/api';
import { Team, Hackathon, Mentor } from '../types';

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Teams lists
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [mentorsList, setMentorsList] = useState<Mentor[]>([]);

  // Navigation Workspace toggle
  const [workspaceTeam, setWorkspaceTeam] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'workspace'>('listings');

  // Create Team Input fields
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [targetHackathonId, setTargetHackathonId] = useState('');

  // Team Member Invite input
  const [inviteEmail, setInviteEmail] = useState('');

  // Chat inputs & states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Mentor Request inputs
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [mentorRequestMsg, setMentorRequestMsg] = useState('');

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tRes, hRes, mRes] = await Promise.all([
        api.get('/teams'),
        api.get('/hackathons'),
        api.get('/mentors')
      ]);

      setAllTeams(tRes.data);
      setHackathons(hRes.data);
      setMentorsList(mRes.data);

      if (hRes.data.length > 0) {
        setTargetHackathonId(hRes.data[0].id);
      }

      // Check if user is in any team and load workspace
      if (user) {
        const teamsJoined = await Promise.all(
          tRes.data.map((t: Team) => api.get(`/teams/${t.id}`))
        );
        const myTeam = teamsJoined
          .map(res => res.data)
          .find(tData => tData.members?.some((m: any) => m.userId === user.id));

        if (myTeam) {
          setWorkspaceTeam(myTeam);
          setActiveTab('workspace'); // Auto-focus workspace if in a team!
          await fetchChatMessages(myTeam.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (teamId: string) => {
    try {
      const chatRes = await api.get(`/teams/${teamId}/messages`);
      setChatMessages(chatRes.data);
    } catch (err) {
      console.warn('Failed to load chat history');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user]);

  // Handle Send Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !workspaceTeam) return;

    try {
      const res = await api.post(`/teams/${workspaceTeam.id}/messages`, { message: newMessageText.trim() });
      setChatMessages(prev => [...prev, res.data]);
      setNewMessageText('');
    } catch (err) {
      setError('Failed to send text message.');
    }
  };

  // Create Team Trigger
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamName || !targetHackathonId) {
      setError('Team name and Hackathon selection are required');
      return;
    }

    try {
      const res = await api.post('/teams', {
        teamName,
        description: teamDesc,
        maxMembers,
        hackathonId: targetHackathonId
      });

      setSuccess(`Team "${teamName}" created successfully!`);
      // Reload everything
      await loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to form team');
    }
  };

  // Invite member by email
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail || !workspaceTeam) return;

    try {
      const res = await api.post(`/teams/${workspaceTeam.id}/invite`, { email: inviteEmail });
      setSuccess(`User added to team!`);
      setInviteEmail('');
      // Reload workspace team details
      const workspaceRefreshed = await api.get(`/teams/${workspaceTeam.id}`);
      setWorkspaceTeam(workspaceRefreshed.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member to team');
    }
  };

  // Remove member
  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!workspaceTeam) return;
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/teams/${workspaceTeam.id}/members/${userIdToRemove}`);
      setSuccess(`Member removed successfully from team!`);
      // Refresh
      const workspaceRefreshed = await api.get(`/teams/${workspaceTeam.id}`);
      setWorkspaceTeam(workspaceRefreshed.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to eject member');
    }
  };

  // Submit Mentor support Alignment
  const handleSubmitMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedMentorId || !workspaceTeam) {
      setError('Please choose a mentor');
      return;
    }

    try {
      await api.post('/mentor-requests', {
        teamId: workspaceTeam.id,
        mentorId: selectedMentorId,
        message: mentorRequestMsg
      });

      setSuccess('Mentor support request submitted successfully!');
      setMentorRequestMsg('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit mentor alignment');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Team Management</h1>
          <p className="text-sm text-gray-400 mt-1">Coordinate roles, execute sprints, and synchronize project workscopes.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition cursor-pointer ${
              activeTab === 'listings' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Active Teams
          </button>
          
          {workspaceTeam && (
            <button
              onClick={() => {
                setActiveTab('workspace');
                fetchChatMessages(workspaceTeam.id);
              }}
              className={`py-2 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition cursor-pointer ${
                activeTab === 'workspace' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 Workspace Workspace
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-500/15 border border-green-500/20 rounded-xl text-green-300 text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/20 rounded-xl text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Render Main Listings Tab */}
      {activeTab === 'listings' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Team Listings */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xl font-bold text-white text-left">Registered Dynamic Cohorts</h3>
            {loading ? (
              <p className="text-xs font-mono text-gray-500">Retrieving groups...</p>
            ) : allTeams.length === 0 ? (
              <p className="text-xs font-mono text-gray-500">No active cohorts currently registered.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {allTeams.map((t) => (
                  <div key={t.id} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col justify-between hover:border-purple-500/25 transition">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-purple-400">ID: {t.id}</span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-gray-400">
                          {hackathons.find(h => h.id === t.hackathonId)?.title || 'Hackathon Arena'}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white line-clamp-1">{t.teamName}</h4>
                      <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-2">{t.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 mt-2 border-t border-white/5 text-xs text-gray-500 font-mono">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Support Limit: {t.maxMembers} Coders</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Register/Create Team Builder */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              <Plus className="w-4 h-4" />
              <span>Team Registration</span>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Team Name *</label>
                <input
                  id="nt-name"
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Alpha Agents"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Target Hackathon *</label>
                <select
                  id="nt-hack"
                  value={targetHackathonId}
                  onChange={(e) => setTargetHackathonId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 outline-none focus:border-purple-500 text-sm cursor-pointer"
                >
                  {hackathons.map(h => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Maximum Team Limit</label>
                <input
                  id="nt-limit"
                  type="number"
                  min="1"
                  max="8"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Description / Bio</label>
                <textarea
                  id="nt-desc"
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Specify teammates criteria or tech priorities..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Create Cohort Group
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Render Workspace Workspace Tab */}
      {activeTab === 'workspace' && workspaceTeam && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Workspace Left Column: Teammates lists, Invite Members, request Mentor */}
          <div className="lg:col-span-8 space-y-6 text-left">
            
            {/* Header card */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">{workspaceTeam.hackathonTitle}</span>
                <h3 className="text-2xl font-black text-white mt-1 uppercase">{workspaceTeam.teamName} WORKSPACE</h3>
                <p className="text-xs text-gray-400 mt-1">{workspaceTeam.description}</p>
              </div>

              <div className="grid grid-cols-2 mt-6 pt-4 border-t border-white/5 text-xs text-gray-400">
                <span>Leader: <b className="text-white">{workspaceTeam.leaderName}</b></span>
                <span>Active Members: <b className="text-purple-300 font-mono">{workspaceTeam.members?.length || 1} / {workspaceTeam.maxMembers}</b></span>
              </div>
            </div>

            {/* Members Lists */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <span className="font-semibold text-white block mb-4">Cohort Members Profiles</span>
              
              <div className="space-y-3">
                {workspaceTeam.members?.map((member: any) => (
                  <div key={member.userId} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white flex items-center">
                        {member.name}
                        {member.userId === workspaceTeam.leaderId && (
                          <span className="ml-2 font-mono text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1 py-0.25 rounded">TEAM LEADER</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{member.email}</p>
                    </div>

                    {user?.id === workspaceTeam.leaderId && member.userId !== workspaceTeam.leaderId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 border border-red-500/25 px-2 py-1 rounded bg-red-500/5 cursor-pointer flex items-center"
                      >
                        <UserMinus className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite members Form */}
            {user?.id === workspaceTeam.leaderId && (
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <span className="font-semibold text-white block mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-indigo-400" />
                  Invite / Add Registered Developers
                </span>
                <p className="text-xs text-gray-400 mb-4 font-light">Input the email ID of registered developers to add them instantly to your sprint team.</p>

                <form onSubmit={handleInviteMember} className="flex gap-2">
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="teammate@hackathon.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-grow px-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-xl cursor-pointer shrink-0"
                  >
                    ADD USER
                  </button>
                </form>
              </div>
            )}

            {/* Request Mentor Support module */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <span className="font-semibold text-white block flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                Request Advisor Matching Alignment
              </span>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Connect with professional advisors for architectural feedback. Select a mentor below to submit an consultation request.
              </p>

              <form onSubmit={handleSubmitMentorRequest} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Verify Mentor *</label>
                  <select
                    id="mentor-select"
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select Mentor...</option>
                    {mentorsList.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.skills})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Sprints Topic Description / Requirements</label>
                  <textarea
                    id="mentor-req-msg"
                    value={mentorRequestMsg}
                    onChange={(e) => setMentorRequestMsg(e.target.value)}
                    placeholder="We need assistance structuring our custom SVG visualizations and scaling node routes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Submit Mentor Request
                </button>
              </form>
            </div>

          </div>

          {/* Workspace Right Column: Team Live Chat Board */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-[580px] text-left">
            <div className="border-b border-white/5 pb-4">
              <span className="font-semibold text-white flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-400" />
                TEAM CHAT LOGS
              </span>
              <p className="text-[10px] text-gray-500 font-mono mt-1">Live sprint alignment chat</p>
            </div>

            {/* Chat message lists */}
            <div className="flex-grow overflow-y-auto space-y-3 my-4 pr-1">
              {chatMessages.length === 0 ? (
                <p className="text-[11px] font-mono text-gray-500 text-center py-8">NO CHAT LOGS YET. KICKOFF THE CHAT!</p>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-mono text-gray-500 mb-0.5">{msg.senderName}</span>
                      <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${isMe ? 'bg-purple-500/20 text-white rounded-tr-none border border-purple-500/10' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'}`}>
                        {msg.message}
                      </div>
                      <span className="text-[8px] font-mono text-gray-600 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send chat block */}
            <form onSubmit={handleSendMessage} className="border-t border-white/5 pt-4 flex gap-2">
              <input
                id="chat-input"
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Message team..."
                className="flex-grow px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>
      )}

    </div>
  );
};
