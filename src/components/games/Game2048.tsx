import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Game2048Props {
  onComplete: (score: number) => void;
  isDarkMode: boolean;
}

export const Game2048: React.FC<Game2048Props> = ({ onComplete, isDarkMode }) => {
  const [grid, setGrid] = useState<number[][]>(() => {
    const newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    // Initial 2 tiles
    const cells = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells.push({ r, c });
    for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * cells.length);
        const { r, c } = cells.splice(idx, 1)[0];
        newGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
    }
    return newGrid;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = () => {
    const newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    const cells = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells.push({ r, c });
    for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * cells.length);
        const { r, c } = cells.splice(idx, 1)[0];
        newGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
    }
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  };

  const rotate = (matrix: number[][]) => {
    const n = matrix.length;
    const res = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        res[j][n - 1 - i] = matrix[i][j];
      }
    }
    return res;
  };

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    let newGrid = JSON.parse(JSON.stringify(grid));
    let moved = false;
    let addedScore = 0;

    let rotations = 0;
    if (direction === 'up') rotations = 3;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) newGrid = rotate(newGrid);

    for (let i = 0; i < 4; i++) {
      let row = newGrid[i].filter((v: number) => v !== 0);
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          addedScore += row[j];
          row.splice(j + 1, 1);
          moved = true;
        }
      }
      while (row.length < 4) row.push(0);
      if (JSON.stringify(newGrid[i]) !== JSON.stringify(row)) moved = true;
      newGrid[i] = row;
    }

    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotate(newGrid);

    if (moved) {
      const emptyCells = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (newGrid[r][c] === 0) emptyCells.push({ r, c });
        }
      }
      if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        newGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
      }
      setGrid(newGrid);
      setScore(s => s + addedScore);
      
      // Check game over
      if (emptyCells.length <= 1) {
          let canMove = false;
          for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                  if (c < 3 && newGrid[r][c] === newGrid[r][c+1]) canMove = true;
                  if (r < 3 && newGrid[r][c] === newGrid[r+1][c]) canMove = true;
              }
          }
          if (!canMove) {
              setGameOver(true);
              onComplete(score + addedScore);
          }
      }
    }
  }, [grid, gameOver, score, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') move('up');
        if (e.key === 'ArrowDown') move('down');
        if (e.key === 'ArrowLeft') move('left');
        if (e.key === 'ArrowRight') move('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      2: isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600',
      4: isDarkMode ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-300 text-zinc-700',
      8: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      16: 'bg-orange-500/40 text-orange-500 border-orange-500/50',
      32: 'bg-orange-500/60 text-white border-orange-500/70',
      64: 'bg-orange-500 text-white border-white/20',
      128: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      256: 'bg-yellow-500/40 text-yellow-500 border-yellow-500/50',
      512: 'bg-yellow-500/60 text-white border-yellow-500/70',
      1024: 'bg-yellow-500 text-white border-white/20 shadow-[0_0_20px_rgba(234,179,8,0.3)]',
      2048: 'bg-yellow-400 text-black border-white/40 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse',
    };
    return colors[value] || (isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[400px] mb-8">
        <div className="glass px-6 py-3 rounded-2xl border border-white/10">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Score</div>
          <div className="text-2xl font-black">{score}</div>
        </div>
        <button 
          onClick={initGame}
          className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      <div className={cn(
        "aspect-square w-full max-w-[400px] rounded-3xl p-4 grid grid-cols-4 gap-4 relative transition-colors",
        isDarkMode ? "bg-zinc-900 shadow-2xl" : "bg-zinc-100 shadow-inner"
      )}>
        {grid.map((row, r) => row.map((value, c) => (
          <motion.div
            key={`${r}-${c}`}
            layout
            initial={false}
            animate={{ scale: value === 0 ? 1 : [1, 1.1, 1] }}
            className={cn(
              "rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-200 border",
              value === 0 
                ? (isDarkMode ? "bg-zinc-800/20 border-white/5" : "bg-white/40 border-black/5") 
                : getTileColor(value)
            )}
          >
            {value !== 0 && value}
          </motion.div>
        )))}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-center p-8 z-10">
            <Trophy className="w-16 h-16 text-yellow-500 mb-6" />
            <h4 className="text-3xl font-black mb-2">Game Over!</h4>
            <p className="text-zinc-400 mb-8">You scored {score} points. Practice makes perfect!</p>
            <button 
              onClick={initGame}
              className="px-10 py-4 bg-blue-500 text-black font-black rounded-2xl hover:bg-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-8 md:hidden">
        <div />
        <button onClick={() => move('up')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronUp className="w-6 h-6" /></button>
        <div />
        <button onClick={() => move('left')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronLeft className="w-6 h-6" /></button>
        <button onClick={() => move('down')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronDown className="w-6 h-6" /></button>
        <button onClick={() => move('right')} className="p-4 bg-white/5 rounded-xl border border-white/10"><ChevronRight className="w-6 h-6" /></button>
      </div>
    </div>
  );
};
