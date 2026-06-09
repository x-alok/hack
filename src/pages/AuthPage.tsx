/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Linkedin, Code, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'participant' | 'mentor' | 'admin'>('participant');
  
  // Custom Mentor Fields
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [availability, setAvailability] = useState('');

  const handleQuickLogin = async (shortEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(shortEmail, 'pass123');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const payload: any = { name, email, password, role };
        if (role === 'mentor') {
          payload.skills = skills;
          payload.experience = experience;
          payload.linkedin = linkedin;
          payload.availability = availability;
        }
        await register(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 glass-card p-8 rounded-2xl border border-white/10 z-10">
        
        {/* Header Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-display font-black text-white">
            {isLogin ? 'Welcome Back' : 'Join the Arena'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin ? "Log in to view stands and hackathon workspaces" : "Create your account and jump into active team formations"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alok Kumar"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition duration-150 outline-none text-white text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition duration-150 outline-none text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition duration-150 outline-none text-white text-sm"
                />
              </div>
            </div>

            {/* Signup Only Fields */}
            {!isLogin && (
              <div className="space-y-4 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Account Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('participant')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition duration-150 cursor-pointer ${
                        role === 'participant'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      Participant
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('mentor')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition duration-150 cursor-pointer ${
                        role === 'mentor'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      Mentor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition duration-150 cursor-pointer ${
                        role === 'admin'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {role === 'mentor' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 text-left">
                    <span className="text-xs font-mono text-purple-300 font-bold block mb-2">Mentor Profile Details</span>
                    
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Key Tech Skills</label>
                      <div className="relative">
                        <Code className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Node.js, React, PyTorch"
                          className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg outline-none focus:border-purple-500 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Professional Experience</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="8 years Lead Scientist at DeepMind"
                          className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg outline-none focus:border-purple-500 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">LinkedIn Profile</label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/"
                          className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg outline-none focus:border-purple-500 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Hours / Days Available</label>
                      <input
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="Weekends 10 AM - 4 PM UTC"
                        className="w-full px-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg outline-none focus:border-purple-500 text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log In to System' : 'Create Account')}
            </button>
          </div>
        </form>

        {/* Shortcut Testing Guides */}
        <div className="pt-4 border-t border-white/5 text-left">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-2 text-center">DEVELOPMENT DEMO LOGINS (ONE CLICK)</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
               onClick={() => handleQuickLogin('alokas096@gmail.com')}
               className="py-1 px-2 border border-white/10 rounded bg-white/[0.01] hover:bg-white/[0.05] text-[10px] font-mono text-purple-300 text-center transition cursor-pointer truncate"
               title="Admin Role"
            >
              alokas (Admin)
            </button>
            <button
               onClick={() => handleQuickLogin('john@hackathon.com')}
               className="py-1 px-2 border border-white/10 rounded bg-white/[0.01] hover:bg-white/[0.05] text-[10px] font-mono text-indigo-300 text-center transition cursor-pointer truncate"
               title="Participant / Leader Role"
            >
              john (Participant)
            </button>
            <button
               onClick={() => handleQuickLogin('sarah@mentor.com')}
               className="py-1 px-2 border border-white/10 rounded bg-white/[0.01] hover:bg-white/[0.05] text-[10px] font-mono text-pink-300 text-center transition cursor-pointer truncate"
               title="Mentor Role"
            >
              sarah (Mentor)
            </button>
          </div>
        </div>

        {/* Switch View Trigger */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
          </button>
        </div>

      </div>
    </div>
  );
};
