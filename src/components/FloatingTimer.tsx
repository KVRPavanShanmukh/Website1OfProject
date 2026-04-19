import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingTimerProps {
  timeLeft: number;
  isActive: boolean;
  onToggle: () => void;
  onExpand: () => void;
  visible: boolean;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
  timeLeft, 
  isActive, 
  onToggle, 
  onExpand,
  visible 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-24 right-8 z-[90] glass p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4 bg-black/60 backdrop-blur-xl"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Focusing</span>
            <span className="text-xl font-black font-mono text-white">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onToggle}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button 
              onClick={onExpand}
              className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-all text-blue-400"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
