/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, Trophy, Users, Laptop, Code, ShieldCheck, HeartHandshake, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalParticipants: 184,
    totalHackathons: 3,
    totalProjects: 12
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const hRes = await api.get('/hackathons');
        const sRes = await api.get('/submissions');
        const mRes = await api.get('/mentors');
        
        // Simulating robust calculations based on seeds
        setStats({
          totalParticipants: 56 + (mRes.data?.length || 0) * 12,
          totalHackathons: hRes.data?.length || 3,
          totalProjects: sRes.data?.length || 12
        });
      } catch (err) {
        console.warn('Using fallback seed statistics');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Info */}
          <div className="lg:col-span-7 flex flex-col space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full text-purple-300 text-xs font-mono w-fit">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span>GLOBAL DEVELOPER CHAMPIONSHIP 2026</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Build. Compete.<br />
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Win Together.
              </span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl max-w-xl font-light">
              Join elite hackathons, orchestrate dynamic teams, submit pioneering projects, collaborate with verified experts, and compete on realtime global leaderboards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="btn-get-started"
                onClick={() => onNavigate('auth')}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-purple-500/25 cursor-pointer text-sm"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>

              <button
                id="btn-view-leaderboard"
                onClick={() => onNavigate('leaderboard')}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition duration-200 cursor-pointer text-sm"
              >
                <span>View Leaderboard</span>
                <ChevronRight className="w-4 h-4 ml-1 text-gray-400" />
              </button>
            </div>

            {/* Micro Statistics Cards */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold font-display text-white">{stats.totalParticipants}</span>
                <span className="text-xs text-gray-500 font-mono tracking-wider uppercase mt-1">Participants</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold font-display text-white">{stats.totalHackathons}</span>
                <span className="text-xs text-gray-500 font-mono tracking-wider uppercase mt-1">Hackathons</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold font-display text-white">{stats.totalProjects}</span>
                <span className="text-xs text-gray-500 font-mono tracking-wider uppercase mt-1">Projects Sub</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Graphic */}
          <div className="lg:col-span-5 h-[340px] sm:h-[400px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-6">
              
              {/* Leaderboard preview graphic */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-500 font-mono">live_standing_leaderboard.json</span>
                </div>
                <span className="text-[10px] text-green-400 font-mono bg-green-500/15 border border-green-500/20 px-2 py-0.5 rounded-full animate-pulse">● UPDATING</span>
              </div>

              <div className="flex-grow flex flex-col justify-center space-y-3 font-mono">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-xs">
                  <span className="text-purple-400 font-bold">#1 Alpha Agents</span>
                  <span className="text-indigo-300">92.0 pts</span>
                </div>
                
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-xs opacity-85">
                  <span className="text-semibold text-white">#2 EcoCoders</span>
                  <span className="text-indigo-300 font-light">88.5 pts</span>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-xs opacity-70">
                  <span className="text-semibold text-white">#3 Mindful Tech</span>
                  <span className="text-indigo-300 font-light">81.0 pts</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[11px] text-gray-500 font-mono">
                <span>ACTIVE HACKATHONS: 2</span>
                <span>SYSTEM VERSION 2.6.0</span>
              </div>
            </div>
          </div>

        </div>

        {/* Feature Highlights Section */}
        <div className="mt-24 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-extrabold text-white">Engineering Next-Gen Digital Arenas</h2>
            <p className="text-gray-400 mt-3 font-light">Explore state-of-the-art tools optimized to automate user onboarding, submission evaluation, and mentor alignment.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white text-left">Dynamic Team Syncing</h3>
              <p className="text-gray-400 text-sm text-left leading-relaxed">
                Form cohesive cohorts, manage invitations, review detailed teammate metrics, and coordinate via internal live-chat modules.
              </p>
            </div>

            <div className="flex flex-col space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white text-left">Polished Project Submissions</h3>
              <p className="text-gray-400 text-sm text-left leading-relaxed">
                Submit comprehensive deliverables including pitch decks, technical PDF summaries, and file screenshots hosted securely.
              </p>
            </div>

            <div className="flex flex-col space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white text-left">Advanced Mentor Matching</h3>
              <p className="text-gray-400 text-sm text-left leading-relaxed">
                Connect with verified computer scientists, submit detailed assistance requests, and track reviewer feedback logs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40 mt-16 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          
          <div className="flex flex-col space-y-3 col-span-2">
            <span className="font-display font-black text-gray-300 tracking-wide text-sm flex items-center">
              <Code className="w-4 h-4 mr-2 text-purple-500" />
              HACKATHON MANAGEMENT SYSTEM
            </span>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              Standardized full-stack architecture built with precision for AI championships, startup incubators, and university developer tournaments.
            </p>
          </div>

          <div>
            <span className="font-semibold text-gray-300 uppercase tracking-widest text-[10px] block mb-4">Platform</span>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('hackathons')} className="hover:text-purple-400 cursor-pointer">Explore Hackathons</button></li>
              <li><button onClick={() => onNavigate('leaderboard')} className="hover:text-purple-400 cursor-pointer">Leaderboards</button></li>
              <li><button onClick={() => onNavigate('mentors')} className="hover:text-purple-400 cursor-pointer">Find Mentors</button></li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-gray-300 uppercase tracking-widest text-[10px] block mb-4">LEGAL & ETHICS</span>
            <ul className="space-y-2 font-mono text-[10px]">
              <li><span className="hover:text-purple-400">Privacy Policy</span></li>
              <li><span className="hover:text-purple-400">Terms of Governance</span></li>
              <li><span className="hover:text-purple-400">Contact Support</span></li>
            </ul>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Hackathon Management System. Licensed under Apache-2.0.</span>
          <span className="font-mono text-[10px]">UTC Time: 2026-06-04 16:04:11</span>
        </div>
      </footer>
    </div>
  );
};
