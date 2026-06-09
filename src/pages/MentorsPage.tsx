/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Linkedin, Check, X, Shield, Sparkles, Award, Star } from 'lucide-react';
import api from '../services/api';
import { Mentor, MentorRequest } from '../types';

export const MentorsPage: React.FC = () => {
  const { user, isMentor } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMentorsData = async () => {
    try {
      setLoading(true);
      const mRes = await api.get('/mentors');
      setMentors(mRes.data);

      if (user && (user.role === 'mentor' || user.role === 'admin')) {
        const reqRes = await api.get('/mentor-requests');
        setMentorRequests(reqRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mentors data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorsData();
  }, [user]);

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/mentor-requests/${requestId}`, { status });
      setSuccess(`Consultation request successfully mark as: ${status}!`);
      fetchMentorsData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update request');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title header */}
      <div>
        <h1 className="text-3xl font-display font-black text-white">Advisors & Mentoring</h1>
        <p className="text-sm text-gray-400 mt-1">Receive technical validation, pitch evaluations, and project advice from industry professionals.</p>
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

      {/* Conditional: Mentor Verification Alignment Board */}
      {isMentor && (
        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-purple-300 font-mono text-xs uppercase tracking-wider pb-2 border-b border-purple-500/10">
            <Shield className="w-4 h-4" />
            <span>Mentor Consultation Hub: Support Requests inbox</span>
          </div>

          <p className="text-xs text-gray-400 font-light leading-relaxed">
            Verify pending matching requests submitted by participating squads who are target-aligning with your key resume focus skills list.
          </p>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs font-mono text-gray-500">Retrieving requests inbox...</p>
            ) : mentorRequests.length === 0 ? (
              <p className="text-xs font-mono text-gray-500 text-center py-4">NO SUPPORT REQUESTS PENDING</p>
            ) : (
              mentorRequests.map((req) => (
                <div key={req.id} className="p-4 bg-black/30 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white uppercase">Team {req.teamName}</span>
                      <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' :
                        req.status === 'accepted' ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
                        'bg-red-500/10 text-red-300 border border-red-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 font-light leading-relaxed max-w-xl">
                      &ldquo;{req.message}&rdquo;
                    </p>
                    <span className="text-[9px] font-mono text-gray-500 block">Requested At: {new Date(req.createdAt || '').toLocaleString()}</span>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'accepted')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg text-xs font-mono font-bold hover:bg-green-500/20 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-xs font-mono font-bold hover:bg-red-500/20 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detailed Mentor Profiles List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6">Verified Technical Panel Advisors</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
            <p className="text-xs text-gray-500 font-mono mt-2">PARSING ADVISOR DIRECTORIES...</p>
          </div>
        ) : mentors.length === 0 ? (
          <p className="text-xs font-mono text-gray-500 text-center py-6">NO VERIFIED ADVISORS ON STAND.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((m) => (
              <div key={m.id} className="glass-card rounded-2xl border border-white/[0.05] p-6 space-y-4 hover:border-purple-500/20 transition duration-350">
                
                {/* Header Information */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1 text-purple-400 font-mono text-[9px] uppercase tracking-wider mb-1">
                      <Star className="w-3 h-3 fill-purple-400" />
                      <span>Certified Reviewer</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{m.name}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{m.email}</p>
                  </div>

                  {m.linkedin && (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-indigo-400 transition"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Skills tags list */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Key Expertise</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {m.skills.split(',').map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/25 rounded font-mono text-[10px] text-purple-300">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume block */}
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl font-light text-xs text-gray-400 leading-relaxed text-left">
                  <span className="text-[9px] font-mono text-indigo-300 font-bold block mb-1">VERIFIED RESUME SUMMARY</span>
                  {m.experience}
                </div>

                {/* Availability info */}
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 pt-2 border-t border-white/5">
                  <span>TIMESLOTS Availability</span>
                  <span className="text-gray-300 font-semibold">{m.availability}</span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
