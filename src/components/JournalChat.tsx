import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Send, X, Zap } from 'lucide-react';

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const triggerWords = ['suicide', 'kill myself', 'die', 'end my life', 'self-harm', 'hurt myself'];

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bear';
  timestamp: Date;
}

// fallback if Groq fails
const fallbackBearResponses = [
  "I'm here to listen. How do you feel about that?",
  'Thank you for sharing. Would you like to tell me more?',
  'I hear you. Sometimes writing things down helps get them out of your head.',
  "That's interesting. How did that make you feel?",
  "I'm listening. Your feelings are valid.",
  "It sounds like you're going through a lot. Remember to be kind to yourself.",
  'I appreciate you sharing that with me. Your thoughts matter.',
  'Thank you for trusting me with your thoughts. Would you like to continue?',
  "I'm here for you. Is there anything specific you'd like to focus on?",
  "Remember, it's okay not to be okay sometimes. Would you like to explore this further?",
];

const helpResources = {
  title: 'It sounds like you might be going through a difficult time.',
  message:
    "Remember that you're not alone, and help is available. Would you like to talk to someone who can provide professional support?",
  resources: [
    { name: 'National Suicide Prevention Lifeline', contact: '1-800-273-8255' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
    {
      name: 'International Association for Suicide Prevention',
      url: 'https://www.iasp.info/resources/Crisis_Centres/',
    },
  ],
};

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
const JournalChat = () => {
  const { writeJournal } = useGamificationStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [isSendingAway, setIsSendingAway] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const [isLLMThinking, setIsLLMThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Initial greeting ───────────────────
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Hi there! I'm your Little Bear journal companion. Feel free to share your thoughts with me. I'm here to listen, and everything you write is private. You'll earn XP for journaling!",
        sender: 'bear',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // ── Scroll on new message ───────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLLMThinking]);

  // ── Helpers ─────────────────────────────
  const checkForTriggerWords = (t: string) =>
    triggerWords.some((w) => t.toLowerCase().includes(w));

  const randomFallback = () =>
    fallbackBearResponses[Math.floor(Math.random() * fallbackBearResponses.length)];

  // ── Send message ────────────────────────
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMsg]);
    setHistory((p) => [...p, { role: 'user', content: currentMessage }]);
    setCurrentMessage('');

    // XP
    await writeJournal();
    setShowXpGain(true);
    setTimeout(() => setShowXpGain(false), 2000);

    // Crisis
    if (checkForTriggerWords(userMsg.text)) {
      setShowHelp(true);
      return;
    }

    // Call Groq Mixtral
    setIsLLMThinking(true);
    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg.text, history }),
      }).then((r) => r.json());

      const assistantText: string = res.assistant ?? randomFallback();
      const bearMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'bear',
        timestamp: new Date(),
      };
      setMessages((p) => [...p, bearMsg]);
      setHistory((p) => [...p, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      console.error(err);
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          text: randomFallback(),
          sender: 'bear',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLLMThinking(false);
    }
  };

  // ── Journaling helpers ──────────────────
  const startJournaling = () => {
    setIsWriting(true);
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        text: "Here's a space for you to write freely. When you're done, you can release your thoughts by sending them away. Don't worry, I won't keep them - this is just for you. You'll earn XP for this too!",
        sender: 'bear',
        timestamp: new Date(),
      },
    ]);
  };

  const sendAwayJournal = async () => {
    if (!journalText.trim()) {
      setIsWriting(false);
      return;
    }
    setIsSendingAway(true);
    await writeJournal();
    setShowXpGain(true);

    setTimeout(() => {
      setIsSendingAway(false);
      setIsWriting(false);
      setJournalText('');
      setShowXpGain(false);
      setMessages((p) => [
        ...p,
        {
          id: Date.now().toString(),
          text: 'Your thoughts have been released. Great job on journaling - you earned some XP! Is there anything else you\'d like to talk about?',
          sender: 'bear',
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  const closeHelp = () => {
    setShowHelp(false);
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        text: 'Thank you for being open. Remember that seeking help is a sign of strength. I\'m here if you want to continue talking.',
        sender: 'bear',
        timestamp: new Date(),
      },
    ]);
  };

  // ────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* XP Gain */}
      <AnimatePresence>
        {showXpGain && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-4 right-4 z-10 bg-yellow-500/90 text-white px-3 py-2 rounded-lg flex items-center shadow-lg"
          >
            <Zap size={16} className="mr-1" />
            +15 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  m.sender === 'user' ? 'bg-purple-500/70 text-white' : 'bg-white/20 text-white'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Thinking indicator as a bear bubble */}
          {isLLMThinking && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-white/20 text-white italic animate-pulse">
                Little Bear is thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Crisis Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{helpResources.title}</h3>
                <button onClick={closeHelp} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4">{helpResources.message}</p>
              <div className="space-y-2">
                {helpResources.resources.map((r, i) => (
                  <div key={i} className="bg-white/10 p-3 rounded-lg">
                    <div className="font-medium">{r.name}</div>
                    {r.contact && <div className="text-sm">{r.contact}</div>}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline">
                        Visit Website
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={closeHelp} className="mt-4 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg">
                Thank you, I'll consider these resources
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journaling Pane */}
      <AnimatePresence>
        {isWriting && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-4">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={sendAwayJournal} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm flex items-center">
                Release Thoughts (+15 XP)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paper airplane animation */}
      <AnimatePresence>
        {isSendingAway && (
          <motion.div
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 300, y: -300, rotate: 45, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            ✈️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Row */}
      {!isWriting && (
        <div className="flex gap-2">
          <button onClick={startJournaling} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-md text-sm whitespace-nowrap">
            Start Journal (+15 XP)
          </button>
          <div className="flex-1 flex">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-l-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              className="bg-white/20 hover:bg-white/30 px-3 rounded-r-md text-white disabled:opacity-50 flex items-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalChat;
