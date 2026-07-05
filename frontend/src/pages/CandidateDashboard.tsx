import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

interface MyApplication {
  candidateId: number;
  jobId: number;
  jobTitle: string;
  appliedAt: string;
  status: string;
  completedAt?: number;
}

export default function CandidateDashboard() {
  const { jobs, setJobs, role, setRole } = useAppStore();
  const [uploadingJobId, setUploadingJobId] = useState<number | null>(null);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedApps = localStorage.getItem('myApplications');
    if (savedApps) {
      setMyApplications(JSON.parse(savedApps));
    }
    
    // Refresh UI every minute to update the cooldown timer
    const interval = setInterval(() => {
      setMyApplications(prev => [...prev]);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (role !== 'candidate') {
      navigate('/login');
    }
    loadJobs();
  }, [role]);

  const loadJobs = async () => {
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, jobId: number, jobTitle: string) => {
    if (!e.target.files || !e.target.files.length) return;
    setUploadingJobId(jobId);
    try {
      const candidate = await api.candidates.upload(jobId, e.target.files[0]);
      
      const newApp: MyApplication = {
        candidateId: candidate.id,
        jobId: jobId,
        jobTitle: jobTitle,
        appliedAt: new Date().toLocaleDateString(),
        status: 'Pending'
      };
      
      const updatedApps = [newApp, ...myApplications];
      setMyApplications(updatedApps);
      localStorage.setItem('myApplications', JSON.stringify(updatedApps));
      
      alert('Resume uploaded successfully! You can now start the interview from the My Applications section.');
    } catch (err: any) {
      console.error(err);
      if (err.message) alert(err.message);
    } finally {
      setUploadingJobId(null);
    }
  };

  const logout = () => {
    setRole(null);
    navigate('/login');
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col h-screen w-full relative p-6 md:p-10 overflow-y-auto">
      <div className="absolute top-6 right-6 flex gap-4">
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

      <div className="max-w-5xl mx-auto w-full mt-10">
        <div className="border-b-4 border-slate-300 dark:border-slate-700 border-dashed pb-6 mb-10">
          <h1 className="text-5xl font-marker text-marker-blue -rotate-1 inline-block">
            Welcome, Candidate!
          </h1>
          <p className="font-hand text-2xl text-slate-500 mt-2 rotate-1">
            Browse active jobs or check your application status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Active Job Postings */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-marker text-3xl text-ink border-b-2 border-slate-300 dark:border-slate-700 border-dashed pb-2">
              Live Postings ({jobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job, idx) => {
                const colors = ['bg-note-pink', 'bg-note-blue', 'bg-note-green', 'bg-note-yellow'];
                const bgColor = colors[idx % colors.length];
                
                return (
                  <div 
                    key={job.id} 
                    className={`sticky-note ${bgColor} p-6 flex flex-col gap-3 transition-transform hover:scale-105`}
                    style={{ transform: `rotate(${idx % 2 === 0 ? '-1deg' : '2deg'})` }}
                  >
                    <div className="tape"></div>
                    <h3 className="font-marker text-2xl text-ink mb-1">{job.title}</h3>
                    <p className="font-hand text-lg text-ink/80 flex-1">{job.description}</p>
                    <p className="font-hand text-sm text-ink/60 border-t border-ink/10 pt-2">
                      <span className="font-bold">Skills:</span> {job.required_skills.join(', ')}
                    </p>
                    <div className="mt-2 relative">
                      <input 
                        type="file" 
                        id={`resume-upload-${job.id}`} 
                        className="hidden" 
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => handleFileUpload(e, job.id, job.title)}
                        disabled={uploadingJobId === job.id}
                      />
                      <label 
                        htmlFor={`resume-upload-${job.id}`} 
                        className={`btn-secondary w-full flex items-center justify-center cursor-pointer ${uploadingJobId === job.id ? 'opacity-50' : ''}`}
                      >
                        {uploadingJobId === job.id ? 'Uploading...' : 'Apply Now'}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            {jobs.length === 0 && (
              <p className="font-hand text-xl text-slate-500">No live postings available.</p>
            )}
          </div>

          {/* My Applications (Mock Data for Demo) */}
          <div className="space-y-6">
            <h2 className="font-marker text-3xl text-ink border-b-2 border-slate-300 dark:border-slate-700 border-dashed pb-2">
              My Applications
            </h2>
            <div className="flex flex-col gap-4">
              {myApplications.length === 0 ? (
                <p className="font-hand text-slate-500 text-lg">No applications yet.</p>
              ) : (
                myApplications.map((app, idx) => (
                  <div key={app.candidateId} className={`sticky-note bg-card p-5 border-2 border-slate-200 dark:border-slate-700 ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                    <div className="tape" style={{ top: '-10px', left: idx % 2 === 0 ? '30%' : '70%' }}></div>
                    <h3 className="font-marker text-xl text-ink">{app.jobTitle}</h3>
                    <p className="font-hand text-sm text-slate-500 mb-3">Applied {app.appliedAt}</p>
                    <div className="flex justify-between items-center bg-status-bg px-3 py-2 rounded mb-3">
                      <span className="font-hand text-ink">Status</span>
                      <span className={`font-marker ${app.status === 'Interview Done' ? 'text-marker-green' : 'text-marker-orange'}`}>
                        {app.status}
                      </span>
                    </div>
                    {(() => {
                      let canTakeInterview = true;
                      let buttonText = 'Give Interview';
                      
                      if (app.status === 'Interview Done' && app.completedAt) {
                        const timePassed = Date.now() - app.completedAt;
                        const cooldown = 5 * 60 * 1000; // 5 minutes
                        if (timePassed < cooldown) {
                          canTakeInterview = false;
                          const minutesLeft = Math.ceil((cooldown - timePassed) / 60000);
                          buttonText = `Completed (Wait ${minutesLeft}m)`;
                        } else {
                          buttonText = 'Retake Interview';
                        }
                      } else if (app.status === 'Interview Done') {
                        // backward compatibility if completedAt is missing
                        canTakeInterview = false;
                        buttonText = 'Completed';
                      }

                      return (
                        <button
                          onClick={() => navigate(`/interview?candidate_id=${app.candidateId}`)}
                          disabled={!canTakeInterview}
                          className={`w-full py-2 font-marker transition-colors ${canTakeInterview ? 'btn-primary' : 'bg-slate-300 text-slate-500 cursor-not-allowed rounded-sm border-2 border-slate-400'}`}
                        >
                          {buttonText}
                        </button>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
