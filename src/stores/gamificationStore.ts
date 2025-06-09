import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: 'tasks' | 'streak' | 'level' | 'mood_entries' | 'journal_entries';
    value: number;
  };
}

export interface UserProgress {
  user_id: string;
  level: number;
  experience_points: number;
  total_tasks_completed: number;
  streak_days: number;
  last_activity_date: string | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  user_id: string;
  reward_type: 'experience' | 'badge' | 'pet_happiness' | 'background';
  reward_data: any;
  claimed: boolean;
  earned_at: string;
}

// Available badges
export const BADGES: Badge[] = [
  {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    color: 'bg-blue-500',
    requirement: { type: 'tasks', value: 1 }
  },
  {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete 10 tasks',
    icon: '⭐',
    color: 'bg-yellow-500',
    requirement: { type: 'tasks', value: 10 }
  },
  {
    id: 'productivity_hero',
    name: 'Productivity Hero',
    description: 'Complete 50 tasks',
    icon: '🏆',
    color: 'bg-gold-500',
    requirement: { type: 'tasks', value: 50 }
  },
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    color: 'bg-orange-500',
    requirement: { type: 'streak', value: 3 }
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintain a 7-day streak',
    icon: '👑',
    color: 'bg-purple-500',
    requirement: { type: 'streak', value: 7 }
  },
  {
    id: 'level_up',
    name: 'Level Up',
    description: 'Reach level 5',
    icon: '📈',
    color: 'bg-green-500',
    requirement: { type: 'level', value: 5 }
  },
  {
    id: 'mood_tracker',
    name: 'Mood Tracker',
    description: 'Track your mood 7 times',
    icon: '😊',
    color: 'bg-pink-500',
    requirement: { type: 'mood_entries', value: 7 }
  },
  {
    id: 'journal_writer',
    name: 'Journal Writer',
    description: 'Write 10 journal entries',
    icon: '📝',
    color: 'bg-indigo-500',
    requirement: { type: 'journal_entries', value: 10 }
  }
];

interface GamificationState {
  userProgress: UserProgress | null;
  userBadges: UserBadge[];
  unclaimedRewards: Reward[];
  newBadges: Badge[];
  loading: boolean;
  
  // Actions
  fetchUserProgress: () => Promise<void>;
  updateProgress: (updates: Partial<UserProgress>) => Promise<void>;
  completeTask: () => Promise<void>;
  trackMood: () => Promise<void>;
  writeJournal: () => Promise<void>;
  claimReward: (rewardId: string) => Promise<void>;
  clearNewBadges: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  userProgress: null,
  userBadges: [],
  unclaimedRewards: [],
  newBadges: [],
  loading: false,

  fetchUserProgress: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ loading: true });
    
    try {
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      // Create initial progress if doesn't exist
      if (!progressData) {
        const initialProgress = {
          user_id: user.id,
          level: 1,
          experience_points: 0,
          total_tasks_completed: 0,
          streak_days: 0,
          last_activity_date: null
        };

        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert([initialProgress])
          .select()
          .single();

        if (createError) throw createError;
        set({ userProgress: newProgress });
      } else {
        set({ userProgress: progressData });
      }

      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      set({ userBadges: badgesData || [] });

      // Fetch unclaimed rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('claimed', false);

      if (rewardsError) throw rewardsError;
      set({ unclaimedRewards: rewardsData || [] });

    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateProgress: async (updates) => {
    const { user } = useAuthStore.getState();
    const { userProgress } = get();
    if (!user || !userProgress) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      set({ userProgress: { ...userProgress, ...updates } });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  },

  completeTask: async () => {
    const { user } = useAuthStore.getState();
    const { userProgress, userBadges } = get();
    if (!user || !userProgress) return;

    const newTasksCompleted = userProgress.total_tasks_completed + 1;
    const experienceGained = 10;
    const newExperience = userProgress.experience_points + experienceGained;
    const newLevel = Math.floor(newExperience / 100) + 1;

    // Update progress
    await get().updateProgress({
      total_tasks_completed: newTasksCompleted,
      experience_points: newExperience,
      level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0]
    });

    // Check for new badges
    const earnedBadgeIds = userBadges.map(b => b.badge_id);
    const newBadges: Badge[] = [];

    for (const badge of BADGES) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let shouldEarn = false;
      switch (badge.requirement.type) {
        case 'tasks':
          shouldEarn = newTasksCompleted >= badge.requirement.value;
          break;
        case 'level':
          shouldEarn = newLevel >= badge.requirement.value;
          break;
      }

      if (shouldEarn) {
        // Award badge
        const { error } = await supabase
          .from('user_badges')
          .insert([{
            user_id: user.id,
            badge_id: badge.id
          }]);

        if (!error) {
          newBadges.push(badge);
        }
      }
    }

    if (newBadges.length > 0) {
      set({ newBadges: [...get().newBadges, ...newBadges] });
      // Refresh badges
      await get().fetchUserProgress();
    }

    // Create reward for task completion
    await supabase
      .from('user_rewards')
      .insert([{
        user_id: user.id,
        reward_type: 'experience',
        reward_data: { amount: experienceGained, reason: 'Task completed' }
      }]);
  },

  trackMood: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Award experience for mood tracking
    const experienceGained = 5;
    const { userProgress } = get();
    if (userProgress) {
      const newExperience = userProgress.experience_points + experienceGained;
      const newLevel = Math.floor(newExperience / 100) + 1;

      await get().updateProgress({
        experience_points: newExperience,
        level: newLevel,
        last_activity_date: new Date().toISOString().split('T')[0]
      });
    }

    // Create reward
    await supabase
      .from('user_rewards')
      .insert([{
        user_id: user.id,
        reward_type: 'experience',
        reward_data: { amount: experienceGained, reason: 'Mood tracked' }
      }]);
  },

  writeJournal: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Award experience for journaling
    const experienceGained = 15;
    const { userProgress } = get();
    if (userProgress) {
      const newExperience = userProgress.experience_points + experienceGained;
      const newLevel = Math.floor(newExperience / 100) + 1;

      await get().updateProgress({
        experience_points: newExperience,
        level: newLevel,
        last_activity_date: new Date().toISOString().split('T')[0]
      });
    }

    // Create reward
    await supabase
      .from('user_rewards')
      .insert([{
        user_id: user.id,
        reward_type: 'experience',
        reward_data: { amount: experienceGained, reason: 'Journal entry' }
      }]);
  },

  claimReward: async (rewardId) => {
    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({ claimed: true })
        .eq('id', rewardId);

      if (error) throw error;

      // Remove from unclaimed rewards
      set({
        unclaimedRewards: get().unclaimedRewards.filter(r => r.id !== rewardId)
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  },

  clearNewBadges: () => {
    set({ newBadges: [] });
  }
}));