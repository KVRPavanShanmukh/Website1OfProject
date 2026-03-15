import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Trophy, Play, CheckCircle2, XCircle, MemoryStick } from 'lucide-react';
import { cn } from '../lib/utils';

interface SpeedCodingProps {
  onComplete: (stats: { timeTaken: number; memoryUsed: number; problemsSolved: number }) => void;
}

export const SpeedCoding: React.FC<SpeedCodingProps> = ({ onComplete }) => {
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
    <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
      {!isActive && solvedCount === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-yellow-500">
            <Zap className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black mb-4">Speed Coding Mode</h3>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            Solve 3 problems as fast as you can. Your time and memory usage will be ranked on the global leaderboard.
          </p>
          <button 
            onClick={() => setIsActive(true)}
            className="px-12 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all flex items-center gap-3 mx-auto"
          >
            <Play className="w-5 h-5" />
            Start Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-2xl text-red-400">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-red-500">{formatTime(timeLeft)}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Remaining</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-xl font-black text-blue-400">{solvedCount}/3</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Solved</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <div 
                key={i}
                className={cn(
                  "p-6 rounded-3xl border transition-all",
                  i === currentProblem ? "bg-blue-500/10 border-blue-500/50" : 
                  i < solvedCount ? "bg-emerald-500/10 border-emerald-500/50" : "bg-white/5 border-white/5 opacity-50"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest",
                    p.difficulty === 'Easy' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
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
                    className="w-full py-2 bg-blue-500 text-black rounded-xl text-xs font-bold hover:bg-blue-400 transition-all"
                  >
                    Submit Solution
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MemoryStick className="w-5 h-5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Simulated Memory Usage: <span className="text-white font-mono">12.4 MB</span></span>
            </div>
            <button onClick={handleFinish} className="text-xs font-bold text-red-500 hover:underline">Give Up</button>
          </div>
        </div>
      )}
    </div>
  );
};
