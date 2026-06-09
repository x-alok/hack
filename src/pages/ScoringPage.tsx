/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, AlertOctagon, ShieldAlert, Sliders, CheckCircle, ExternalLink, FileText, BarChart } from 'lucide-react';
import api from '../services/api';
import { Submission } from '../types';

export const ScoringPage: React.FC = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Criteria Marks Score state
  const [innovation, setInnovation] = useState(20);
  const [technical, setTechnical] = useState(20);
  const [uiux, setUiux] = useState(15);
  const [impact, setImpact] = useState(12);
  const [presentation, setPresentation] = useState(12);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch project submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSelectSubmission = (sub: any) => {
    setError(null);
    setSuccess(null);
    setSelectedSub(sub);

    // If grader already graded, prefill their scores
    const myGraderScores = sub.scores?.filter((sc: any) => sc.graderId === user?.id);
    if (myGraderScores && myGraderScores.length > 0) {
      setInnovation(myGraderScores.find((s: any) => s.criteria === 'innovation')?.score || 20);
      setTechnical(myGraderScores.find((s: any) => s.criteria === 'technical')?.score || 20);
      setUiux(myGraderScores.find((s: any) => s.criteria === 'uiux')?.score || 15);
      setImpact(myGraderScores.find((s: any) => s.criteria === 'impact')?.score || 12);
      setPresentation(myGraderScores.find((s: any) => s.criteria === 'presentation')?.score || 12);
    } else {
      // Default placeholder marks
      setInnovation(20);
      setTechnical(20);
      setUiux(16);
      setImpact(12);
      setPresentation(12);
    }
  };

  const handleCommitScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedSub) return;

    try {
      await api.post(`/submissions/${selectedSub.id}/score`, {
        innovation,
        technical,
        uiux,
        impact,
        presentation
      });

      setSuccess(`Grades committed successfully for project: "${selectedSub.projectTitle}"!`);
      // Reload and re-focus updated scores
      const res = await api.get('/submissions');
      setSubmissions(res.data);
      const updatedMatch = res.data.find((s: any) => s.id === selectedSub.id);
      setSelectedSub(updatedMatch);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit score evaluations');
    }
  };

  // Reject view if unauthorized
  if (!isMentor && !isAdmin) {
    return (
      <div className="max-w-md mx-auto p-12 text-center glass-card border border-white/5 rounded-2xl my-12">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-sm font-semibold text-white">ACCESS FORBIDDEN</p>
        <p className="text-xs text-gray-500 font-light mt-1">This workspace console is restricted to verified System Mentors and Admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-left">
      
      {/* Title banner */}
      <div>
        <h1 className="text-3xl font-display font-black text-white">Evaluation Center</h1>
        <p className="text-sm text-gray-400 mt-1">Rate projects on innovation, complexity, layout design, market parameters, and presentation decks.</p>
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

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Submissions checklist */}
        <div className="lg:col-span-4 space-y-4">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block font-bold">Awaiting Evaluation ({submissions.length} Sprints)</span>
          
          {loading ? (
            <p className="text-xs font-mono text-gray-500">Retrieving slides...</p>
          ) : submissions.length === 0 ? (
            <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-gray-500 font-mono text-xs">
              NO ACTIVE PROJECT SUBMISSIONS POSTED YET.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`w-full text-left p-4 rounded-xl border transition cursor-pointer block ${
                    selectedSub?.id === sub.id
                      ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono text-purple-400">Team: {sub.teamName}</span>
                    <span className="text-[10px] font-mono text-gray-400">Avg {sub.averageScore || 0} pts</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{sub.projectTitle}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 leading-normal">{sub.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Scoring Board */}
        <div className="lg:col-span-8">
          {selectedSub ? (
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              
              {/* Submission Information Details */}
              <div className="pb-4 border-b border-white/5 text-left">
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">{selectedSub.hackathonTitle}</span>
                <h3 className="text-2xl font-bold text-white mt-1 uppercase">{selectedSub.projectTitle}</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selectedSub.description}</p>

                {/* Submissions file links */}
                <div className="flex flex-wrap gap-3 mt-4 text-[11px] font-mono">
                  {selectedSub.githubLink && (
                    <a
                      href={selectedSub.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 border border-white/10 px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white"
                    >
                      <span>GitHub Code Repo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {selectedSub.demoLink && (
                    <a
                      href={selectedSub.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 border border-white/10 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:text-white"
                    >
                      <span>Web Active Demo URL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {selectedSub.pptUrl && (
                    <a
                      href={selectedSub.pptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 border border-white/10 px-2.5 py-1.5 rounded-lg bg-white/5 text-yellow-400 hover:text-white"
                    >
                      <BarChart className="w-3 h-3 mr-1" />
                      <span>Pitch PPT (Click View)</span>
                    </a>
                  )}

                  {selectedSub.pdfUrl && (
                    <a
                      href={selectedSub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 border border-white/10 px-2.5 py-1.5 rounded-lg bg-white/5 text-pink-400 hover:text-white"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      <span>Report PDF (Click Download)</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Multi-criteria Sliders Form */}
              <form onSubmit={handleCommitScores} className="space-y-6 text-left">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block font-bold">Review Assessment Criteria</span>

                {/* Innovation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">1. Originality & Innovation (Score out of 25)</span>
                    <span className="text-purple-300 font-bold">{innovation} / 25 pts</span>
                  </div>
                  <input
                    id="score-innovation"
                    type="range"
                    min="0"
                    max="25"
                    value={innovation}
                    onChange={(e) => setInnovation(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Technical complexity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">2. Technical Complexity & Feasibility (Score out of 25)</span>
                    <span className="text-purple-300 font-bold">{technical} / 25 pts</span>
                  </div>
                  <input
                    id="score-technical"
                    type="range"
                    min="0"
                    max="25"
                    value={technical}
                    onChange={(e) => setTechnical(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* UI/UX layout design */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">3. Human UI/UX Design & Intuitiveness (Score out of 20)</span>
                    <span className="text-purple-300 font-bold">{uiux} / 20 pts</span>
                  </div>
                  <input
                    id="score-uiux"
                    type="range"
                    min="0"
                    max="20"
                    value={uiux}
                    onChange={(e) => setUiux(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Impact */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">4. Real-World Market Impact & Utility (Score out of 15)</span>
                    <span className="text-purple-300 font-bold">{impact} / 15 pts</span>
                  </div>
                  <input
                    id="score-impact"
                    type="range"
                    min="0"
                    max="15"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Presentation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">5. Slide Presentation Flow & Demonstration (Score out of 15)</span>
                    <span className="text-purple-300 font-bold">{presentation} / 15 pts</span>
                  </div>
                  <input
                    id="score-presentation"
                    type="range"
                    min="0"
                    max="15"
                    value={presentation}
                    onChange={(e) => setPresentation(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Live Calculated total */}
                <div className="flex justify-between items-center p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 text-xs font-mono">
                  <span>Grand Total Cumulative Score Summary</span>
                  <span className="text-lg font-bold text-purple-300">
                    {innovation + technical + uiux + impact + presentation} / 100 points
                  </span>
                </div>

                <button
                  id="score-commit-btn"
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider cursor-pointer font-mono"
                >
                  Commit Grades Standing
                </button>
              </form>

            </div>
          ) : (
            <div className="py-20 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-mono text-sm">
              SELECT A PROJECT FROM THE REGISTERED SUBMISSIONS TO EMBARK EVALUATION
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
