/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, BarChart3, Image, Github, Play, AlertCircle, CheckCircle, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import { Team, Hackathon } from '../types';

export const SubmissionPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Teams lists
  const [userTeams, setUserTeams] = useState<any[]>([]);

  // Form Inputs State
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [demoLink, setDemoLink] = useState('');

  // Files State
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Drag-and-drop hover states
  const [dragPptOver, setDragPptOver] = useState(false);
  const [dragPdfOver, setDragPdfOver] = useState(false);
  const [dragImgOver, setDragImgOver] = useState(false);

  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        if (!user) return;
        const tResp = await api.get('/teams');
        const teamDetails = await Promise.all(
          tResp.data.map((t: Team) => api.get(`/teams/${t.id}`))
        );
        // User must be a member of the team to submit!
        const matched = teamDetails
          .map(res => res.data)
          .filter(t => t.members?.some((m: any) => m.userId === user.id));

        setUserTeams(matched);
        if (matched.length > 0) {
          setSelectedTeamId(matched[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserTeams();
  }, [user]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    if (type === 'ppt') setDragPptOver(true);
    if (type === 'pdf') setDragPdfOver(true);
    if (type === 'img') setDragImgOver(true);
  };

  const handleDragLeave = (type: string) => {
    if (type === 'ppt') setDragPptOver(false);
    if (type === 'pdf') setDragPdfOver(false);
    if (type === 'img') setDragImgOver(false);
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    handleDragLeave(type);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'ppt') setPptFile(file);
      if (type === 'pdf') setPdfFile(file);
      if (type === 'img') setScreenshotFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'ppt') setPptFile(file);
      if (type === 'pdf') setPdfFile(file);
      if (type === 'img') setScreenshotFile(file);
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTeamId || !projectTitle) {
      setError('Selected team and project title are required fields');
      return;
    }

    const currentTeam = userTeams.find(t => t.id === selectedTeamId);
    if (!currentTeam) {
      setError('Invalid team selected');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('projectTitle', projectTitle);
      formData.append('description', description);
      formData.append('githubLink', githubLink);
      formData.append('demoLink', demoLink);
      formData.append('hackathonId', currentTeam.hackathonId);
      formData.append('teamId', selectedTeamId);

      if (pptFile) formData.append('pptFile', pptFile);
      if (pdfFile) formData.append('pdfFile', pdfFile);
      if (screenshotFile) formData.append('screenshotFile', screenshotFile);

      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Success! "${projectTitle}" has been submitted for evaluation.`);
      // Clear form except team select
      setProjectTitle('');
      setDescription('');
      setGithubLink('');
      setDemoLink('');
      setPptFile(null);
      setPdfFile(null);
      setScreenshotFile(null);

    } catch (err: any) {
      setError(err.response?.data?.error || 'A network error occurred uploading documents');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-12 text-center glass-card border border-white/5 rounded-2xl my-12">
        <AlertCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <p className="text-sm font-semibold text-white">AUTHENTICATION REQUIRED</p>
        <p className="text-xs text-gray-500 font-light mt-1">Please log in to submit files.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 text-left">
      
      {/* Title block */}
      <div className="pb-6 border-b border-white/5 mb-8">
        <h1 className="text-3xl font-display font-black text-white">Project Deliverables submission</h1>
        <p className="text-sm text-gray-400 mt-1">Upload slides, reports, code repositories, and user interface mocks.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-500/15 border border-green-500/20 rounded-xl flex items-center space-x-3 text-green-300 text-sm mb-6 font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-300 text-sm mb-6 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {userTeams.length === 0 ? (
        <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-gray-400 font-mono text-xs">
          YOU DO NOT BELONG TO ANY REGISTERED TEAM.<br />
          GO TO THE <b className="text-purple-300">EXPLORE HACKATHONS</b> PAGE AND JOIN AN ACTIVE ARENA TOGETHER!
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-8">
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team selection */}
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">Select Active Team *</label>
              <select
                id="sub-team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-sm text-gray-300 outline-none focus:border-purple-500 cursor-pointer"
              >
                {userTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.teamName} ({t.hackathonTitle})</option>
                ))}
              </select>
            </div>

            {/* Project Title */}
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 font-bold">Project Title *</label>
              <input
                id="sub-title"
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Intelligent Agent CRM Dashboard"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm animate-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Description / Concept Writeup</label>
            <textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explicate your project's technology capabilities, custom database locks, user benefits, and how you leveraged LLM pipelines..."
              rows={4}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm resize-none"
            />
          </div>

          {/* URLs list */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                <Github className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                GitHub Repository URL
              </label>
              <input
                id="sub-git"
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                <Play className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                Live Demo Hosting Deployment
              </label>
              <input
                id="sub-demo"
                type="url"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          {/* File Upload modules supporting Drag and Drop & manual trigger */}
          <div className="space-y-4">
            <span className="block text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">Upload Mandatory Files & Pitch Decks</span>
            
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* PPT Pitch deck Drop area */}
              <div
                onDragOver={(e) => handleDragOver(e, 'ppt')}
                onDragLeave={() => handleDragLeave('ppt')}
                onDrop={(e) => handleDrop(e, 'ppt')}
                className={`py-8 px-4 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer relative ${
                  dragPptOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <input
                  id="ppt-selector"
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={(e) => handleFileChange(e, 'ppt')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <BarChart3 className={`w-8 h-8 mb-2 ${pptFile ? 'text-green-400' : 'text-purple-400'}`} />
                <span className="text-[10px] font-mono text-gray-400 font-bold block mb-1">PPT Pitch Deck (.pptx)</span>
                
                {pptFile ? (
                  <span className="text-[10px] text-green-300 font-mono font-semibold max-w-xs truncate">{pptFile.name} ({(pptFile.size / 1024).toFixed(0)}KB)</span>
                ) : (
                  <span className="text-[9px] text-gray-500 block leading-normal leading-relaxed text-center font-light">Drag ppt file here or click device directory</span>
                )}
              </div>

              {/* PDF Report Drop area */}
              <div
                onDragOver={(e) => handleDragOver(e, 'pdf')}
                onDragLeave={() => handleDragLeave('pdf')}
                onDrop={(e) => handleDrop(e, 'pdf')}
                className={`py-8 px-4 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer relative ${
                  dragPdfOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <input
                  id="pdf-selector"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'pdf')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <FileText className={`w-8 h-8 mb-2 ${pdfFile ? 'text-green-400' : 'text-indigo-400'}`} />
                <span className="text-[10px] font-mono text-gray-400 font-bold block mb-1">Project Technical PDF (.pdf)</span>
                
                {pdfFile ? (
                  <span className="text-[10px] text-green-300 font-mono font-semibold max-w-xs truncate">{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)}KB)</span>
                ) : (
                  <span className="text-[9px] text-gray-500 block leading-normal leading-relaxed text-center font-light">Drag technical file or select local folders</span>
                )}
              </div>

              {/* Design Screenshot Drop area */}
              <div
                onDragOver={(e) => handleDragOver(e, 'img')}
                onDragLeave={() => handleDragLeave('img')}
                onDrop={(e) => handleDrop(e, 'img')}
                className={`py-8 px-4 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer relative ${
                  dragImgOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <input
                  id="img-selector"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'img')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <Image className={`w-8 h-8 mb-2 ${screenshotFile ? 'text-green-400' : 'text-pink-400'}`} />
                <span className="text-[10px] font-mono text-gray-400 font-bold block mb-1">UX Mock / Solution Screenshot</span>
                
                {screenshotFile ? (
                  <span className="text-[10px] text-green-300 font-mono font-semibold max-w-xs truncate">{screenshotFile.name} ({(screenshotFile.size / 1024).toFixed(0)}KB)</span>
                ) : (
                  <span className="text-[9px] text-gray-500 block leading-normal leading-relaxed text-center font-light">E.g. landing-mock.png, dashboard.jpg</span>
                )}
              </div>

            </div>
          </div>

          <button
            id="deliverable-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold font-mono rounded-xl tracking-wider text-xs uppercase cursor-pointer shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            {loading ? 'UPLOADING DELIVERABLES AND SYNCING...' : 'Submit Submissions Sprints Payload'}
          </button>

        </form>
      )}

    </div>
  );
};
