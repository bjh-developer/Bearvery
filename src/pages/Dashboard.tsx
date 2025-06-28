import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useBackground } from '../components/BackgroundProvider';
import Clock from '../components/Clock';
import TodoList from '../components/TodoList';
import ComPAWnion from '../components/ComPAWnion';
import JournalChat from '../components/JournalChat';
import MoodTracker from '../components/MoodTracker';
import GamificationPanel from '../components/GamificationPanel';
import WordleGame from '../components/WordleGame'; //  Import Wordle
import { RefreshCw, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { signOut } = useAuthStore();
  const { fetchUserProgress } = useGamificationStore();
  const { nextBackground } = useBackground();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Initialise bearapy AI call
  const [isOpen, setIsOpen] = useState(false);
  const handleCallBearapy = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const tavusURL = import.meta.env.VITE_TAVUS_URL;

  return (
    <div className="min-h-screen text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-2">
          <button
            onClick={() => togglePanel('mood')}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm backdrop-blur-sm transition"
          >
            Mood Tracker
          </button>
          <button
  onClick={() => togglePanel('wordle')}
  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 rounded-full text-sm font-bold text-black shadow-lg transition"

>
  🎯 Play Wordle Challenge
</button>

        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={nextBackground}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition"
            aria-label="Change background"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => signOut()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Clock */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 mt-4 mb-6">
        <Clock />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 pb-16">
        <GamificationPanel />
        <ComPAWnion />

        {/* To-Do List */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-h-[120px]">
          <div
            className="flex items-center justify-between cursor-pointer md:cursor-default"
            onClick={() => togglePanel('todo')}
          >
            <h2 className="font-semibold">To-Do List</h2>
            <button className="md:hidden p-1 bg-white/10 rounded-full">
              {activePanel === 'todo' ? '−' : '+'}
            </button>
          </div>
          <div className={`mt-2 ${activePanel === 'todo' ? 'block' : 'hidden md:block'}`}>
            <TodoList />
          </div>
        </div>

        
        {/* Little Bear Journal panel */}
        <div
          className={`
            bg-white/10 backdrop-blur-md rounded-xl p-4 transition-all duration-300 ease-in-out
            ${activePanel === 'journal' ? 'h-96' : 'h-12'}
            flex flex-col min-h-0          /* let center area scroll */
          `}
        >
          {/* Header bar (click to expand/collapse) */}

          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => togglePanel('journal')}
          >
            <h2 className="font-semibold">Little Bear Journal</h2>
            <button className="p-1 bg-white/10 rounded-full">
              {activePanel === 'journal' ? '−' : '+'}
            </button>
          </div>


          {/* Show this area only when expanded */}
          {activePanel === 'journal' && (
            <>
              {/* Call Bearapy button — inside the panel */}
              <div className="mt-2">
                <button
                  onClick={handleCallBearapy}
                  className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-md text-sm"
                >
                  Call Bearapy
                </button>
              </div>

              {/* Scrollable chat viewport */}
              <div className="mt-2 flex-1 overflow-y-auto">
                <JournalChat />
              </div>
            </>
          )}
        </div>
      </div>




      {/* Wordle Game Modal */}
      {activePanel === 'wordle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Wordle Challenge</h2>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
          </div>
          <WordleGame />
        </div>
      </div>
      )}

      {/* Bearapy AI Pop-Up - moved outside journal panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
        >
          <div className="relative bg-white/90 text-black rounded-2xl shadow-2xl p-4 w-[95%] h-[90%] max-w-5xl animate-scaleIn overflow-hidden">
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-4 text-black bg-white/20 hover:bg-white/30 rounded-full px-2 py-1"
            >
              ✕
            </button>
            
            {/* Tavus iframe */}
            <iframe
              src={tavusURL}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full rounded-xl border-none"
              title="Bearapy AI"
            />
          </div>
        </div>
      )}

      {/* Mood Tracker Panel (conditionally rendered) */}
      {activePanel === 'mood' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">How are you feeling today?</h2>
              <button 
                onClick={() => setActivePanel(null)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>
            <MoodTracker onClose={() => setActivePanel(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
