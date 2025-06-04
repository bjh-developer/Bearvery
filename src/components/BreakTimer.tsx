import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const breakDurations = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
];

const BreakTimer = () => {
  const [selectedDuration, setSelectedDuration] = useState(breakDurations[0].value);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(selectedDuration * 60);
  const [showNotification, setShowNotification] = useState(false);
  
  // Handle timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeRemaining === 0) {
      setIsTimerRunning(false);
      setShowNotification(true);
      
      // Play notification sound if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break Time', {
          body: 'Your break is over. Time to get back to work!',
        });
      }
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  const startTimer = () => {
    setTimeRemaining(selectedDuration * 60);
    setIsTimerRunning(true);
  };
  
  const stopTimer = () => {
    setIsTimerRunning(false);
  };
  
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(selectedDuration * 60);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = isTimerRunning 
    ? ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100
    : 0;
  
  return (
    <div>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 bg-green-500/20 border border-green-500/50 text-white px-3 py-2 rounded-md"
        >
          Break completed! Time to return to your work.
        </motion.div>
      )}
      
      {!isTimerRunning && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select break duration:
          </label>
          <div className="flex gap-2">
            {breakDurations.map((duration) => (
              <button
                key={duration.value}
                onClick={() => {
                  setSelectedDuration(duration.value);
                  setTimeRemaining(duration.value * 60);
                }}
                className={`flex-1 py-2 rounded-md text-sm ${
                  selectedDuration === duration.value
                    ? 'bg-white/30'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative mb-4 h-32 flex flex-col items-center justify-center bg-white/5 rounded-lg">
        {/* Progress circle */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(96, 165, 250, 0.7)"
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * progress) / 100}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        
        <div className="relative">
          <div className="text-4xl font-light mb-1">{formatTime(timeRemaining)}</div>
          <div className="text-xs text-white/70 text-center">
            {isTimerRunning ? 'Time remaining' : 'Break duration'}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        {!isTimerRunning ? (
          <button
            onClick={startTimer}
            className="flex-1 bg-blue-500/70 hover:bg-blue-500/90 py-2 rounded-md"
          >
            Start Break
          </button>
        ) : (
          <>
            <button
              onClick={stopTimer}
              className="flex-1 bg-orange-500/70 hover:bg-orange-500/90 py-2 rounded-md"
            >
              Pause
            </button>
            <button
              onClick={resetTimer}
              className="flex-1 bg-red-500/70 hover:bg-red-500/90 py-2 rounded-md"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BreakTimer;