import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Zap, Heart, Star, Moon, Sun, Cloud, Music, Camera, RotateCcw, Trophy } from 'lucide-react';

interface GameMemoryProps {
  onComplete: (score: number) => void;
  isDarkMode: boolean;
}

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = ['Zap', 'Heart', 'Star', 'Moon', 'Sun', 'Cloud', 'Music', 'Camera'];

export const GameMemory: React.FC<GameMemoryProps> = ({ onComplete, isDarkMode }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const initGame = () => {
    const shuffledCards = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].icon === cards[second].icon) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);
        
        if (newCards.every(c => c.isMatched)) {
          setIsGameOver(true);
          onComplete(Math.max(10, 100 - moves));
        }
      } else {
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const getIcon = (name: string) => {
    const icons: Record<string, any> = { Zap, Heart, Star, Moon, Sun, Cloud, Music, Camera };
    const Icon = icons[name] || Zap;
    return <Icon className="w-8 h-8" />;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[400px] mb-8">
        <div className="glass px-6 py-3 rounded-2xl border border-white/10">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Moves</div>
          <div className="text-2xl font-black">{moves}</div>
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
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={cn(
              "rounded-xl flex items-center justify-center text-2xl transition-all duration-300 transform preserve-3d border",
              card.isFlipped || card.isMatched 
                ? "bg-blue-500 text-black rotate-y-180 border-blue-400" 
                : (isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-sm")
            )}
          >
            {(card.isFlipped || card.isMatched) && (
              <div className="rotate-y-180">
                {getIcon(card.icon)}
              </div>
            )}
          </button>
        ))}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-center p-8 z-10">
            <Trophy className="w-16 h-16 text-yellow-500 mb-6" />
            <h4 className="text-3xl font-black mb-2">Well Done!</h4>
            <p className="text-zinc-400 mb-8">You finished in {moves} moves. Great memory!</p>
            <button 
              onClick={initGame}
              className="px-10 py-4 bg-blue-500 text-black font-black rounded-2xl hover:bg-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
