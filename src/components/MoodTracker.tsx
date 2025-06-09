import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { format } from 'date-fns';

interface MoodEntry {
  id: string;
  user_id: string;
  mood: string;
  notes: string;
  created_at: string;
}

interface MoodOption {
  value: string;
  emoji: string;
  label: string;
  color: string;
}

interface MoodTrackerProps {
  onClose: () => void;
}

const moodOptions: MoodOption[] = [
  { value: 'great', emoji: '😁', label: 'Great', color: 'bg-green-500' },
  { value: 'good', emoji: '🙂', label: 'Good', color: 'bg-blue-500' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: 'bg-yellow-500' },
  { value: 'bad', emoji: '😔', label: 'Bad', color: 'bg-orange-500' },
  { value: 'awful', emoji: '😢', label: 'Awful', color: 'bg-red-500' },
];

const MoodTracker: React.FC<MoodTrackerProps> = ({ onClose }) => {
  const { user } = useAuthStore();
  const { trackMood } = useGamificationStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fetch recent moods
  useEffect(() => {
    if (user) {
      fetchRecentMoods();
    }
  }, [user]);
  
  const fetchRecentMoods = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(7);
      
      if (error) throw error;
      
      if (data) {
        setRecentMoods(data);
      }
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    }
  };
  
  const submitMood = async () => {
    if (!selectedMood || !user) return;
    
    setIsSubmitting(true);
    
    try {
      const newEntry = {
        user_id: user.id,
        mood: selectedMood,
        notes: notes,
      };
      
      const { error } = await supabase
        .from('mood_entries')
        .insert([newEntry]);
      
      if (error) throw error;
      
      // Trigger gamification
      await trackMood();
      
      // Refetch to update history
      await fetchRecentMoods();
      
      // Show success animation
      setShowSuccess(true);
      
      // Reset form
      setSelectedMood(null);
      setNotes('');
      
      // Close the modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="text-white text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold mb-2">Mood Tracked!</h3>
        <p className="text-white/70">+5 XP earned for tracking your mood</p>
      </div>
    );
  }
  
  return (
    <div className="text-white">
      {showHistory ? (
        <>
          <h3 className="text-lg font-medium mb-4">Your Mood History</h3>
          
          {recentMoods.length === 0 ? (
            <p className="text-white/70">No mood entries yet. Start tracking your mood daily.</p>
          ) : (
            <div className="space-y-3">
              {recentMoods.map((entry) => {
                const mood = moodOptions.find(m => m.value === entry.mood);
                
                return (
                  <div key={entry.id} className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{mood?.emoji}</span>
                        <div>
                          <div className="font-medium">{mood?.label}</div>
                          <div className="text-xs text-white/70">
                            {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${mood?.color}`}></div>
                    </div>
                    
                    {entry.notes && (
                      <div className="mt-2 text-sm bg-white/5 p-2 rounded">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <button
            onClick={() => setShowHistory(false)}
            className="mt-4 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg"
          >
            Back to Mood Check-in
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 text-center">
            <p className="text-sm text-white/70">Track your mood to earn XP and maintain your wellness streak!</p>
          </div>

          <div className="flex justify-between gap-2 mb-6">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-transform ${
                  selectedMood === mood.value
                    ? `${mood.color} transform scale-110 shadow-lg`
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling today? What contributed to your mood?"
              className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none h-24"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={submitMood}
              disabled={!selectedMood || isSubmitting}
              className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Mood (+5 XP)'}
            </button>
            
            <button
              onClick={() => setShowHistory(true)}
              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg"
            >
              View History
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MoodTracker;