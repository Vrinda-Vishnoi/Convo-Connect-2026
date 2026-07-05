const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = {
  jobs: {
    list: async () => {
      const res = await fetch(`${API_URL}/jobs`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create job');
      return res.json();
    },
    update: async (jobId: number, data: any) => {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update job');
      return res.json();
    }
  },
  candidates: {
    upload: async (jobId: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_URL}/jobs/${jobId}/candidates`, {
        method: 'POST',
        body: formData, // fetch automatically sets multipart/form-data with boundaries
      });
      if (!res.ok) throw new Error('Failed to upload resume');
      return res.json();
    },
    list: async (jobId: number) => {
      const res = await fetch(`${API_URL}/jobs/${jobId}/candidates`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return res.json();
    }
  },
  interviews: {
    start: async (candidateId: number) => {
      const res = await fetch(`${API_URL}/interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      if (!res.ok) throw new Error('Failed to start interview');
      return res.json();
    },
    sendMessage: async (interviewId: number, transcript: string) => {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    getResults: async (interviewId: number) => {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/results`);
      if (!res.ok) throw new Error('Failed to fetch results');
      return res.json();
    }
  }
};
