import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from './pages/RecruiterDashboard';
import InterviewRoom from './components/InterviewRoom';
import InterviewResults from './pages/InterviewResults';
import DeveloperIcon from './components/DeveloperIcon';
import GlobalLoader from './components/GlobalLoader';

import LoginPage from './pages/LoginPage';
import CandidateDashboard from './pages/CandidateDashboard';
import { Navigate } from 'react-router-dom';
import { useAppStore } from './store';

function App() {
  const role = useAppStore(state => state.role);

  return (
    <BrowserRouter>
      <DeveloperIcon />
      <GlobalLoader>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/interview" element={<InterviewRoom />} />
          <Route path="/interview-results" element={<InterviewResults />} />
          <Route path="/" element={<Navigate to={role ? `/${role}` : "/login"} replace />} />
        </Routes>
      </GlobalLoader>
    </BrowserRouter>
  )
}

export default App
