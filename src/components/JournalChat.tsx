import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../stores/gamificationStore';
import { Send, X, Zap } from 'lucide-react';

/* ─────────────────────────────────────────
   Config & helpers
────────────────────────────────────────── */
const triggerWords = ['suicide', 'kill myself', 'die', 'end my life', 'self-harm', 'hurt myself'];

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bear';
  timestamp: Date;
}

const fallbackBearResponses = [
  "I'm here to listen. How do you feel about that?",
  'Thank you for sharing. Would you like to tell me more?',
  "That's interesting. How did that make you feel?",
  "I'm listening. Your feelings are valid.",
];

const helpResources = {
  title: 'It sounds like you might be going through a difficult time.',
  message:
    "Remember that you're not alone, and help is available. Would you like to talk to someone who can provide professional support?",
  resources: [
    { name: 'National Suicide Prevention Lifeline', contact: '1-800-273-8255' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
  ],
};

const systemPrompt =
  'You are Anna, a warm, youth‑friendly bear who helps students reflect on their feelings. ' +
  'Validate emotions, ask gentle follow‑ups, no medical diagnosis.';

/* ─────────────────────────────────────────
   Component
────────────────────────────────────────── */
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
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* initial greeting */
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Hi there! I'm your Little Bear journal companion. Feel free to share your thoughts with me. Everything you write is private, and you'll earn XP for journaling!",
        sender: 'bear',
        timestamp: new Date(),
      },
    ]);
  }, []);

  /* autoscroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  /* helpers */
  const checkTrigger = (txt: string) =>
    triggerWords.some((w) => txt.toLowerCase().includes(w));

  const randomFallback = () =>
    fallbackBearResponses[Math.floor(Math.random() * fallbackBearResponses.length)];

  /* LLM call */
  const fetchGroq = async (userText: string) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    // 1️⃣ build the payload first
    const payload = {
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userText },
      ],
      max_tokens: 200,
      temperature: 0.7,
    };

    // 👉 log the payload you’re about to send
    console.log('Groq payload →', payload);

    // 2️⃣ send the request
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // 👉 log HTTP status
    console.log('Groq status ←', resp.status);

    // 3️⃣ if the call failed, dump raw text to see Groq’s error JSON
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Groq error body ←', errText);
      throw new Error(`Groq error ${resp.status}`);
    }

    // 4️⃣ parse and log the JSON success payload
    const data = await resp.json();
    console.log('Groq response ←', data);

    return data.choices?.[0]?.message?.content?.trim() as string;
  };

  /* send msg */
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

    await writeJournal();
    setShowXpGain(true);
    setTimeout(() => setShowXpGain(false), 2000);

    if (checkTrigger(userMsg.text)) {
      setShowHelp(true);
      return;
    }

    setIsThinking(true);
    try {
      const assistantText = await fetchGroq(userMsg.text);
      const bearMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText || randomFallback(),
        sender: 'bear',
        timestamp: new Date(),
      };
      setMessages((p) => [...p, bearMsg]);
      setHistory((p) => [...p, { role: 'assistant', content: bearMsg.text }]);
    } catch (e) {
      console.error(e);
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
      setIsThinking(false);
    }
  };

  /* journaling helpers */
  const startJournaling = () => {
    setIsWriting(true);
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        text: "Here's a space for you to write freely. When you're done, hit “Release Thoughts” and you'll get XP!",
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
          text: 'Your thoughts have been released. Great job! 🐻',
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
        text: 'Thanks for sharing. Remember, reaching out is strong. I’m here anytime.',
        sender: 'bear',
        timestamp: new Date(),
      },
    ]);
  };

  /* ───────────────── UI ───────────────── */
  return (
    <div className="h-full flex flex-col">
      {/* XP gain pop */}
      <AnimatePresence>
        {showXpGain && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-4 right-4 bg-yellow-500/90 text-white px-3 py-2 rounded-lg flex items-center shadow-lg"
          >
            <Zap size={16} className="mr-1" />
            +15 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat */}
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

          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-white/20 text-white italic animate-pulse">
                Little Bear is thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Crisis modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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
                {helpResources.resources.map((r) => (
                  <div key={r.name} className="bg-white/10 p-3 rounded-lg">
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
                Thank you, I’ll consider these resources
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journaling pane */}
      <AnimatePresence>
        {isWriting && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-4">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={sendAwayJournal} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm flex items-center">
                Release Thoughts (+15 XP)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Airplane animation */}
      <AnimatePresence>
        {isSendingAway && (
          <motion.div
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 300, y: -300, rotate: 45, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            ✈️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!isWriting && (
        <div className="flex gap-2">
          <button onClick={startJournaling} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-md text-sm whitespace-nowrap">
            Start Journal (+15 XP)
          </button>
          <div className="flex-1 flex">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-l-md px-3 py-2 text-white placeholder-white/50"
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
