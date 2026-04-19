import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Trophy, Pause, Play } from 'lucide-react';

interface GameSnakeProps {
  onComplete: (score: number) => void;
  isDarkMode: boolean;
}

const GRID_SIZE = 20;

export const GameSnake: React.FC<GameSnakeProps> = ({ onComplete, isDarkMode }) => {
  const [snake, setSnake] = useState<{ x: number, y: number }[]>([]);
  const [food, setFood] = useState<{ x: number, y: number }>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  const initGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    setDirection('UP');
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused || snake.length === 0) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check collisions
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || newSnake.some(s => s.x === head.x && s.y === head.y)) {
      setIsGameOver(true);
      onComplete(score);
      return;
    }

    newSnake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 10);
      setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, isGameOver, isPaused, food, score, onComplete]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[400px] mb-8">
        <div className="glass px-6 py-3 rounded-2xl border border-white/10">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Score</div>
          <div className="text-2xl font-black">{score}</div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          <button 
            onClick={initGame}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className={cn(
        "aspect-square w-full max-w-[400px] rounded-3xl relative overflow-hidden transition-colors border-4",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
      )}>
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-20">
          {Array(400).fill(0).map((_, i) => (
            <div key={i} className="border-[0.5px] border-black/5 dark:border-white/5" />
          ))}
        </div>

        {/* Snake Body */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1/20 h-1/20 transition-all duration-150 rounded-sm z-20",
              i === 0 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-blue-500/60"
            )}
            style={{
              left: `${(segment.x / GRID_SIZE) * 100}%`,
              top: `${(segment.y / GRID_SIZE) * 100}%`,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute w-1/20 h-1/20 bg-red-500 rounded-full z-10 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
          style={{
            left: `${(food.x / GRID_SIZE) * 100}%`,
            top: `${(food.y / GRID_SIZE) * 100}%`,
          }}
        />

        {(isGameOver || isPaused) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-8 z-30">
            {isGameOver ? (
              <>
                <Trophy className="w-16 h-16 text-yellow-500 mb-6" />
                <h4 className="text-3xl font-black mb-2">Crash!</h4>
                <p className="text-zinc-400 mb-8">Final Score: {score}</p>
              </>
            ) : (
              <>
                <Pause className="w-16 h-16 text-blue-500 mb-6" />
                <h4 className="text-3xl font-black mb-2">Paused</h4>
                <p className="text-zinc-400 mb-8">Take a breath, then resume the mission.</p>
              </>
            )}
            <button 
              onClick={isGameOver ? initGame : () => setIsPaused(false)}
              className="px-10 py-4 bg-blue-500 text-black font-black rounded-2xl hover:bg-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {isGameOver ? 'Try Again' : 'Resume'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-8 md:hidden">
        <div />
        <button onClick={() => setDirection('UP')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronUp className="w-6 h-6" /></button>
        <div />
        <button onClick={() => setDirection('LEFT')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronLeft className="w-6 h-6" /></button>
        <button onClick={() => setDirection('DOWN')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronDown className="w-6 h-6" /></button>
        <button onClick={() => setDirection('RIGHT')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronRight className="w-6 h-6" /></button>
      </div>
    </div>
  );
};
