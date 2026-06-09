/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { HackathonsPage } from './pages/HackathonsPage';
import { TeamsPage } from './pages/TeamsPage';
import { MentorsPage } from './pages/MentorsPage';
import { SubmissionPage } from './pages/SubmissionPage';
import { ScoringPage } from './pages/ScoringPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';

import {
  Code,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Trophy,
  Bell,
  Star,
  Users,
  ShieldAlert,
  ListRestart
} from 'lucide-react';
import api from './services/api';

function AppContent() {
  const { user, token, logout, isAdmin, isMentor, isParticipant } = useAuth();
  
  // Theme Toggle state
  const [darkMode, setDarkMode] = useState(true);

  // Responsive Hamburger Drawer open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Virtual Router active page state
  const [currentView, setCurrentView] = useState<string>('home');

  // Notifications live counts state
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Sync browser theme class
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch notifications unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) return;
      try {
        const resp = await api.get('/notifications');
        const unread = resp.data.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        // Silent error
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [token, currentView]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoutClick = () => {
    logout();
    handleNavigate('home');
  };

  // Render Page active view helper
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onSuccess={() => handleNavigate('dashboard')} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'hackathons':
        return <HackathonsPage />;
      case 'teams':
        return <TeamsPage />;
      case 'mentors':
        return <MentorsPage />;
      case 'submissions':
        return <SubmissionPage />;
      case 'scoring':
        return <ScoringPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
      
      {/* Dynamic Header Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode ? 'bg-neutral-950/80 border-white/[0.05]' : 'bg-white/80 border-neutral-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Left */}
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center space-x-2 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-200">
                <Code className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xs uppercase tracking-wider text-purple-400">BUILD. COMPETE.</span>
                <span className="font-sans font-bold text-sm tracking-tight text-white">HMS Portal</span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs font-mono font-bold tracking-wider uppercase">
              <button
                onClick={() => handleNavigate('home')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'home' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => handleNavigate('hackathons')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'hackathons' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Hackathons
              </button>

              <button
                onClick={() => handleNavigate('teams')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'teams' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Teams
              </button>

              <button
                onClick={() => handleNavigate('mentors')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'mentors' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mentors
              </button>

              <button
                onClick={() => handleNavigate('submissions')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'submissions' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Submissions
              </button>

              {/* Evaluators Scoring Section */}
              {(isMentor || isAdmin) && (
                <button
                  onClick={() => handleNavigate('scoring')}
                  className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                    currentView === 'scoring' ? 'bg-pink-500/10 text-pink-300 border border-pink-500/20' : 'text-gray-400 hover:text-pink-300'
                  }`}
                >
                  Scoring
                </button>
              )}

              <button
                onClick={() => handleNavigate('leaderboard')}
                className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                  currentView === 'leaderboard' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>

              {/* Admin Portal section Link block */}
              {isAdmin && (
                <button
                  id="admin-panel-nav"
                  onClick={() => handleNavigate('admin')}
                  className={`px-3 py-1.5 rounded-lg transition text-left cursor-pointer ${
                    currentView === 'admin' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'text-gray-400 hover:text-red-300'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            {/* Right Buttons Toolbar */}
            <div className="hidden lg:flex items-center space-x-4">
              
              {/* Dark mode layout Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-400 hover:text-white transition rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
                title={darkMode ? 'Toggle Light Theme' : 'Toggle Dark Theme'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Conditional Account login stand */}
              {user ? (
                <div className="flex items-center space-x-3.5">
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="relative p-2 text-gray-400 hover:text-white transition rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer flex items-center"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Profile snippet */}
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 px-3 py-1.5 rounded-xl cursor-pointer hover:border-purple-400 transition"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-white">{user.name}</span>
                  </button>

                  <button
                    id="user-logout-btn"
                    onClick={handleLogoutClick}
                    className="p-2 text-red-400 hover:text-red-300 transition rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
                    title="Sign Out Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="h-login-btn"
                  onClick={() => handleNavigate('auth')}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition cursor-pointer shadow shadow-purple-500/10"
                >
                  Join / Login
                </button>
              )}

            </div>

            {/* Mobile Navigation Drawer Trigger hamburger */}
            <div className="lg:hidden flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-400 transition rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white transition rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Responsive Mobile navigation drawer open overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.05] p-4 bg-neutral-950 space-y-2 text-left font-mono text-xs font-bold uppercase tracking-wider">
            <button onClick={() => handleNavigate('home')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Home</button>
            <button onClick={() => handleNavigate('hackathons')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Hackathons</button>
            <button onClick={() => handleNavigate('teams')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Teams</button>
            <button onClick={() => handleNavigate('mentors')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Mentors</button>
            <button onClick={() => handleNavigate('submissions')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Submissions</button>
            {(isMentor || isAdmin) && <button onClick={() => handleNavigate('scoring')} className="w-full text-left py-2 px-3 text-pink-400 hover:text-pink-300 block rounded-xl">Scoring</button>}
            <button onClick={() => handleNavigate('leaderboard')} className="w-full text-left py-2 px-3 text-gray-300 hover:text-white block rounded-xl">Leaderboard</button>
            {isAdmin && <button onClick={() => handleNavigate('admin')} className="w-full text-left py-2 px-3 text-red-400 hover:text-red-300 block rounded-xl">Admin Panel</button>}
            
            <div className="pt-4 border-t border-white/5 space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-gray-400 font-sans tracking-tight">Logged in as {user.name}</div>
                  <button onClick={() => handleNavigate('dashboard')} className="w-full text-left py-2 px-3 text-purple-300 block rounded-xl">Dashboard Inbox ({unreadCount})</button>
                  <button onClick={handleLogoutClick} className="w-full text-left py-2 px-3 text-red-400 block rounded-xl">Log Out</button>
                </>
              ) : (
                <button onClick={() => handleNavigate('auth')} className="w-full text-center py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white block">Join / Sign In</button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Pages router block */}
      <main className="min-h-[82vh] pb-16">
        {renderView()}
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
