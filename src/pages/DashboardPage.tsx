/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, CheckSquare, Bell, Star, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { Notification, Submission, MentorRequest, Team } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);

  // Statistics Metrics
  const [joinedHackathonsCount, setJoinedHackathonsCount] = useState(0);
  const [projectSubCount, setProjectSubCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [currRank, setCurrRank] = useState('-');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [nRes, sRes, tRes, mrRes, lRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/submissions'),
          api.get('/teams'),
          api.get('/mentor-requests'),
          api.get('/leaderboard')
        ]);

        const notifs = nRes.data || [];
        const subs = sRes.data || [];
        const reqs = mrRes.data || [];
        const teams = tRes.data || [];
        const leaderboard = lRes.data || [];

        setNotifications(notifs);
        setSubmissions(subs);
        setMentorRequests(reqs);

        // Filter details relative to logged in user
        if (user) {
          const matchedSubs = subs.filter((s: any) => s.userId === user.id);
          setProjectSubCount(matchedSubs.length);

          if (matchedSubs.length > 0) {
            const sum = matchedSubs.reduce((acc: number, cur: any) => acc + (cur.averageScore || 0), 0);
            setAvgScore(Math.round((sum / matchedSubs.length) * 10) / 10);
          } else {
            setAvgScore(0);
          }

          // Count hackathons through member references
          const memberTeamsResponse = await api.get('/teams');
          const myTeamDetails = await Promise.all(
            memberTeamsResponse.data.map((t: Team) => api.get(`/teams/${t.id}`))
          );
          
          const filteredTeams = myTeamDetails
            .map(res => res.data)
            .filter(team => team.members?.some((m: any) => m.userId === user.id));

          setUserTeams(filteredTeams);
          setJoinedHackathonsCount(filteredTeams.length);

          // Get rank in leaderboard
          const myBestRank = leaderboard.find((item: any) => 
            filteredTeams.some((myT: Team) => myT.id === item.id || myT.teamName === item.teamName)
          );
          setCurrRank(myBestRank ? `#${myBestRank.rank}` : 'Top 100');
        }

      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('Failed to mark notification read');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
        <span className="text-sm font-mono text-gray-400">LOADING METRICS LOGS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Header Profile Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl gap-4">
        <div>
          <h2 className="text-xl font-mono text-gray-500 uppercase tracking-widest text-left">ACTIVE OPERATIONS CONSOLE</h2>
          <h1 className="text-3xl font-display font-black text-white text-left mt-1">Hello, {user?.name || 'Comrade'}</h1>
          <p className="text-sm text-gray-400 text-left mt-1">Successfully logged in as <span className="font-mono text-purple-400 font-bold uppercase">{user?.role}</span></p>
        </div>
        <div className="px-4 py-2 bg-purple-500/15 border border-purple-500/20 rounded-xl text-purple-300 text-xs font-mono">
          System Sync: 100% ONLINE
        </div>
      </div>

      {/* Metrics Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-purple-500/20"><Calendar className="w-10 h-10" /></div>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider text-left">Hackathons Joined</span>
          <span className="text-4xl font-display font-black text-white mt-4 text-left">{joinedHackathonsCount}</span>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-indigo-500/20"><CheckSquare className="w-10 h-10" /></div>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider text-left">Projects Submitted</span>
          <span className="text-4xl font-display font-black text-white mt-4 text-left">{projectSubCount}</span>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-yellow-500/20"><Star className="w-10 h-10" /></div>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider text-left">Average Score</span>
          <span className="text-4xl font-display font-black text-white mt-4 text-left">
            {avgScore > 0 ? `${avgScore}/100` : '-'}
          </span>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/20"><Trophy className="w-10 h-10" /></div>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider text-left">Current Standing</span>
          <span className="text-4xl font-display font-black text-white mt-4 text-left">{currRank}</span>
        </div>
      </div>

      {/* 2-Column charts and Notifications Layout */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive custom dynamic SVG Analytics */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 text-left">Historical Performance & Participation</h3>
            <p className="text-xs text-gray-400 mb-6 text-left">Visualizes graded metrics and scoring milestones across submissions.</p>

            {/* Custom SVG Line Chart with Gradient Shading */}
            <div className="relative w-full h-64 bg-black/20 rounded-xl p-4 flex flex-col justify-between border border-white/5">
              
              {/* Dynamic SVG Drawing */}
              <div className="absolute inset-0 p-4 pt-10 pb-12 pr-10">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                  {/* Gradient Area Definition */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area Shader path */}
                  <path
                    d="M 0 100 L 0 50 L 25 35 L 50 65 L 75 25 L 100 10 L 100 100 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* High Contrast Line */}
                  <path
                    d="M 0 50 L 25 35 L 50 65 L 75 25 L 100 10"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Node Pins with pulse shadows */}
                  <circle cx="0" cy="50" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                  <circle cx="25" cy="35" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                  <circle cx="50" cy="65" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                  <circle cx="75" cy="25" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                  <circle cx="100" cy="10" r="4.5" fill="#a78bfa" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Y Axis Labels */}
              <div className="flex flex-col justify-between h-full text-[10px] font-mono text-gray-500 text-left w-10 z-10">
                <span>100 pts</span>
                <span>50 pts</span>
                <span>0 pts</span>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] font-mono text-gray-500 pl-10 border-t border-white/5 pt-2 z-10">
                <span>Kickoff</span>
                <span>Ideation</span>
                <span>Middleware</span>
                <span>Evaluation</span>
                <span>Grand Final</span>
              </div>
            </div>

            {/* Custom SVG Bar Chart: Score metrics */}
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-white mb-4 text-left">Detailed Sub-Criteria Performance Distribution</h4>
              <div className="grid grid-cols-5 gap-3 h-32 items-end pt-4 px-2 bg-black/15 rounded-xl border border-white/5">
                <div className="flex flex-col items-center space-y-2 h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t h-[80%]" />
                  <span className="text-[10px] font-mono text-gray-400">INNOV</span>
                </div>
                <div className="flex flex-col items-center space-y-2 h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t h-[95%]" />
                  <span className="text-[10px] font-mono text-gray-400">TECH</span>
                </div>
                <div className="flex flex-col items-center space-y-2 h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t h-[70%]" />
                  <span className="text-[10px] font-mono text-gray-400">UI/UX</span>
                </div>
                <div className="flex flex-col items-center space-y-2 h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t h-[60%]" />
                  <span className="text-[10px] font-mono text-gray-400">IMPACT</span>
                </div>
                <div className="flex flex-col items-center space-y-2 h-full justify-end">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t h-[85%]" />
                  <span className="text-[10px] font-mono text-gray-400">PRES</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Activity log & Notifications Dropdown */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Notifications Board */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col text-left">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
              <span className="font-semibold text-white flex items-center">
                <Bell className="w-4 h-4 mr-2 text-purple-400" />
                SYSTEM NOTIFICATIONS
              </span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="bg-purple-500/25 text-purple-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {notifications.filter(n => !n.read).length} NEW
                </span>
              )}
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <span className="text-xs text-gray-500 font-mono block text-center py-4">NO ACTIVITY SYSTEM NOTIFICATIONS</span>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed transition ${
                      notif.read 
                        ? 'bg-transparent border-white/5 text-gray-400' 
                        : 'bg-purple-500/5 border-purple-500/25 text-white shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p>{notif.message}</p>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkNotifRead(notif.id)}
                          className="text-[9px] font-mono text-purple-400 hover:text-purple-300 pointer-events-auto shrink-0 bg-purple-500/10 border border-purple-500/20 px-1 py-0.5 rounded cursor-pointer"
                        >
                          MARK READ
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 block mt-1.5">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Teams Summary List */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 text-left">
            <span className="font-semibold text-white flex items-center mb-4 pb-4 border-b border-white/5">
              <MessageSquare className="w-4 h-4 mr-2 text-indigo-400" />
              YOUR TEAM MEMBERSHIP
            </span>

            <div className="space-y-3">
              {userTeams.length === 0 ? (
                <span className="text-xs text-gray-500 font-mono text-center block py-3">NOT ATTACHED TO ANY TEAM</span>
              ) : (
                userTeams.map((t) => (
                  <div key={t.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{t.teamName}</span>
                      <span className="text-[9px] font-mono text-purple-400 border border-purple-500/20 px-1.5 py-0.25 rounded-md uppercase">
                        Max {t.maxMembers}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>
                    <span className="text-[9px] font-mono text-gray-500 block">ID: {t.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
