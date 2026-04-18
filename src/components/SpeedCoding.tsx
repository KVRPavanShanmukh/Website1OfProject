import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Trophy, Play, CheckCircle2, XCircle, MemoryStick } from 'lucide-react';
import { cn } from '../lib/utils';

interface SpeedCodingProps {
  onComplete: (stats: { timeTaken: number; memoryUsed: number; problemsSolved: number }) => void;
  isDarkMode?: boolean;
}

export const SpeedCoding: React.FC<SpeedCodingProps> = ({ onComplete, isDarkMode = true }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(0);
  
  const problems = [
    { title: "Two Sum", difficulty: "Easy", points: 100 },
    { title: "Reverse Linked List", difficulty: "Easy", points: 100 },
    { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", points: 200 }
  ];

  useEffect(() => {
    let timer: any;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleFinish = () => {
    setIsActive(false);
    onComplete({
      timeTaken: 1200 - timeLeft,
      memoryUsed: Math.floor(Math.random() * 50) + 10,
      problemsSolved: solvedCount
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "glass p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden",
      isDarkMode ? "border-white/5" : "border-black/5"
    )}>
      {!isActive && solvedCount === 0 ? (
        <div className="text-center py-12">
          <div className={cn(
            "w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-colors",
            isDarkMode ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-500/10 text-yellow-600"
          )}>
            <Zap className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black mb-4">Speed Coding Mode</h3>
          <p className={cn("mb-8 max-w-md mx-auto transition-colors", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>
            Solve 3 problems as fast as you can. Your time and memory usage will be ranked on the global leaderboard.
          </p>
          <button 
            onClick={() => setIsActive(true)}
            className={cn(
              "px-12 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 mx-auto shadow-xl active:scale-95",
              isDarkMode ? "bg-yellow-500 text-black hover:bg-yellow-400" : "bg-yellow-600 text-white hover:bg-yellow-700"
            )}
          >
            <Play className="w-5 h-5" />
            Start Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-500/10 text-red-600"
              )}>
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-red-500">{formatTime(timeLeft)}</div>
                <div className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>Time Remaining</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-xl font-black text-blue-400">{solvedCount}/3</div>
                <div className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>Solved</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <div 
                key={i}
                className={cn(
                  "p-6 rounded-3xl border transition-all",
                  i === currentProblem 
                    ? (isDarkMode ? "bg-blue-500/10 border-blue-500/50" : "bg-blue-500/5 border-blue-500/30") 
                    : i < solvedCount 
                      ? (isDarkMode ? "bg-emerald-500/10 border-emerald-500/50" : "bg-emerald-500/5 border-emerald-500/30") 
                      : (isDarkMode ? "bg-white/5 border-white/5 opacity-50" : "bg-black/5 border-black/5 opacity-50")
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest transition-colors",
                    p.difficulty === 'Easy' 
                      ? (isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 text-emerald-600") 
                      : (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-500/10 text-blue-600")
                  )}>
                    {p.difficulty}
                  </span>
                  {i < solvedCount && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
                <h4 className="font-bold text-sm mb-4">{p.title}</h4>
                {i === currentProblem && (
                  <button 
                    onClick={() => {
                      setSolvedCount(s => s + 1);
                      if (currentProblem < 2) setCurrentProblem(p => p + 1);
                      else handleFinish();
                    }}
                    className={cn(
                      "w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md",
                      isDarkMode ? "bg-blue-500 text-black hover:bg-blue-400" : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    Submit Solution
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={cn(
            "p-6 rounded-3xl border transition-all flex items-center justify-between",
            isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
          )}>
            <div className="flex items-center gap-3">
              <MemoryStick className={cn("w-5 h-5 transition-colors", isDarkMode ? "text-zinc-500" : "text-zinc-600")} />
              <span className={cn("text-xs transition-colors", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
                Simulated Memory Usage: <span className={cn("font-mono font-bold transition-colors", isDarkMode ? "text-white" : "text-zinc-900")}>12.4 MB</span>
              </span>
            </div>
            <button onClick={handleFinish} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest">Give Up</button>
          </div>
        </div>
      )}
    </div>
  );
};
