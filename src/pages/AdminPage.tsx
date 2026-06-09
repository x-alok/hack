/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, UserPlus, Trash, Edit, Star, BarChart3, AlertOctagon, Check } from 'lucide-react';
import api from '../services/api';
import { User } from '../types';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'analytics'>('users');

  // Create/Edit User field states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'participant' | 'mentor' | 'admin'>('participant');
  const [userPassword, setUserPassword] = useState('');

  const loadAdminConfig = async () => {
    try {
      setLoading(true);
      const [uRes, aRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/analytics')
      ]);

      setUsersList(uRes.data || []);
      setAnalytics(aRes.data || null);
    } catch (err) {
      console.error(err);
      setError('Could not load administrative configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminConfig();
    }
  }, [user]);

  const handleEditUserClick = (u: User) => {
    setError(null);
    setSuccess(null);
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPassword(''); // Keep blank unless resetting
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingUserId) {
        // Edit User
        const payload: any = { name: userName, email: userEmail, role: userRole };
        if (userPassword) payload.password = userPassword;

        await api.put(`/admin/users/${editingUserId}`, payload);
        setSuccess(`User credentials for "${userName}" successfully updated.`);
      } else {
        // Create User
        if (!userPassword) {
          setError('A password is required for creating a new user.');
          return;
        }
        await api.post('/admin/users', {
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole
        });
        setSuccess(`User credentials created for "${userName}".`);
      }

      // Reset
      setEditingUserId(null);
      setUserName('');
      setUserEmail('');
      setUserRole('participant');
      setUserPassword('');

      loadAdminConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user database');
    }
  };

  const handleDeleteUser = async (targetUserId: string, nameToDelete: string) => {
    if (targetUserId === user?.id) {
      setError('You are forbidden against deleting your currently authenticated admin session.');
      return;
    }

    if (!confirm(`Are you absolutely sure you want to delete user ${nameToDelete}?`)) return;

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/admin/users/${targetUserId}`);
      setSuccess(`Account registered under "${nameToDelete}" successfully deleted.`);
      loadAdminConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete user cleanup');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-12 text-center glass-card border border-white/5 rounded-2xl my-12 text-left">
        <AlertOctagon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-sm font-semibold text-white">ACCESS FORBIDDEN</p>
        <p className="text-xs text-gray-500 font-light mt-1">This console panel is strictly restricted to administrator credentials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center">
            <Shield className="w-8 h-8 text-purple-400 mr-2.5" />
            Admin Operations Console
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage global user credentials, hackathon schedules, and inspect performance analytics indicators.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-1 bg-white/[0.02] border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`py-1.5 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
              activeSubTab === 'users' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
            }`}
          >
            Manage User Sprints
          </button>
          
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`py-1.5 px-4 text-xs font-mono font-bold tracking-wider uppercase rounded-lg transition cursor-pointer ${
              activeSubTab === 'analytics' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sprints Analytics
          </button>
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

      {/* Grid view controller based on active tab selection */}
      {activeSubTab === 'users' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* User list table column */}
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block font-bold">Account Registry ({usersList.length} Accounts)</span>

            {loading ? (
              <p className="text-xs font-mono text-gray-500">Retrieving directory lists...</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.01]">
                <table className="w-full border-collapse text-left text-xs bg-transparent">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.03] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Profile Details</th>
                      <th className="py-3 px-4 text-center">Account Role</th>
                      <th className="py-3 px-4 text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition">
                        
                        <td className="py-3 px-4">
                          <div className="font-bold text-white mb-0.5">{u.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            u.role === 'admin' ? 'bg-red-500/15 text-red-300 border border-red-500/20' :
                            u.role === 'mentor' ? 'bg-pink-500/15 text-pink-300 border border-pink-500/20' :
                            'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditUserClick(u)}
                              className="p-1 px-2 border border-white/10 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition text-[10px] font-mono"
                            >
                              EDIT
                            </button>
                            
                            <button
                              disabled={u.id === user?.id}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1 px-2 border border-red-500/25 rounded-md bg-red-500/5 hover:bg-red-500/15 text-red-300 hover:text-red-200 cursor-pointer disabled:opacity-20 disabled:hover:bg-red-500/5 transition text-[10px] font-mono"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User configuration management card column */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              <UserPlus className="w-4 h-4" />
              <span>{editingUserId ? 'Edit Account Credentials' : 'Onboard User Credentials'}</span>
            </div>

            <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Display Name *</label>
                <input
                  id="adm-name"
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Alok Kumar"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Email Address *</label>
                <input
                  id="adm-email"
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@hackathon.com"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Password {editingUserId && '(Blank if unchanged)'}</label>
                <input
                  id="adm-password"
                  type="password"
                  required={!editingUserId}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Assigned Role</label>
                <select
                  id="adm-role"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 outline-none focus:border-purple-500 text-sm cursor-pointer"
                >
                  <option value="participant">Participant</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-grow py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs uppercase cursor-pointer"
                >
                  {editingUserId ? 'Update Database' : 'Publish Account'}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId(null);
                      setUserName('');
                      setUserEmail('');
                      setUserPassword('');
                      setUserRole('participant');
                    }}
                    className="py-3 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Analytics view panel tab containing stats cards, charts */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Card analytics panel stats */}
          {analytics ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-xs font-mono text-gray-500 tracking-wider block uppercase">Total Users</span>
                <span className="text-3xl font-display font-black text-white block mt-2">{analytics.totalUsers}</span>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-xs font-mono text-gray-500 tracking-wider block uppercase">Total Hackathons</span>
                <span className="text-3xl font-display font-black text-white block mt-2">{analytics.totalHackathons}</span>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-xs font-mono text-gray-500 tracking-wider block uppercase">Projects Evaluated</span>
                <span className="text-3xl font-display font-black text-white block mt-2">{analytics.totalSubmissions}</span>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-xs font-mono text-gray-500 tracking-wider block uppercase">Averages Grading Matrix</span>
                <span className="text-3xl font-display font-black text-purple-300 block mt-2">{analytics.averageScore}/100</span>
              </div>

            </div>
          ) : (
            <p className="text-xs font-mono text-gray-500">Analytics metrics offline or unpopulated...</p>
          )}

          {/* Graphical user stats */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Custom SVG user configuration breakdown graph */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <span className="font-semibold text-white block mb-6">User Database Onboarding Breakdown</span>
              
              {analytics?.charts?.roleDistribution ? (
                <div className="flex flex-col sm:flex-row justify-around items-center gap-6 h-48">
                  
                  {/* Dynamic SVG donut pie chart */}
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      
                      {/* Background circle of Ring */}
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />

                      {/* Participant Ring */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#8b5cf6"
                        strokeWidth="3.2"
                        strokeDasharray="60 40"
                        strokeDashoffset="0"
                      />

                      {/* Mentor Ring */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#ec4899"
                        strokeWidth="3.2"
                        strokeDasharray="30 70"
                        strokeDashoffset="-60"
                      />

                      {/* Admin Ring */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="3.2"
                        strokeDasharray="10 90"
                        strokeDashoffset="-90"
                      />

                    </svg>
                    
                    {/* Ring Core Title details */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-white">{analytics.totalUsers}</span>
                      <span className="text-[8px] font-mono text-gray-500 uppercase">Total Logins</span>
                    </div>
                  </div>

                  {/* Legend indicators */}
                  <div className="space-y-2 text-left font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span className="text-gray-300">Participants: {analytics.charts.roleDistribution.participants}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-pink-500" />
                      <span className="text-gray-300">Mentors: {analytics.charts.roleDistribution.mentors}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-yellow-500" />
                      <span className="text-gray-300">Admins: {analytics.charts.roleDistribution.admins}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-500">Breakdown metrics empty ...</div>
              )}
            </div>

            {/* Submissions rankings visual graph list */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <span className="font-semibold text-white block mb-6">Submitted Projects Performance Spectrum</span>
              
              <div className="space-y-4">
                {analytics?.charts?.projectScores?.length > 0 ? (
                  analytics.charts.projectScores.map((scoreObj: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px] text-gray-400">
                        <span>{scoreObj.name}</span>
                        <span className="font-semibold text-purple-300">{scoreObj.score} pts</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${scoreObj.score}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-gray-500 text-center py-10">No scores logged yet.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
