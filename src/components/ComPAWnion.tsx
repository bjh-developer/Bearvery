import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// Pet characters
const pets = [
  { id: 'bear', name: 'Teddy', image: '/assets/images/bear.png' },
];

// Wellness tips
const wellnessTips = [
  "Remember to take deep breaths when you feel stressed.",
  "It's okay to take breaks - your brain needs them to perform well!",
  "Stay hydrated! Drink some water right now.",
  "Stretch your body for a minute. Your future self will thank you.",
  "Try the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.",
  "A quick walk can boost your mood and creativity.",
  "Don't forget to celebrate small wins - they add up!",
  "If you're feeling overwhelmed, try breaking tasks into smaller steps.",
  "It's okay if you don't finish everything today. Be kind to yourself.",
  "Your worth isn't measured by your productivity. You matter just because you exist.",
];

interface UserPet {
  pet_id: string;
  custom_tips: string[];
}

const ComPAWnion = () => {
  const { user } = useAuthStore();
  const [selectedPet, setSelectedPet] = useState(pets[0]);
  const [customTips, setCustomTips] = useState<string[]>([]);
  const [isShowingTip, setIsShowingTip] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [isAddingTip, setIsAddingTip] = useState(false);
  const [newTip, setNewTip] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [happiness, setHappiness] = useState(50);
  const petRef = useRef<HTMLDivElement>(null);
  const tipInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPet();
    }
  }, [user]);

  useEffect(() => {
    startTipInterval();
    return () => {
      if (tipInterval.current) {
        clearInterval(tipInterval.current);
      }
    };
  }, [customTips, selectedPet]);

  const fetchUserPet = async () => {
    try {
      const { data, error } = await supabase
        .from('user_pets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const pet = pets.find(p => p.id === data.pet_id) || pets[0];
        setSelectedPet(pet);
        setCustomTips(data.custom_tips || []);
        setHappiness(data.happiness || 50);
      }
    } catch (error) {
      console.error('Error fetching user pet:', error);
    }
  };

  const saveUserPet = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_pets')
        .upsert({
          user_id: user.id,
          pet_id: selectedPet.id,
          custom_tips: customTips,
          happiness: happiness,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user pet:', error);
    }
  };

  const startTipInterval = () => {
    if (tipInterval.current) {
      clearInterval(tipInterval.current);
    }
    setTimeout(showRandomTip, 5000);
    tipInterval.current = setInterval(showRandomTip, 30 * 60 * 1000);
  };

  const showRandomTip = () => {
    const allTips = [...wellnessTips, ...customTips];
    const randomTip = allTips[Math.floor(Math.random() * allTips.length)];
    setCurrentTip(randomTip);
    setIsShowingTip(true);
    setTimeout(() => setIsShowingTip(false), 10000);
  };

  const handlePetClick = () => {
    if (petRef.current) {
      petRef.current.classList.add('scale-110');
      setTimeout(() => petRef.current?.classList.remove('scale-110'), 200);
    }
    setHappiness(prev => Math.min(prev + 5, 100));
    setCurrentTip("Aww, thanks for the pets! I feel loved!");
    setIsShowingTip(true);
    setTimeout(() => setIsShowingTip(false), 3000);
    saveUserPet();
  };

  const addCustomTip = () => {
    if (newTip.trim() && customTips.length < 20) {
      const updatedTips = [...customTips, newTip.trim()];
      setCustomTips(updatedTips);
      setNewTip('');
      setIsAddingTip(false);
      saveUserPet();
    }
  };

  const changePet = (pet: typeof pets[0]) => {
    setSelectedPet(pet);
    saveUserPet();
  };

  const deleteTip = (index: number) => {
    const updatedTips = customTips.filter((_, i) => i !== index);
    setCustomTips(updatedTips);
    saveUserPet();
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 relative">
      <div className="flex justify-between items-start">
        <h2 className="font-semibold">Your ComPAWnion</h2>
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-1 bg-white/10 hover:bg-white/20 rounded-full text-xs">
          {isSettingsOpen ? 'Close' : 'Settings'}
        </button>
      </div>

      {isSettingsOpen ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Choose your pet:</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => changePet(pet)}
                className={`p-2 rounded-lg ${
                  selectedPet.id === pet.id ? 'bg-white/30 ring-2 ring-white' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <img src={pet.image} alt={pet.name} className="w-10 h-10 object-cover rounded-full" />
              </button>
            ))}
          </div>

          <h3 className="text-sm font-medium mb-2">Your custom tips ({customTips.length}/20):</h3>
          {customTips.length === 0 ? (
            <p className="text-sm text-white/70 mb-2">No custom tips added yet.</p>
          ) : (
            <ul className="mb-4 max-h-32 overflow-y-auto">
              {customTips.map((tip, index) => (
                <li key={index} className="flex justify-between items-center text-sm mb-1 p-1 hover:bg-white/10 rounded">
                  <span className="mr-2">{tip}</span>
                  <button onClick={() => deleteTip(index)} className="text-xs bg-white/10 hover:bg-white/20 p-1 rounded">✕</button>
                </li>
              ))}
            </ul>
          )}

          {isAddingTip ? (
            <div className="mt-2">
              <input
                type="text"
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                placeholder="Enter a motivational tip..."
                className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 mb-2"
                maxLength={100}
              />
              <div className="flex gap-2">
                <button
                  onClick={addCustomTip}
                  disabled={!newTip.trim() || customTips.length >= 20}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Tip
                </button>
                <button
                  onClick={() => {
                    setIsAddingTip(false);
                    setNewTip('');
                  }}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTip(true)}
              disabled={customTips.length >= 20}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Custom Tip
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-4">
          <div ref={petRef} className="mb-2 cursor-pointer transition-transform duration-200" onClick={handlePetClick}>
            <img src={selectedPet.image} alt={selectedPet.name} className="w-24 h-24 object-cover rounded-full" />
          </div>

          <div className="text-center mb-2">
            <div className="font-medium">{selectedPet.name}</div>
            <div className="text-xs text-white/70">Click to pet</div>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${happiness}%` }}
            ></div>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={handlePetClick} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
              <Heart size={16} className="text-pink-400" />
            </button>
            <button onClick={showRandomTip} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
              <MessageCircle size={16} />
            </button>
          </div>

          <AnimatePresence>
            {isShowingTip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white rounded-lg p-3 mt-4 max-w-xs text-sm"
              >
                {currentTip}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ComPAWnion;