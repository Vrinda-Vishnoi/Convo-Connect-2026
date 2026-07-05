import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // We wait 500ms before showing the loader so it doesn't flash on local dev if backend is instantly ready
    const timer = setTimeout(() => {
        if (mounted && !isReady) setShowLoading(true);
    }, 500);

    const checkHealth = async () => {
      while (mounted) {
        try {
          await api.health.check();
          if (mounted) {
              setIsReady(true);
              setShowLoading(false);
          }
          break;
        } catch (e) {
          // Wait 2 seconds and retry
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    };
    
    checkHealth();
    
    return () => { 
        mounted = false; 
        clearTimeout(timer);
    };
  }, [isReady]);

  if (isReady || !showLoading) {
      if (!isReady) return null; // Wait silently for 500ms
      return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center z-[100] transition-colors duration-300">
       <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-marker-blue dark:border-t-marker-blue rounded-full animate-spin mb-8"></div>
       <h1 className="text-3xl font-marker text-ink dark:text-slate-100 text-center max-w-md animate-pulse">
         Waking the AI...
       </h1>
       <p className="font-hand text-slate-500 dark:text-slate-400 text-lg mt-4 text-center max-w-md px-4">
         The server is warming up from its slumber. This usually takes about a minute on the free tier!
       </p>
    </div>
  );
}
