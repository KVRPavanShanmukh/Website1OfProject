import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Send, Trophy, ArrowRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeedbackProps {
  sessionData: any;
  onComplete: () => void;
  isDarkMode: boolean;
}

export const Feedback: React.FC<FeedbackProps> = ({ sessionData, onComplete, isDarkMode }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    // In a real app, send this to the backend
    console.log("Feedback submitted:", { rating, comment, sessionData });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 border-2 border-blue-500/20"
        >
          <Trophy className="w-12 h-12 text-blue-500" />
        </motion.div>
        <h2 className="text-4xl font-black mb-4">Feedback Captured!</h2>
        <p className="text-zinc-500 mb-12">
          Your insights are invaluable. We've summarized the session stats and sent a report to the host. 
          The mission roadmap has been updated with your participation.
        </p>
        <button 
          onClick={onComplete}
          className="px-12 py-4 bg-blue-500 text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
        >
          <Home className="w-5 h-5" />
          RETURN TO BASE
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 glass rounded-2xl border border-white/10 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
          Mission Complete
        </div>
        <h2 className="text-5xl font-black mb-4 tracking-tighter">Rate the Module</h2>
        <p className="text-zinc-500">How was your learning experience in the Teaching Room?</p>
      </div>

      <div className="w-full glass rounded-[3rem] p-10 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        
        <div className="flex justify-center gap-3 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                rating >= star 
                  ? "bg-blue-500 text-black scale-110 shadow-lg shadow-blue-500/20" 
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
              )}
            >
              <Star className={cn("w-8 h-8", rating >= star && "fill-current")} />
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="relative">
            <MessageSquare className="absolute top-4 left-4 w-5 h-5 text-zinc-500" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any specific highlights or technical blocks?"
              className="w-full bg-white/5 border border-white/5 rounded-3xl p-4 pl-12 text-sm min-h-[150px] focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full py-5 bg-blue-500 text-black font-black rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
            SUBMIT DATA SIGNAL
          </button>
        </div>
      </div>

      {sessionData && (
        <div className="mt-12 flex items-center gap-10 opacity-40">
           <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest mb-1 text-zinc-500">Duration</div>
              <div className="text-xl font-black">{(sessionData.duration / 60000).toFixed(1)}m</div>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest mb-1 text-zinc-500">Crew</div>
              <div className="text-xl font-black">{sessionData.participants.length}</div>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest mb-1 text-zinc-500">Signals</div>
              <div className="text-xl font-black">{sessionData.messages.length}</div>
           </div>
        </div>
      )}
    </div>
  );
};
