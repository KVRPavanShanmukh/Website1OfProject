import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { cn } from '../lib/utils';

type Algorithm = 'Binary Search' | 'DP (Fibonacci)' | 'Recursion (Factorial)' | 'LinkedList' | 'Stack/Queue';

export const ConceptVisualizer: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>('Binary Search');
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Binary Search State
  const [bsArray] = useState([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
  const [bsTarget] = useState(13);
  const [bsRange, setBsRange] = useState({ low: 0, high: 9, mid: -1 });

  // DP State
  const [dpTable, setDpTable] = useState<number[]>(new Array(10).fill(0));

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        handleNext();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, step, selectedAlgo]);

  const handleNext = () => {
    if (selectedAlgo === 'Binary Search') {
      const { low, high } = bsRange;
      if (low <= high) {
        const mid = Math.floor((low + high) / 2);
        setBsRange(prev => ({ ...prev, mid }));
        if (bsArray[mid] === bsTarget) {
          setIsPlaying(false);
        } else if (bsArray[mid] < bsTarget) {
          setBsRange(prev => ({ ...prev, low: mid + 1 }));
        } else {
          setBsRange(prev => ({ ...prev, high: mid - 1 }));
        }
        setStep(s => s + 1);
      } else {
        setIsPlaying(false);
      }
    } else if (selectedAlgo === 'DP (Fibonacci)') {
      if (step < 9) {
        setDpTable(prev => {
          const next = [...prev];
          if (step === 0) next[0] = 0;
          else if (step === 1) next[1] = 1;
          else next[step] = next[step - 1] + next[step - 2];
          return next;
        });
        setStep(s => s + 1);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
    setBsRange({ low: 0, high: 9, mid: -1 });
    setDpTable(new Array(10).fill(0));
  };

  return (
    <div className="glass p-8 rounded-[40px] border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black flex items-center gap-4">
          <Play className="w-8 h-8 text-blue-500" />
          Concept Visualizer
        </h3>
        <div className="flex gap-2">
          {(['Binary Search', 'DP (Fibonacci)'] as Algorithm[]).map(algo => (
            <button
              key={algo}
              onClick={() => { setSelectedAlgo(algo); reset(); }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                selectedAlgo === algo ? "bg-blue-500 text-black" : "bg-white/5 text-zinc-500 hover:bg-white/10"
              )}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black/40 rounded-3xl p-12 border border-white/5 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
        {selectedAlgo === 'Binary Search' && (
          <div className="flex gap-2 items-end h-32">
            {bsArray.map((val, i) => {
              const isLow = i === bsRange.low;
              const isHigh = i === bsRange.high;
              const isMid = i === bsRange.mid;
              const isTarget = val === bsTarget && isMid;

              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      scale: isMid ? 1.2 : 1,
                      backgroundColor: isTarget ? '#10b981' : isMid ? '#3b82f6' : (i >= bsRange.low && i <= bsRange.high) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: isMid ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                    }}
                    className="w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-lg"
                  >
                    {val}
                  </motion.div>
                  <div className="h-6 flex flex-col items-center">
                    {isLow && <span className="text-[8px] text-emerald-500 font-bold">LOW</span>}
                    {isMid && <span className="text-[8px] text-blue-500 font-bold">MID</span>}
                    {isHigh && <span className="text-[8px] text-red-500 font-bold">HIGH</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedAlgo === 'DP (Fibonacci)' && (
          <div className="grid grid-cols-5 gap-4">
            {dpTable.map((val, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: val > 0 || i <= step ? 1 : 0.8, 
                  opacity: i <= step ? 1 : 0.2,
                  backgroundColor: i === step - 1 ? '#3b82f6' : 'rgba(255,255,255,0.05)'
                }}
                className="w-20 h-20 rounded-2xl border border-white/10 flex flex-col items-center justify-center"
              >
                <span className="text-[10px] text-zinc-500 mb-1">dp[{i}]</span>
                <span className="text-xl font-black">{val}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          <button onClick={reset} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-8 py-3 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all flex items-center gap-2"
          >
            {isPlaying ? 'Pause' : 'Play Animation'}
          </button>
          <button onClick={handleNext} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex gap-4">
        <Info className="w-6 h-6 text-blue-400 shrink-0" />
        <div>
          <h4 className="font-bold text-sm mb-1">How it works</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {selectedAlgo === 'Binary Search' ? 
              "Binary search works by repeatedly dividing the search interval in half. If the target value is less than the middle element, it narrows the interval to the lower half. Otherwise, it narrows it to the upper half." :
              "Dynamic Programming (DP) solves complex problems by breaking them down into simpler subproblems. In Fibonacci, we store the results of previous calculations in a table to avoid redundant work."
            }
          </p>
        </div>
      </div>
    </div>
  );
};
