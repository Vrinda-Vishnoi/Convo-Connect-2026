import { create } from 'zustand'

export interface Job {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  screening_result?: {
    match_score: number;
    reasons: string[];
  };
  interview?: {
    id: number;
    status: string;
  };
  evaluation?: {
    technical_score: number;
    communication_score: number;
    role_fit_score: number;
    weighted_total: number;
    rationales: Record<string, string>;
  };
}

export interface InterviewLog {
  id: number;
  sender: 'bot' | 'user';
  content: string;
  order_index: number;
}

export interface Interview {
  id: number;
  candidate_id: number;
  status: string;
  logs: InterviewLog[];
}

interface AppState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  selectedJobId: number | null;
  setSelectedJobId: (id: number | null) => void;
  
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  
  activeInterview: Interview | null;
  setActiveInterview: (interview: Interview | null) => void;

  role: 'recruiter' | 'candidate' | null;
  setRole: (role: 'recruiter' | 'candidate' | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  
  selectedJobId: null,
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  
  candidates: [],
  setCandidates: (candidates) => set({ candidates }),
  
  activeInterview: null,
  setActiveInterview: (interview) => set({ activeInterview: interview }),

  role: null,
  setRole: (role) => set({ role }),
}))
