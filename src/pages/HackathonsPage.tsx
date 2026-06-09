/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, Calendar, DollarSign, Award, Plus, FolderPlus, Eye, Sparkles } from 'lucide-react';
import api from '../services/api';
import { Hackathon } from '../types';

export const HackathonsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Admin New Hackathon State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [newRules, setNewRules] = useState('');

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedTheme) params.theme = selectedTheme;
      params.sortBy = sortBy;

      const resp = await api.get('/hackathons', { params });
      setHackathons(resp.data);
    } catch (err: any) {
      setError('Failed to fetch hackathons list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, [searchQuery, selectedTheme, sortBy]);

  const handleQuickJoin = async (hackathonId: string, hackathonTitle: string) => {
    setError(null);
    setSuccessMsg(null);
    if (!user) {
      setError('Please log in first to join this hackathon');
      return;
    }
    try {
      await api.post(`/hackathons/${hackathonId}/join`);
      setSuccessMsg(`Joined "${hackathonTitle}" successfully! An individual team has been created for you.`);
      // Clear alert after a few seconds
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join this hackathon.');
      setTimeout(() => setError(null), 6000);
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newTitle || !newStartDate || !newEndDate) {
      setError('Title, Start Date, and End Date are mandatory');
      return;
    }

    try {
      await api.post('/hackathons', {
        title: newTitle,
        description: newDesc,
        startDate: newStartDate,
        endDate: newEndDate,
        prizePool: newPrize,
        theme: newTheme,
        rules: newRules
      });

      setSuccessMsg(`Successfully created new Hackathon: "${newTitle}"!`);
      setShowCreateForm(false);
      // Reset fields
      setNewTitle('');
      setNewDesc('');
      setNewStartDate('');
      setNewEndDate('');
      setNewPrize('');
      setNewTheme('');
      setNewRules('');

      fetchHackathons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create hackathon');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Explore Hackathons</h1>
          <p className="text-sm text-gray-400 mt-1">Acquire resources, form professional cohorts, and build revolutionary products.</p>
        </div>

        {isAdmin && (
          <button
            id="adm-add-hack-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Hackathon</span>
          </button>
        )}
      </div>

      {/* Success/Error Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm font-medium">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Admin Creator Dialog / Card */}
      {showCreateForm && (
        <div className="glass-card p-6 rounded-2xl border border-purple-500/30 glow-purple max-w-2xl">
          <div className="flex items-center space-x-2 text-purple-300 font-mono text-sm uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
            <FolderPlus className="w-4 h-4" />
            <span>Admin Creator Console: New Hackathon</span>
          </div>

          <form onSubmit={handleCreateHackathon} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Project Title *</label>
                <input
                  id="nh-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Global Generative AI Sprint"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Prize Pool</label>
                <input
                  id="nh-prize"
                  type="text"
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  placeholder="e.g. $15,000"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">Hackathon Theme</label>
              <input
                id="nh-theme"
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="e.g. Generative AI, Sustainability"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Summary / Concept Describe</label>
              <textarea
                id="nh-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Write a clear statement summarizing the objectives and target innovations."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Start Date *</label>
                <input
                  id="nh-start"
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">End Date *</label>
                <input
                  id="nh-end"
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Rules & Regulations</label>
              <textarea
                id="nh-rules"
                value={newRules}
                onChange={(e) => setNewRules(e.target.value)}
                placeholder="List code governance rules (one per line)..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition"
              >
                Publish Hackathon
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Toolbar Filter */}
      <div className="grid md:grid-cols-12 gap-4 pb-4 border-b border-white/5">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            id="hk-search"
            type="text"
            placeholder="Search key titles or descriptors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
          />
        </div>

        <div className="md:col-span-3">
          <select
            id="hk-theme-filter"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 outline-none focus:border-purple-500 text-sm cursor-pointer"
          >
            <option value="">All Core Themes</option>
            <option value="Generative AI">Generative AI</option>
            <option value="Sustainability">Sustainability</option>
            <option value="Healthcare">Healthcare</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            id="hk-sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 outline-none focus:border-purple-500 text-sm cursor-pointer"
          >
            <option value="newest">Sort By: Newest First</option>
            <option value="startDate">Sort By: Start Date</option>
            <option value="prize">Sort By: Highest Prize</option>
          </select>
        </div>
      </div>

      {/* Grid rendering list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
          <span className="text-xs font-mono text-gray-500">SYNCING ACTIVE ARENAS...</span>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="text-center py-16 text-gray-500 font-mono text-sm border border-dashed border-white/5 rounded-2xl">
          NO ACTIVE HACKATHONS MATCHING CRITERIA
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => {
            const isCompleted = new Date(h.endDate).getTime() < new Date().getTime();
            return (
              <div key={h.id} className="glass-card rounded-2xl border border-white/[0.06] hover:border-purple-500/25 transition duration-300 overflow-hidden flex flex-col justify-between">
                
                {/* Visual Top Accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${isCompleted ? 'from-gray-600 to-gray-500' : 'from-purple-500 to-indigo-500'}`} />

                <div className="p-6 flex-grow flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md font-mono text-[10px] text-gray-400">
                        {h.theme}
                      </span>
                      <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-white/5 text-gray-500 border border-white/5' : 'bg-green-500/10 text-green-300 border border-green-500/25'
                      }`}>
                        {isCompleted ? 'Finished' : 'Registering'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white text-left tracking-tight line-clamp-1">{h.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 font-light text-left">
                      {h.description}
                    </p>
                  </div>

                  {/* Features metadata inline logs */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-gray-500 tracking-wider uppercase text-[9px] flex items-center mb-0.5">
                        <Calendar className="w-3 w-3 mr-1 text-purple-400" />
                        Duration
                      </span>
                      <span className="text-gray-300 truncate font-semibold">
                        {h.startDate} to {h.endDate}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-gray-500 tracking-wider uppercase text-[9px] flex items-center mb-0.5">
                        <DollarSign className="w-3 w-3 mr-1 text-purple-400" />
                        Prize Pool
                      </span>
                      <span className="text-gray-300 font-bold">
                        {h.prizePool}
                      </span>
                    </div>
                  </div>

                  {/* Rules Preview Box */}
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg text-left">
                    <span className="text-[10px] font-mono text-purple-300 font-bold block mb-1">COHORT REQS</span>
                    <p className="text-[10px] text-gray-500 leading-normal line-clamp-2 italic font-mono">
                      {h.rules}
                    </p>
                  </div>

                  {/* Quick-Join Button Action */}
                  <div className="pt-2">
                    <button
                      id={`join-btn-${h.id}`}
                      disabled={isCompleted}
                      onClick={() => handleQuickJoin(h.id, h.title)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold select-none cursor-pointer text-center transition flex justify-center items-center space-x-1.5 bg-white/5 border border-white/10 hover:bg-purple-500/15 hover:border-purple-500/20 text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isCompleted ? 'Closed' : 'One-Click Quick Register'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
