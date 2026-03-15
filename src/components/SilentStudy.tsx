import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Volume2, VolumeX, Timer, Play, Pause, RotateCcw, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SilentStudyProps {
  onClose: () => void;
}

export const SilentStudy: React.FC<SilentStudyProps> = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes Pomodoro
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundType, setSoundType] = useState<'rain' | 'waves' | 'lofi'>('rain');

  useEffect(() => {
    let timer: any;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-2xl w-full text-center space-y-12">
        <motion.div
          animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative"
        >
          <div className="text-[120px] font-black font-mono tracking-tighter text-white/20 select-none">
            {formatTime(timeLeft)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl font-black font-mono tracking-tighter text-white">
              {formatTime(timeLeft)}
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={() => setTimeLeft(1500)}
            className="p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all text-zinc-500"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all text-zinc-500"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex gap-4 justify-center">
          {(['rain', 'waves', 'lofi'] as const).map(sound => (
            <button
              key={sound}
              onClick={() => setSoundType(sound)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold transition-all border",
                soundType === sound ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30"
              )}
            >
              {sound.toUpperCase()}
            </button>
          ))}
        </div>

        <p className="text-zinc-600 text-sm font-medium tracking-widest uppercase">
          {isActive ? "Focusing..." : "Ready to focus?"}
        </p>
      </div>

      <div className="absolute bottom-12 left-12 flex items-center gap-4 text-zinc-700">
        <Moon className="w-5 h-5" />
        <span className="text-xs font-bold tracking-widest uppercase">Silent Study Mode</span>
      </div>
    </motion.div>
  );
};
