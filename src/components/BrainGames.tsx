import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Brain, Clock, Timer, Trophy, 
  RotateCcw, Play, Pause, ChevronRight,
  Target, Eye, MousePointer2, Lock,
  Flame, Sparkles, BarChart3, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { progressService, GameStatus, BrainStats } from '../services/progress';

import { Game2048 } from './games/Game2048';
import { GameMemory } from './games/GameMemory';
import { GameSnake } from './games/GameSnake';

interface BrainGamesProps {
  isDarkMode: boolean;
  gameStatuses: { [gameId: string]: GameStatus };
  brainStats: BrainStats;
  onGameComplete: (gameId: string, score: number) => void;
}

type GameType = '2048' | 'memory' | 'snake' | 'reaction' | 'number-recall' | 'pattern-recall' | 'logic' | 'focus-tap';

const GAME_METADATA: Record<GameType, { title: string, description: string, icon: any, color: string }> = {
  '2048': { title: '2048', description: 'Merge tiles to reach 2048.', icon: Zap, color: 'text-orange-500' },
  'memory': { title: 'Memory Match', description: 'Find all matching pairs.', icon: Eye, color: 'text-blue-500' },
  'snake': { title: 'Code Snake', description: 'Collect points without crashing.', icon: BarChart3, color: 'text-emerald-500' },
  'reaction': { title: 'Reaction Test', description: 'Tap as fast as you can.', icon: MousePointer2, color: 'text-green-500' },
  'number-recall': { title: 'Number Recall', description: 'Remember the sequence.', icon: Brain, color: 'text-purple-500' },
  'pattern-recall': { title: 'Pattern Recall', description: 'Replicate the pattern.', icon: Target, color: 'text-red-500' },
  'logic': { title: 'Logic Puzzle', description: 'Solve the digital riddle.', icon: Trophy, color: 'text-yellow-500' },
  'focus-tap': { title: 'Focus Tap', description: 'Tap targets in sequence.', icon: Timer, color: 'text-pink-500' }
};

export const BrainGames: React.FC<BrainGamesProps> = ({ 
  isDarkMode, 
  gameStatuses, 
  brainStats,
  onGameComplete
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  const formatCooldown = (ms: number) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const getCooldownStatus = (gameId: string) => {
    const status = gameStatuses[gameId];
    if (!status) return { onCooldown: false, chancesLeft: 3 };
    const onCooldown = status.cooldownUntil > Date.now();
    return {
      onCooldown,
      chancesLeft: onCooldown ? 0 : 3 - status.chancesUsed,
      remaining: status.cooldownUntil - Date.now()
    };
  };

  const GameCard = ({ type }: { type: GameType }) => {
    const meta = GAME_METADATA[type];
    const status = getCooldownStatus(type);
    const Icon = meta.icon;

    return (
      <motion.div 
        layoutId={type}
        onClick={() => !status.onCooldown && setSelectedGame(type)}
        className={cn(
          "glass p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden group",
          status.onCooldown 
            ? "border-red-500/20 opacity-80" 
            : (isDarkMode ? "border-white/5 hover:border-blue-500/30" : "border-black/5 hover:border-blue-500/20")
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-2xl bg-white/5", meta.color)}>
            <Icon className="w-6 h-6" />
          </div>
          {status.onCooldown ? (
            <div className="flex flex-col items-end">
              <Lock className="w-4 h-4 text-red-500 mb-1" />
              <span className="text-[10px] font-black text-red-400 font-mono">{formatCooldown(status.remaining)}</span>
            </div>
          ) : (
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i <= status.chancesLeft ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10"
                  )} 
                />
              ))}
            </div>
          )}
        </div>

        <h4 className="font-bold text-lg mb-1">{meta.title}</h4>
        <p className="text-xs text-zinc-500 mb-4">{meta.description}</p>

        <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
             Best: {gameStatuses[type]?.bestScore || 0}
           </span>
           <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-all">
             <ChevronRight className="w-4 h-4" />
           </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] border border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h5 className="font-black text-sm uppercase tracking-widest">Brain Streak</h5>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{brainStats.streak}</span>
            <span className="text-zinc-500 text-xs font-bold">Days</span>
          </div>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-2">Daily Consistency Reward Enabled</p>
        </div>

        <div className="glass p-8 rounded-[40px] border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h5 className="font-black text-sm uppercase tracking-widest">Energy Score</h5>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{brainStats.energyScore.toFixed(0)}</span>
            <span className="text-zinc-500 text-xs font-bold">/ 100</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${brainStats.energyScore}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] border border-purple-500/20 bg-purple-500/5">
           <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <h5 className="font-black text-sm uppercase tracking-widest">Cognitive Load</h5>
          </div>
          <p className="text-xs text-zinc-400 mb-2">High focus suggested for today. Your memory performance is peaking.</p>
          <div className="flex gap-1">
             {[1,2,3,4,5].map(i => <div key={i} className={cn("flex-1 h-1 rounded-full", i <= 4 ? "bg-purple-500" : "bg-white/5")} />)}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
             <Brain className="w-8 h-8 text-blue-500" />
             Training Center
          </h2>
          <p className="text-zinc-500 max-w-xl">Sharpen your cognitive skills with daily puzzles. Each game allows 3 attempts every 12 hours.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(Object.keys(GAME_METADATA) as GameType[]).map(type => (
            <GameCard key={type} type={type} />
          ))}
        </div>
      </div>

      {/* Game Modal */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGame(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
             />
             
             <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass w-full max-w-4xl max-h-full overflow-y-auto rounded-[48px] border border-white/10 p-8 sm:p-12 text-center"
             >
                <button 
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all z-[120]"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                  <div className={cn("w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6", GAME_METADATA[selectedGame].color)}>
                    {React.createElement(GAME_METADATA[selectedGame].icon, { className: 'w-10 h-10' })}
                  </div>
                  <h3 className="text-4xl font-black mb-2">{GAME_METADATA[selectedGame].title}</h3>
                  <p className="text-zinc-500">{GAME_METADATA[selectedGame].description}</p>
                </div>

                <div className="bg-black/40 rounded-[32px] border border-white/5 p-6 sm:p-12 mb-8 min-h-[500px] flex items-center justify-center">
                   {selectedGame === '2048' ? (
                     <Game2048 onComplete={(s) => onGameComplete('2048', s)} isDarkMode={isDarkMode} />
                   ) : selectedGame === 'memory' ? (
                     <GameMemory onComplete={(s) => onGameComplete('memory', s)} isDarkMode={isDarkMode} />
                   ) : selectedGame === 'snake' ? (
                     <GameSnake onComplete={(s) => onGameComplete('snake', s)} isDarkMode={isDarkMode} />
                   ) : (
                     <div className="text-zinc-600 italic font-mono uppercase tracking-[0.2em] py-20">
                       [ Game logic for {selectedGame} loads here ]
                     </div>
                   )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                   <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Daily attempts are refreshed every 12 hours. Reach new High Scores to earn Points.</p>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
