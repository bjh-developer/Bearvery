import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useBackground } from '../components/BackgroundProvider';
import Clock from '../components/Clock';
import TodoList from '../components/TodoList';
import ComPAWnion from '../components/ComPAWnion';
import JournalChat from '../components/JournalChat';
import MoodTracker from '../components/MoodTracker';
import BreakTimer from '../components/BreakTimer';
import GamificationPanel from '../components/GamificationPanel';
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

  // Initialize gamification data
  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  // Toggle panel visibility
  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="min-h-screen text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4">
        <div>
          <button 
            onClick={() => togglePanel('mood')}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm backdrop-blur-sm transition"
          >
            Mood Tracker
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
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <Clock />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {/* Gamification Panel */}
        <GamificationPanel />
        
        {/* ComPAWnion */}
        <ComPAWnion />
        
        {/* Todo List - Always visible on larger screens, toggleable on mobile */}
        <div className={`
          bg-white/10 backdrop-blur-md rounded-xl p-4 overflow-hidden transition-all duration-300 ease-in-out
          ${activePanel === 'todo' ? 'h-96' : 'h-12 md:h-96'}
        `}>
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
        
        {/* Journal Chat panel */}
        <div className={`
          bg-white/10 backdrop-blur-md rounded-xl p-4 overflow-hidden transition-all duration-300 ease-in-out
          ${activePanel === 'journal' ? 'h-96' : 'h-12'}
        `}>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => togglePanel('journal')}
          >
            <h2 className="font-semibold">Little Bear Journal</h2>
            <button className="p-1 bg-white/10 rounded-full">
              {activePanel === 'journal' ? '−' : '+'}
            </button>
          </div>

          <div>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={handleCallBearapy}
            >
              <button className="p-1 bg-white/10 rounded-full">
                Call Bearapy
              </button>
            </div>
          </div>
          
          <div className={`mt-2 ${activePanel === 'journal' ? 'block' : 'hidden'}`}>
            <JournalChat />
          </div>
        </div>

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
                src=""  // Replace with your real conversation URL
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full rounded-xl border-none"
                title="Bearapy AI"
              />
            </div>
          </div>
        )}

        
        {/* Break Timer */}
        <div className={`
          bg-white/10 backdrop-blur-md rounded-xl p-4 overflow-hidden transition-all duration-300 ease-in-out
          ${activePanel === 'break' ? 'h-64' : 'h-12'}
        `}>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => togglePanel('break')}
          >
            <h2 className="font-semibold">Break Timer</h2>
            <button className="p-1 bg-white/10 rounded-full">
              {activePanel === 'break' ? '−' : '+'}
            </button>
          </div>
          
          <div className={`mt-2 ${activePanel === 'break' ? 'block' : 'hidden'}`}>
            <BreakTimer />
          </div>
        </div>
        
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
    </div>
  );
};

export default Dashboard;