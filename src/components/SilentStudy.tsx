import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Volume2, VolumeX, Timer, Play, Pause, RotateCcw, X, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface SilentStudyProps {
  onBack: () => void;
  isDarkMode?: boolean;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  soundType: 'rain' | 'waves' | 'lofi';
  setSoundType: (val: 'rain' | 'waves' | 'lofi') => void;
  volume: number;
  setVolume: (val: number) => void;
}

export const SilentStudy: React.FC<SilentStudyProps> = ({ 
  onBack, 
  isDarkMode = true,
  timeLeft,
  setTimeLeft,
  isActive,
  setIsActive,
  soundType,
  setSoundType,
  volume,
  setVolume
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SOUND_URLS = {
    rain: 'https://cdn.pixabay.com/audio/2021/08/09/audio_82c2196696.mp3',
    waves: 'https://cdn.pixabay.com/audio/2022/03/10/audio_b3eaac5e16.mp3',
    lofi: 'https://cdn.pixabay.com/audio/2022/05/27/audio_180873748b.mp3'
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(SOUND_URLS[soundType]);
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    audio.src = SOUND_URLS[soundType];
    audio.load();
    
    if (isActive && !isMuted) {
      audio.play().catch(e => console.log("Audio play failed:", e));
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [soundType, isActive, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

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
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 transition-colors duration-1000",
        isDarkMode ? "bg-black" : "bg-zinc-50"
      )}
    >
      <button 
        onClick={onBack}
        className={cn(
          "absolute top-8 left-8 px-6 py-3 rounded-2xl transition-all group flex items-center gap-2 font-bold",
          isDarkMode ? "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white" : "bg-black/5 text-zinc-500 hover:bg-black/10 hover:text-zinc-900"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
        BACK
      </button>

      <div className="max-w-2xl w-full text-center space-y-12">
        <motion.div
          animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative"
        >
          <div className={cn(
            "text-[120px] font-black font-mono tracking-tighter select-none transition-colors",
            isDarkMode ? "text-white/10" : "text-black/5"
          )}>
            {formatTime(timeLeft)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "text-8xl font-black font-mono tracking-tighter transition-colors",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={() => setTimeLeft(1500)}
            className={cn(
              "p-4 rounded-3xl transition-all",
              isDarkMode ? "bg-white/5 text-zinc-500 hover:bg-white/10" : "bg-black/5 text-zinc-500 hover:bg-black/10"
            )}
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95",
              isDarkMode 
                ? "bg-white text-black hover:scale-110 shadow-[0_0_50px_rgba(255,255,255,0.2)]" 
                : "bg-zinc-900 text-white hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.1)]"
            )}
          >
            {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-4 rounded-3xl transition-all",
              isDarkMode ? "bg-white/5 text-zinc-500 hover:bg-white/10" : "bg-black/5 text-zinc-500 hover:bg-black/10"
            )}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4 justify-center">
            {(['rain', 'waves', 'lofi'] as const).map(sound => (
              <button
                key={sound}
                onClick={() => setSoundType(sound)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-bold transition-all border",
                  soundType === sound 
                    ? (isDarkMode ? "bg-white text-black border-white" : "bg-zinc-900 text-white border-zinc-900") 
                    : (isDarkMode ? "bg-transparent text-zinc-500 border-white/10 hover:border-white/30" : "bg-transparent text-zinc-500 border-black/10 hover:border-black/30")
                )}
              >
                {sound.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full max-w-xs">
            <Volume2 className={cn("w-4 h-4", isDarkMode ? "text-zinc-500" : "text-zinc-400")} />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className={cn(
                "flex-1 h-1.5 rounded-full appearance-none cursor-pointer",
                isDarkMode ? "bg-white/10" : "bg-black/10"
              )}
            />
          </div>
        </div>

        <p className={cn("text-xs font-bold tracking-widest uppercase transition-colors", isDarkMode ? "text-zinc-600" : "text-zinc-400")}>
          {isActive ? "Focusing..." : "Ready to focus?"}
        </p>
      </div>

      <div className={cn("absolute bottom-12 left-12 flex items-center gap-4 transition-colors", isDarkMode ? "text-zinc-700" : "text-zinc-300")}>
        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        <span className="text-xs font-bold tracking-widest uppercase">Silent Study Mode</span>
      </div>
    </motion.div>
  );
};
