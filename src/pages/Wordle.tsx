import React from 'react';
import WordleGame from '../components/WordleGame';

const WordlePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <WordleGame />
    </div>
  );
};

export default WordlePage;
