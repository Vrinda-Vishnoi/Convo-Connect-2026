import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function RecruiterDashboard() {
  const { jobs, setJobs, selectedJobId, setSelectedJobId, candidates, setCandidates, role, setRole } = useAppStore();
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', required_skills: '' });
  
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editJobData, setEditJobData] = useState({ title: '', description: '', required_skills: '' });
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'recruiter') {
      navigate('/login');
    }
    loadJobs();
  }, [role]);

  useEffect(() => {
    if (selectedJobId) loadCandidates(selectedJobId);
    setIsEditingJob(false);
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const data = await api.jobs.list();
      setJobs(data);
      if (data.length > 0 && !selectedJobId) setSelectedJobId(data[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCandidates = async (id: number) => {
    try {
      const data = await api.candidates.list(id);
      setCandidates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jobData = {
        title: newJob.title,
        description: newJob.description,
        required_skills: newJob.required_skills.split(',').map(s => s.trim()),
        weights: { technical_score: 0.5, communication_score: 0.3, role_fit_score: 0.2 }
      };
      await api.jobs.create(jobData);
      setIsCreatingJob(false);
      setNewJob({ title: '', description: '', required_skills: '' });
      loadJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    try {
      const jobData = {
        title: editJobData.title,
        description: editJobData.description,
        required_skills: editJobData.required_skills.split(',').map(s => s.trim()),
      };
      await api.jobs.update(selectedJobId, jobData);
      setIsEditingJob(false);
      loadJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const startInterview = (candidateId: number) => {
    navigate(`/interview?candidate_id=${candidateId}`);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const logout = () => {
    setRole(null);
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Sidebar - Job List */}
      <div className="w-full md:w-80 border-r-2 border-slate-300 dark:border-slate-700 border-dashed p-6 flex flex-col gap-6 overflow-y-auto bg-sidebar">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-marker text-marker-blue -rotate-2">
            ConvoConnect
          </h1>
          <button 
            onClick={() => setIsCreatingJob(!isCreatingJob)}
            className="text-3xl font-marker text-marker-red hover:scale-110 transition-transform"
            title="Create New Job"
          >
            +
          </button>
        </div>

        <div className="flex gap-4 text-sm font-hand text-slate-500 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex-1 text-center border-r border-slate-300 dark:border-slate-600">
            <div className="font-marker text-xl text-ink">{jobs.length}</div>
            <div>Total Jobs</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-marker text-xl text-ink">{candidates.length}</div>
            <div>Current Applicants</div>
          </div>
        </div>

        {isCreatingJob && (
          <form onSubmit={handleCreateJob} className="sticky-note bg-note-yellow p-5 flex flex-col gap-3 rounded-sm transform rotate-1">
            <div className="tape"></div>
            <h2 className="font-marker text-lg text-ink">New Job</h2>
            <input 
              required
              placeholder="Job Title" 
              className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-hand text-lg" 
              value={newJob.title}
              onChange={e => setNewJob({...newJob, title: e.target.value})}
            />
            <textarea 
              required
              placeholder="Description" 
              className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-hand text-lg h-20 resize-none" 
              value={newJob.description}
              onChange={e => setNewJob({...newJob, description: e.target.value})}
            />
            <input 
              required
              placeholder="Skills (comma separated)" 
              className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-hand text-lg" 
              value={newJob.required_skills}
              onChange={e => setNewJob({...newJob, required_skills: e.target.value})}
            />
            <button type="submit" className="mt-2 btn-primary text-sm py-1 bg-marker-red hover:bg-red-700">Pin It</button>
          </form>
        )}

        <div className="flex flex-col gap-4 mt-4">
          <h2 className="font-marker text-xl text-slate-500 border-b-2 border-slate-300 dark:border-slate-700 border-dashed pb-2">Active Jobs</h2>
          {jobs.map((job, idx) => {
            const colors = ['bg-note-pink', 'bg-note-blue', 'bg-note-green', 'bg-note-yellow'];
            const bgColor = colors[idx % colors.length];
            const isSelected = selectedJobId === job.id;
            
            return (
              <div 
                key={job.id} 
                onClick={() => setSelectedJobId(job.id)}
                className={`sticky-note ${bgColor} p-4 cursor-pointer transition-all ${isSelected ? 'scale-105 shadow-xl z-10' : 'hover:scale-105'}`}
                style={{ transform: `rotate(${isSelected ? '0deg' : (idx % 2 === 0 ? '-2deg' : '2deg')})` }}
              >
                <div className="tape" style={{ display: isSelected ? 'block' : 'none' }}></div>
                <h3 className="font-marker text-xl text-ink truncate mb-1">{job.title}</h3>
                <p className="font-hand text-ink/70 leading-tight line-clamp-2">{job.required_skills.join(', ')}</p>
                {isSelected && (
                  <div className="absolute -right-2 -top-2 text-marker-red font-marker text-2xl animate-pulse">★</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content - Candidate List */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <div className="absolute top-6 right-6 flex gap-4 z-20">
          <button 
            onClick={toggleDarkMode}
            className="font-marker text-xl text-slate-400 hover:text-marker-orange transition-colors"
          >
            Toggle Dark Mode
          </button>
          <button 
            onClick={logout}
            className="font-marker text-xl text-marker-red hover:underline transition-colors"
          >
            Logout
          </button>
        </div>
        
        {selectedJob ? (
          <div className="max-w-5xl mx-auto space-y-10 mt-10 md:mt-0">
            {isEditingJob ? (
               <form onSubmit={handleEditJob} className="flex flex-col gap-4 border-b-4 border-slate-300 dark:border-slate-700 border-dashed pb-6">
                <input 
                  required
                  placeholder="Job Title" 
                  className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-marker text-4xl" 
                  value={editJobData.title}
                  onChange={e => setEditJobData({...editJobData, title: e.target.value})}
                />
                <textarea 
                  required
                  placeholder="Description" 
                  className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-hand text-xl h-24 resize-none" 
                  value={editJobData.description}
                  onChange={e => setEditJobData({...editJobData, description: e.target.value})}
                />
                <input 
                  required
                  placeholder="Skills (comma separated)" 
                  className="w-full bg-transparent border-b-2 border-ink/20 border-dashed px-2 py-1 text-ink focus:outline-none focus:border-ink placeholder-ink/40 font-hand text-xl" 
                  value={editJobData.required_skills}
                  onChange={e => setEditJobData({...editJobData, required_skills: e.target.value})}
                />
                <div className="flex gap-4">
                  <button type="submit" className="btn-primary">Save Changes</button>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingJob(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-slate-300 dark:border-slate-700 border-dashed pb-6">
                <div>
                  <h2 className="text-4xl font-marker text-ink inline-block relative">
                    <span className="relative z-10">{selectedJob.title}</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-marker-blue/20 -rotate-1 z-0"></span>
                  </h2>
                  <button 
                    onClick={() => {
                      setEditJobData({ title: selectedJob.title, description: selectedJob.description, required_skills: selectedJob.required_skills.join(', ') });
                      setIsEditingJob(true);
                    }}
                    className="ml-4 font-marker text-marker-orange text-lg hover:underline"
                  >
                    (edit)
                  </button>
                  <p className="font-hand text-xl text-slate-600 mt-3 max-w-2xl">{selectedJob.description}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-marker text-2xl text-slate-500 mb-6">Candidates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {candidates.length === 0 ? (
                  <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <p className="font-display text-4xl text-slate-400 rotate-2">No candidates yet...</p>
                    <p className="font-hand text-xl text-slate-400 -rotate-1 mt-2">Upload a resume to get the ball rolling!</p>
                  </div>
                ) : (
                  candidates.map((candidate, i) => {
                    const isExpanded = expandedCandidateId === candidate.id;
                    const hasEvaluation = candidate.evaluation != null;
                    const isCompleted = candidate.interview?.status === 'completed';

                    return (
                      <div key={candidate.id} className={`sticky-note bg-card p-6 border-2 border-slate-200 dark:border-slate-700 rounded-sm flex flex-col gap-4 relative transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`} style={{ transform: isExpanded ? 'none' : `rotate(${i % 2 === 0 ? '1deg' : '-1deg'})` }}>
                        <div className="tape" style={{ top: '-12px', left: isExpanded ? '50%' : '50%', transform: 'translateX(-50%)' }}></div>
                        
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0">
                            <h3 className="text-2xl font-marker text-ink break-all">{candidate.name}</h3>
                            <p className="font-hand text-slate-500 truncate">{candidate.email}</p>
                          </div>
                          <div className="flex gap-4 items-center">
                            {hasEvaluation && (
                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-3xl font-marker text-marker-blue" style={{ transform: 'rotate(-2deg)' }}>
                                  {Math.round(candidate.evaluation!.weighted_total * 100)}%
                                </span>
                                <span className="font-hand text-sm text-slate-400">Satisfaction %</span>
                              </div>
                            )}
                            {candidate.screening_result && !isExpanded && !hasEvaluation && (
                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-3xl font-marker text-marker-green" style={{ transform: 'rotate(-5deg)' }}>
                                  {Math.round(candidate.screening_result.match_score * 100)}%
                                </span>
                                <span className="font-hand text-sm text-slate-400">Match</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!isExpanded && candidate.screening_result?.reasons && !hasEvaluation && (
                          <div className="flex-1 mt-2">
                            <p className="font-marker text-sm text-marker-orange mb-2 border-b-2 border-marker-orange/20 inline-block">Top Matches:</p>
                            <ul className="font-hand text-lg text-ink/80 space-y-1 ml-4 list-disc marker:text-marker-orange">
                              {candidate.screening_result.reasons.slice(0, 3).map((r, i) => (
                                <li key={i} className="line-clamp-2">{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {isExpanded && hasEvaluation && (
                          <div className="flex-1 mt-4 border-t-2 border-slate-200 dark:border-slate-700 border-dashed pt-4 flex flex-col gap-6 animate-fade-in">
                            <h4 className="font-marker text-2xl text-marker-blue">Evaluation Report (Interviewer Satisfaction)</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-note-blue/20 p-4 rounded-lg flex flex-col items-center justify-center">
                                <div className="text-4xl font-marker text-marker-blue mb-1">{Math.round(candidate.evaluation!.technical_score * 100)}%</div>
                                <div className="font-hand text-lg text-ink/70 text-center">Technical Skills</div>
                              </div>
                              <div className="bg-note-pink/20 p-4 rounded-lg flex flex-col items-center justify-center">
                                <div className="text-4xl font-marker text-marker-red mb-1">{Math.round(candidate.evaluation!.communication_score * 100)}%</div>
                                <div className="font-hand text-lg text-ink/70 text-center">Communication</div>
                              </div>
                              <div className="bg-note-green/20 p-4 rounded-lg flex flex-col items-center justify-center">
                                <div className="text-4xl font-marker text-marker-green mb-1">{Math.round(candidate.evaluation!.role_fit_score * 100)}%</div>
                                <div className="font-hand text-lg text-ink/70 text-center">Role Fit</div>
                              </div>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg">
                              <h5 className="font-marker text-xl text-ink mb-4 border-b border-slate-300 dark:border-slate-600 pb-2">Rationales & Feedback</h5>
                              <div className="space-y-4">
                                {Object.entries(candidate.evaluation!.rationales).map(([key, rationale], idx) => (
                                  <div key={idx} className="flex flex-col gap-1">
                                    <span className="font-bold font-hand text-lg text-marker-orange capitalize">{key.replace('_', ' ')}:</span>
                                    <span className="font-hand text-ink/80 leading-relaxed text-lg">{String(rationale)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex gap-3">
                          {hasEvaluation ? (
                            <button 
                              onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.id)}
                              className="btn-secondary flex-1 text-lg"
                            >
                              {isExpanded ? 'Close Report' : 'View Evaluation Report'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => startInterview(candidate.id)}
                              className="btn-secondary flex-1 text-lg"
                            >
                              {isCompleted ? 'View Interview Logs' : 'Start Interview'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col">
            <h2 className="font-display text-5xl text-slate-300 -rotate-3">Pick a Job</h2>
            <p className="font-hand text-2xl text-slate-400 mt-2 rotate-1">(or create a new one!)</p>
          </div>
        )}
      </div>
    </div>
  );
}
