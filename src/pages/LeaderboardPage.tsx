/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import api from '../services/api';
import { Hackathon } from '../types';

export const LeaderboardPage: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHackId, setSelectedHackId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const [lRes, hRes] = await Promise.all([
          api.get('/leaderboard', {
            params: {
              hackathonId: selectedHackId,
              q: searchQuery
            }
          }),
          api.get('/hackathons')
        ]);

        setList(lRes.data || []);
        setHackathons(hRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [searchQuery, selectedHackId]);

  // Pagination logic
  const totalPages = Math.ceil(list.length / itemsPerPage) || 1;
  const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center">
            <Trophy className="w-8 h-8 text-yellow-400 mr-2.5 animate-bounce" />
            Global Standings
          </h1>
          <p className="text-sm text-gray-400 mt-1">Review live standings, aggregate grades averages, and project metrics.</p>
        </div>
      </div>

      {/* Toolbar layout */}
      <div className="grid md:grid-cols-12 gap-4 pb-4 border-b border-white/5">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            id="ld-search"
            type="text"
            placeholder="Search team name, project title, or developers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
          />
        </div>

        <div className="md:col-span-4">
          <select
            id="ld-filter-select"
            value={selectedHackId}
            onChange={(e) => {
              setSelectedHackId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-gray-300 outline-none focus:border-purple-500 text-sm cursor-pointer"
          >
            <option value="">All Arenas Consolidated</option>
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Data Stand Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-t-2 border-r-2 border-yellow-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-500 mt-3">COMPILING GLOBAL METRICS...</span>
        </div>
      ) : list.length === 0 ? (
        <div className="p-16 text-center text-gray-500 border border-dashed border-white/5 rounded-2xl font-mono text-sm">
          STANDINGS BOX VACANT IN TARGET CRITERIA
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
            <table className="w-full border-collapse text-left text-xs bg-transparent">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Project Context</th>
                  <th className="py-4 px-6">Team / Developers</th>
                  <th className="py-4 px-6">Hackathon Category</th>
                  <th className="py-4 px-6 text-right w-32">Aggregate Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedList.map((item) => {
                  const isTop3 = item.rank <= 3;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition duration-150">
                      
                      {/* Rank Column */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-display ${
                          item.rank === 1 ? 'bg-yellow-400 text-black shadow shadow-yellow-400/20' :
                          item.rank === 2 ? 'bg-gray-300 text-black' :
                          item.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {item.rank}
                        </span>
                      </td>

                      {/* Project Context */}
                      <td className="py-2.5 px-6">
                        <div className="font-bold text-white text-sm">{item.projectTitle}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">SUBMISSION ID: {item.id}</div>
                      </td>

                      {/* Team & Members details */}
                      <td className="py-2.5 px-6">
                        <div className="text-gray-300 font-semibold">{item.teamName}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">DEV: {item.creatorName}</div>
                      </td>

                      {/* Hackathon category contextual titles */}
                      <td className="py-2.5 px-6">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-400">
                          {item.hackathonTitle}
                        </span>
                      </td>

                      {/* Average score metric */}
                      <td className="py-2 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5 font-bold font-mono text-purple-300 text-sm">
                          <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-500/20" />
                          <span>{item.averageScore || 0} / 100</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controllers */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs font-mono text-gray-500">
              <span>Displaying page {currentPage} of {totalPages} pages</span>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
