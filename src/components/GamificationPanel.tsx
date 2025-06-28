import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore, BADGES } from '../stores/gamificationStore';
import { Trophy, Award, Gift, X, Zap, Flame } from 'lucide-react';
import { isToday, parseISO, differenceInHours } from 'date-fns';

const GamificationPanel = () => {
  const {
    userProgress,
    userBadges,
    unclaimedRewards,
    newBadges,
    loading,
    fetchUserProgress,
    claimReward,
    claimDailyStreak,
    clearNewBadges
  } = useGamificationStore();

  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  useEffect(() => {
    if (newBadges.length > 0) {
      setShowBadgeModal(true);
    }
  }, [newBadges]);

  if (loading || !userProgress) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  const experienceToNextLevel = (userProgress.level * 100) - userProgress.experience_points;
  const progressPercentage = ((userProgress.experience_points % 100) / 100) * 100;

  const earnedBadgeIds = userBadges.map(b => b.badge_id);
  const earnedBadges = BADGES.filter(badge => earnedBadgeIds.includes(badge.id));

  // 🟢 Daily Streak Logic
  const lastDate = userProgress.last_activity_date;
  const lastClaimDate = lastDate ? parseISO(lastDate) : null;
  const now = new Date();
  const hasClaimedToday = lastClaimDate ? isToday(lastClaimDate) : false;
  const hoursSinceLastClaim = lastClaimDate ? differenceInHours(now, lastClaimDate) : 999;

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold flex items-center">
            <Trophy className="mr-2" size={18} />
            Progress
          </h2>
          <div className="flex gap-2">
            {unclaimedRewards.length > 0 && (
              <button
                onClick={() => setShowRewardsModal(true)}
                className="relative p-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-full"
              >
                <Gift size={16} className="text-yellow-400" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unclaimedRewards.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowBadgeModal(true)}
              className="p-1 bg-white/10 hover:bg-white/20 rounded-full"
            >
              <Award size={16} />
            </button>
          </div>
        </div>

        {/* Level and Experience */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Level {userProgress.level}</span>
            <span className="text-xs text-white/70">
              {userProgress.experience_points} XP
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-white/70 mt-1">
            {experienceToNextLevel} XP to next level
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{userProgress.total_tasks_completed}</div>
            <div className="text-xs text-white/70">Tasks Completed</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold">{earnedBadges.length}</div>
            <div className="text-xs text-white/70">Badges Earned</div>
          </div>
        </div>

        {/* 🔥 Daily Streak */}
        <div className="bg-white/5 rounded-lg p-4 text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-orange-400 font-bold text-lg">
            <Flame size={20} />
            {userProgress.streak_days} Day Streak
          </div>
          <button
            disabled={hasClaimedToday}
            onClick={async () => {
              await claimDailyStreak();
              fetchUserProgress();
            }}
            className={`mt-2 w-full px-4 py-2 text-sm rounded-lg font-medium transition ${
              hasClaimedToday
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {hasClaimedToday
              ? `Come back in ${24 - hoursSinceLastClaim}h`
              : 'Claim Daily Streak'}
          </button>
        </div>

        {/* Recent Badges */}
        {earnedBadges.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Recent Badges</div>
            <div className="flex gap-2 overflow-x-auto">
              {earnedBadges.slice(-3).map((badge) => (
                <div
                  key={badge.id}
                  className={`${badge.color} rounded-lg p-2 min-w-[60px] text-center`}
                >
                  <div className="text-lg">{badge.icon}</div>
                  <div className="text-xs text-white font-medium">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals (unchanged) */}
      {/* New Badge Modal */}
      <AnimatePresence>
        {showBadgeModal && newBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2">New Badge Earned!</h3>
                {newBadges.map((badge) => (
                  <div key={badge.id} className="mb-4">
                    <div className={`${badge.color} rounded-lg p-4 mb-2`}>
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className="font-bold">{badge.name}</div>
                      <div className="text-sm opacity-90">{badge.description}</div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setShowBadgeModal(false);
                    clearNewBadges();
                  }}
                  className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Badges Modal */}
      <AnimatePresence>
        {showBadgeModal && newBadges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Badge Collection</h3>
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BADGES.map((badge) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-lg p-4 text-center transition-all ${
                        isEarned
                          ? `${badge.color} shadow-lg`
                          : 'bg-white/5 opacity-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{badge.icon}</div>
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-xs opacity-80 mt-1">{badge.description}</div>
                      {!isEarned && (
                        <div className="text-xs text-white/60 mt-2">
                          {badge.requirement.type === 'tasks' && `Complete ${badge.requirement.value} tasks`}
                          {badge.requirement.type === 'level' && `Reach level ${badge.requirement.value}`}
                          {badge.requirement.type === 'streak' && `${badge.requirement.value} day streak`}
                          {badge.requirement.type === 'mood_entries' && `Track mood ${badge.requirement.value} times`}
                          {badge.requirement.type === 'journal_entries' && `Write ${badge.requirement.value} entries`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewardsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Gift className="mr-2" size={20} />
                  Rewards
                </h3>
                <button
                  onClick={() => setShowRewardsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {unclaimedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white/10 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <Zap className="text-yellow-400 mr-3" size={20} />
                      <div>
                        <div className="font-medium">
                          +{reward.reward_data.amount} XP
                        </div>
                        <div className="text-sm text-white/70">
                          {reward.reward_data.reason}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => claimReward(reward.id)}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1 rounded-md text-sm"
                    >
                      Claim
                    </button>
                  </div>
                ))}
              </div>

              {unclaimedRewards.length === 0 && (
                <div className="text-center text-white/70 py-8">
                  No unclaimed rewards
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GamificationPanel;
