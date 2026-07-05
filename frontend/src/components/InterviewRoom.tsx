import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Interview, InterviewLog } from '../store';


export default function InterviewRoom() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidate_id');
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const prevLogsLength = useRef(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (candidateId) {
      startInterview(parseInt(candidateId));
    }
  }, [candidateId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-speak new bot messages
    if (interview?.logs && interview.logs.length > prevLogsLength.current) {
      const sortedLogs = [...interview.logs].sort((a, b) => a.order_index - b.order_index);
      const lastLog = sortedLogs[sortedLogs.length - 1];
      if (lastLog.sender === 'bot') {
        speakText(lastLog.content);
      }
      prevLogsLength.current = interview.logs.length;
    }
  }, [interview?.logs]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel(); // stop previous
    const cleanText = text.replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel(); // Stop Ari from talking if user wants to speak
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const startInterview = async (id: number) => {
    try {
      const data = await api.interviews.start(id);
      setInterview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !interview) return;

    const transcript = input;
    setInput('');
    setIsLoading(true);

    // Optimistically add user message
    const optimisticLog: InterviewLog = {
      id: Date.now(),
      sender: 'user',
      content: transcript,
      order_index: (interview.logs?.length || 0) + 1
    };
    
    setInterview(prev => prev ? {
      ...prev,
      logs: [...(prev.logs || []), optimisticLog]
    } : null);

    try {
      const updatedInterview = await api.interviews.sendMessage(interview.id, transcript);
      setInterview(updatedInterview);
      
      // If it just completed, update local storage for CandidateDashboard
      if (updatedInterview.status === 'completed') {
        updateApplicationStatus(candidateId!);
        navigate(`/interview-results?interview_id=${updatedInterview.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    if (!interview) return;
    setIsLoading(true);
    try {
      const updatedInterview = await api.interviews.sendMessage(interview.id, "[END_INTERVIEW]");
      setInterview(updatedInterview);
      updateApplicationStatus(candidateId!);
      navigate(`/interview-results?interview_id=${updatedInterview.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationStatus = (candIdStr: string) => {
    const savedApps = localStorage.getItem('myApplications');
    if (savedApps) {
      let apps = JSON.parse(savedApps);
      apps = apps.map((app: any) => 
        app.candidateId.toString() === candIdStr ? { ...app, status: 'Interview Done', completedAt: Date.now() } : app
      );
      localStorage.setItem('myApplications', JSON.stringify(apps));
    }
  };

  if (!candidateId) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="sticky-note bg-note-yellow p-8 rotate-2">
          <div className="tape"></div>
          <p className="font-marker text-2xl text-marker-red">Invalid candidate ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full relative">
      {/* Header */}
      <div className="bg-white/80 border-b-2 border-slate-300 border-dashed py-4 px-6 flex items-center justify-between z-10">
        <h2 className="text-3xl font-marker text-marker-blue -rotate-1">Interview with Ari</h2>
        <div className="flex items-center gap-4">
          {interview?.status !== 'completed' && (
            <button 
              onClick={endInterview}
              disabled={isLoading}
              className="btn-secondary py-1 px-4 text-marker-red border-marker-red font-marker text-lg hover:bg-red-50 transition-colors"
            >
              End Interview
            </button>
          )}
          {interview?.status === 'completed' && (
            <div className="border-4 border-marker-green text-marker-green px-4 py-1 rounded-sm text-2xl font-marker rotate-3 tracking-widest bg-white/50 sketch">
              COMPLETED
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8 w-full max-w-4xl mx-auto">
        {isLoading && !interview && (
          <div className="flex items-center justify-center h-full">
            <span className="font-display text-4xl text-slate-400 animate-pulse">Connecting to Ari...</span>
          </div>
        )}
        
        {interview?.logs && [...interview.logs].sort((a, b) => a.order_index - b.order_index).map((log) => (
          <div key={log.id} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${log.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {log.sender === 'bot' && (
                <div className="flex-shrink-0 mt-2 relative">
                  <div className="w-12 h-12 rounded-full border-4 border-marker-blue bg-white flex items-center justify-center text-marker-blue font-marker text-2xl sketch shadow-sm">
                    A
                  </div>
                  {isSpeaking && log.id === [...interview.logs!].sort((a,b) => a.order_index - b.order_index).pop()?.id && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-marker-green rounded-full animate-ping"></span>
                  )}
                </div>
              )}
              
              <div className={`sticky-note p-5 ${
                log.sender === 'user' 
                  ? 'bg-note-blue text-ink rounded-sm' 
                  : 'bg-note-yellow text-ink rounded-sm'
              }`} style={{ transform: `rotate(${log.sender === 'user' ? '1deg' : '-1deg'})` }}>
                <p className="whitespace-pre-wrap leading-relaxed font-hand text-xl">{log.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && interview && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[85%] md:max-w-[70%]">
              <div className="flex-shrink-0 mt-2">
                <div className="w-12 h-12 rounded-full border-4 border-marker-blue bg-white flex items-center justify-center text-marker-blue font-marker text-2xl sketch animate-pulse">
                  A
                </div>
              </div>
              <div className="sticky-note bg-note-yellow p-5 rounded-sm flex items-center gap-2 transform -rotate-1">
                <span className="w-3 h-3 rounded-full bg-marker-blue sketch animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-3 h-3 rounded-full bg-marker-blue sketch animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-3 h-3 rounded-full bg-marker-blue sketch animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 border-t-2 border-slate-300 border-dashed z-10 w-full sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 items-center">
          <button 
            type="button"
            onClick={toggleListening}
            disabled={isLoading || interview?.status === 'completed'}
            className={`btn-secondary w-14 h-14 p-0 rounded-full flex items-center justify-center text-2xl transition-all ${isListening ? 'border-marker-red bg-red-100 text-marker-red animate-pulse scale-105' : 'bg-white'}`}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
          
          <textarea 
            className="input-primary flex-1 py-3 resize-none"
            placeholder={isListening ? "Listening..." : "Type your answer or tap the mic..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || interview?.status === 'completed'}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSend(e as any);
              }
            }}
          />
          <button 
            type="submit" 
            className="btn-primary px-8 py-3 text-xl"
            disabled={isLoading || !input.trim() || interview?.status === 'completed'}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
