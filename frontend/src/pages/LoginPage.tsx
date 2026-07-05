import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setRole = useAppStore(state => state.setRole);

  const login = (role: 'recruiter' | 'candidate') => {
    setRole(role);
    if (role === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/candidate');
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full relative">
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 font-marker text-xl text-slate-400 hover:text-marker-orange transition-colors"
      >
        Toggle Dark Mode
      </button>

      <div className="flex flex-col items-center gap-10">
        <h1 className="text-6xl font-marker text-marker-blue -rotate-2">
          ConvoConnect
        </h1>
        <p className="font-hand text-3xl text-slate-500 rotate-1 max-w-lg text-center">
          The easiest way to interview and get hired!
        </p>

        <div className="flex gap-8 mt-8">
          <div 
            onClick={() => login('recruiter')}
            className="sticky-note bg-note-yellow p-8 cursor-pointer transition-all hover:scale-105 hover:-rotate-2 flex flex-col items-center gap-4 w-64"
          >
            <div className="tape"></div>
            <h2 className="font-marker text-3xl text-ink">Recruiter</h2>
            <p className="font-hand text-xl text-ink/70 text-center">Post jobs, review applicants, and view scores.</p>
          </div>

          <div 
            onClick={() => login('candidate')}
            className="sticky-note bg-note-pink p-8 cursor-pointer transition-all hover:scale-105 hover:rotate-2 flex flex-col items-center gap-4 w-64"
          >
            <div className="tape"></div>
            <h2 className="font-marker text-3xl text-ink">Candidate</h2>
            <p className="font-hand text-xl text-ink/70 text-center">Browse jobs, take interviews, and get hired.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
