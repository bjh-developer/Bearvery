import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Quotes for display
const quotes = [
  { text: "Nature heals.", author: "Unknown" },
  { text: "Give whatever you are doing and whoever you are with the gift of your attention.", author: "Jim Rohn" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Your mind will answer most questions if you learn to relax and wait for the answer.", author: "William S. Burroughs" },
  { text: "Be present in all things and thankful for all things.", author: "Maya Angelou" },
  { text: "Nothing is worth more than this day.", author: "Johann Wolfgang von Goethe" },
  { text: "Take a deep breath. It's just a bad day, not a bad life.", author: "Unknown" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You are stronger than you think.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "You don’t have to be perfect to start. You just have to start.", author: "Unknown" },
  { text: "Shoot for the moon. Even if you miss, you'll land among the stars.", author: "Norman Vincent Peale"},
  { text: "One step at a time is still progress.", author: "Unknown" },
  { text: "Be kind to yourself. You’re doing the best you can.", author: "Unknown" },
  { text: "Rest is productive too.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Even on your worst day, you’re still growing.", author: "Unknown" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
];

const Clock = () => {
  const [time, setTime] = useState<Date>(new Date());
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [quote, setQuote] = useState(() => {
    // Get random quote initially
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle pomodoro timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPomodoroActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds === 0) {
          if (pomodoroMinutes === 0) {
            // Timer finished
            setIsPomodoroActive(false);
            setPomodoroMinutes(25); // Reset to default
            // Play sound or notification here
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pomodoro Timer', {
                body: 'Your focus session has ended. Take a break!',
              });
            }
          } else {
            setPomodoroMinutes(pomodoroMinutes - 1);
            setPomodoroSeconds(59);
          }
        } else {
          setPomodoroSeconds(pomodoroSeconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroActive, pomodoroMinutes, pomodoroSeconds]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Change quote periodically
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[randomIndex]);
    }, 60000); // Change quote every minute

    return () => clearInterval(quoteInterval);
  }, []);

  const togglePomodoro = () => {
    if (!isPomodoroActive) {
      // Starting new timer
      setIsPomodoroActive(true);
    } else {
      // Canceling current timer
      setIsPomodoroActive(false);
      setPomodoroMinutes(25);
      setPomodoroSeconds(0);
    }
  };

  const formatPomodoroTime = () => {
    return `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center">
      {isPomodoroActive ? (
        <div className="flex flex-col items-center">
          <div className="text-8xl font-light mb-2">{formatPomodoroTime()}</div>
          <div className="text-xl opacity-80 mb-6">Focus Time</div>
          <button 
            onClick={togglePomodoro}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm backdrop-blur-sm transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="text-8xl font-light mb-2">{format(time, 'h:mm')}</div>
          <div className="text-xl opacity-80 mb-8">{format(time, 'a')}</div>
          <div className="max-w-md mx-auto mb-8">
            <p className="text-xl mb-2">{quote.text}</p>
            <p className="text-sm opacity-70">— {quote.author}</p>
          </div>
          <button 
            onClick={togglePomodoro}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm backdrop-blur-sm transition"
          >
            Start Focus Session
          </button>
        </>
      )}
    </div>
  );
};

export default Clock;