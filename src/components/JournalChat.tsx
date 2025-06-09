import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Send, X, Zap } from 'lucide-react';

// Trigger words for suggesting help
const triggerWords = ['suicide', 'kill myself', 'die', 'end my life', 'self-harm', 'hurt myself'];

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bear';
  timestamp: Date;
}

// Little Bear responses for journaling
const bearResponses = [
  "I'm here to listen. How do you feel about that?",
  "Thank you for sharing. Would you like to tell me more?",
  "I hear you. Sometimes writing things down helps get them out of your head.",
  "That's interesting. How did that make you feel?",
  "I'm listening. Your feelings are valid.",
  "It sounds like you're going through a lot. Remember to be kind to yourself.",
  "I appreciate you sharing that with me. Your thoughts matter.",
  "Thank you for trusting me with your thoughts. Would you like to continue?",
  "I'm here for you. Is there anything specific you'd like to focus on?",
  "Remember, it's okay not to be okay sometimes. Would you like to explore this further?",
];

// Help resources for crisis detection
const helpResources = {
  title: "It sounds like you might be going through a difficult time.",
  message: "Remember that you're not alone, and help is available. Would you like to talk to someone who can provide professional support?",
  resources: [
    { name: "National Suicide Prevention Lifeline", contact: "1-800-273-8255" },
    { name: "Crisis Text Line", contact: "Text HOME to 741741" },
    { name: "International Association for Suicide Prevention", url: "https://www.iasp.info/resources/Crisis_Centres/" },
  ]
};

const JournalChat = () => {
  const { user } = useAuthStore();
  const { writeJournal } = useGamificationStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [isSendingAway, setIsSendingAway] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initial greeting when component mounts
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "Hi there! I'm your Little Bear journal companion. Feel free to share your thoughts with me. I'm here to listen, and everything you write is private. You'll earn XP for journaling!",
      sender: 'bear',
      timestamp: new Date(),
    };
    
    setMessages([initialMessage]);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for trigger words
  const checkForTriggerWords = (text: string) => {
    const lowerText = text.toLowerCase();
    return triggerWords.some(word => lowerText.includes(word));
  };

  const getRandomBearResponse = () => {
    return bearResponses[Math.floor(Math.random() * bearResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // Award XP for journaling
    await writeJournal();
    setShowXpGain(true);
    setTimeout(() => setShowXpGain(false), 2000);
    
    // Check for trigger words
    if (checkForTriggerWords(currentMessage)) {
      setShowHelp(true);
    } else {
      // Add bear response after a short delay
      setTimeout(() => {
        const bearMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: getRandomBearResponse(),
          sender: 'bear',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, bearMessage]);
      }, 1000);
    }
  };

  const startJournaling = () => {
    setIsWriting(true);
    
    const bearMessage: Message = {
      id: Date.now().toString(),
      text: "Here's a space for you to write freely. When you're done, you can release your thoughts by sending them away. Don't worry, I won't keep them - this is just for you. You'll earn XP for this too!",
      sender: 'bear',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, bearMessage]);
  };

  const sendAwayJournal = async () => {
    if (!journalText.trim()) {
      setIsWriting(false);
      return;
    }
    
    setIsSendingAway(true);
    
    // Award XP for journaling
    await writeJournal();
    setShowXpGain(true);
    
    // Animation duration
    setTimeout(() => {
      setIsSendingAway(false);
      setIsWriting(false);
      setJournalText('');
      setShowXpGain(false);
      
      // Add confirmation message
      const bearMessage: Message = {
        id: Date.now().toString(),
        text: "Your thoughts have been released. I hope that helped lighten your mental load. Great job on journaling - you earned some XP! Is there anything else you'd like to talk about?",
        sender: 'bear',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, bearMessage]);
    }, 2000);
  };

  const closeHelp = () => {
    setShowHelp(false);
    
    // Add supportive message
    const bearMessage: Message = {
      id: Date.now().toString(),
      text: "Thank you for being open. Remember that seeking help is a sign of strength, not weakness. I'm here if you want to continue talking.",
      sender: 'bear',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, bearMessage]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* XP Gain Notification */}
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-purple-500/70 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Crisis help resources modal */}
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
                <button 
                  onClick={closeHelp}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
              
              <p className="mb-4">{helpResources.message}</p>
              
              <div className="space-y-2">
                {helpResources.resources.map((resource, index) => (
                  <div key={index} className="bg-white/10 p-3 rounded-lg">
                    <div className="font-medium">{resource.name}</div>
                    {resource.contact && (
                      <div className="text-sm">{resource.contact}</div>
                    )}
                    {resource.url && (
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-300 hover:underline"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={closeHelp}
                className="mt-4 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg"
              >
                Thank you, I'll consider these resources
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Journaling area */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4"
          >
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-32 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            />
            
            <div className="flex justify-end mt-2">
              <button
                onClick={sendAwayJournal}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm flex items-center"
              >
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
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            ✈️
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Input area */}
      {!isWriting && (
        <div className="flex gap-2">
          <button
            onClick={startJournaling}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-md text-sm whitespace-nowrap"
          >
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