import React, { useState, useEffect, useCallback } from 'react';
import { useGamificationStore } from '../stores/gamificationStore';

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const SOLUTION = 'REACT'; // You can randomize this later

type LetterStatus = 'correct' | 'present' | 'absent';

const getStatuses = (guess: string, solution: string): LetterStatus[] => {
  const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
  const solutionLetters = solution.split('');

  // First pass: mark correct
  guess.split('').forEach((char, i) => {
    if (char === solution[i]) {
      result[i] = 'correct';
      solutionLetters[i] = ''; // prevent double-counting
    }
  });

  // Second pass: mark present
  guess.split('').forEach((char, i) => {
    if (result[i] === 'correct') return;
    const index = solutionLetters.indexOf(char);
    if (index !== -1) {
      result[i] = 'present';
      solutionLetters[index] = '';
    }
  });

  return result;
};

const Keyboard = ({ onKey }: { onKey: (key: string) => void }) => {
  const keys = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  return (
    <div className="space-y-2">
      {keys.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {row.split('').map((key) => (
            <button
              key={key}
              onClick={() => onKey(key)}
              className="bg-white/10 hover:bg-white/20 text-white rounded px-3 py-2 text-sm font-medium"
            >
              {key}
            </button>
          ))}
          {i === 2 && (
            <>
              <button
                onClick={() => onKey('BACKSPACE')}
                className="bg-red-500/30 hover:bg-red-500/50 text-sm rounded px-3 py-2 text-white font-medium"
              >
                ⌫
              </button>
              <button
                onClick={() => onKey('ENTER')}
                className="bg-green-500/30 hover:bg-green-500/50 text-sm rounded px-3 py-2 text-white font-medium"
              >
                ⏎
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

const WordleGame = () => {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<LetterStatus[][]>([]);
  const [current, setCurrent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  const { userProgress, updateProgress, completeWordle } = useGamificationStore();

  const handleWin = () => {
    completeWordle(); //  Award XP using gamification store
  };

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === 'ENTER') {
        if (current.length !== WORD_LENGTH) {
          setMessage('Not enough letters');
          return;
        }

        const result = getStatuses(current.toUpperCase(), SOLUTION);
        const newGuesses = [...guesses, current];
        const newStatuses = [...statuses, result];

        setGuesses(newGuesses);
        setStatuses(newStatuses);
        setCurrent('');

        if (current.toUpperCase() === SOLUTION) {
          setGameOver(true);
          setMessage('🎉 You won! +20 XP');
          handleWin(); // 🔔 call to gamification logic
        } else if (newGuesses.length === MAX_ATTEMPTS) {
          setGameOver(true);
          setMessage(`❌ The word was ${SOLUTION}`);
        }
        return;
      }

      if (key === 'BACKSPACE') {
        setCurrent((c) => c.slice(0, -1));
        return;
      }

      if (key.length === 1 && current.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
        setCurrent((c) => c + key);
      }
    },
    [current, guesses, gameOver, userProgress, updateProgress, completeWordle]
  );

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKey(e.key.toUpperCase());
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleKey]);

  return (
    <div className="text-white max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold text-center mb-4">Wordle Game</h2>

      {/* Word Grid */}
      <div className="grid gap-2 mb-6">
        {[...Array(MAX_ATTEMPTS)].map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? current : '');
          const statusRow = statuses[rowIndex] || [];
          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {[...Array(WORD_LENGTH)].map((_, col) => {
                const char = guess[col]?.toUpperCase() || '';
                const status = statusRow[col];
                let bg = 'bg-white/10';
                if (status === 'correct') bg = 'bg-green-500';
                else if (status === 'present') bg = 'bg-yellow-500';
                else if (status === 'absent') bg = 'bg-gray-700';

                return (
                  <div
                    key={col}
                    className={`h-12 w-12 flex items-center justify-center font-bold text-lg rounded ${bg}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <Keyboard onKey={handleKey} />

      {/* Message */}
      {message && (
        <div className="mt-4 text-center text-sm text-white/80 font-medium">
          {message}
        </div>
      )}
    </div>
  );
};

export default WordleGame;
