import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskCompletionAnimationProps {
  show: boolean;
  onComplete: () => void;
}

const TaskCompletionAnimation: React.FC<TaskCompletionAnimationProps> = ({ show, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 1500);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 1,
                scale: 0,
                x: 0,
                y: 0,
                rotate: 0
              }}
              animate={{
                opacity: 0,
                scale: 1,
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][i % 5]
              }}
            />
          ))}
          
          {/* Main celebration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl mb-2"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-gray-800 dark:text-white"
            >
              Task Complete!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              +10 XP earned
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskCompletionAnimation;