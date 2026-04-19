import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, ExternalLink, Activity, Trophy, Award, Zap, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CodingProfile } from '../services/progress';

interface CodingProfileTrackerProps {
  profiles: CodingProfile[];
  onAdd: (platform: string, usernameOrUrl: string) => void;
  onRemove: (platform: string) => void;
  onRefresh: (platform: string) => void;
  isDarkMode: boolean;
}

export const CodingProfileTracker: React.FC<CodingProfileTrackerProps> = ({
  profiles,
  onAdd,
  onRemove,
  onRefresh,
  isDarkMode
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<CodingProfile['platform']>('LeetCode');
  const [newUsername, setNewUsername] = useState('');

  const handleAdd = () => {
    if (newUsername.trim()) {
      onAdd(newPlatform, newUsername);
      setNewUsername('');
      setIsAdding(false);
    }
  };

  const PLATFORMS = ['HackerRank', 'CodeChef', 'LeetCode', 'Codeforces'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Coding Activity Tracker
          </h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">Sync your competitive coding stats</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-3xl border-blue-500/20 bg-blue-500/5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Platform</label>
              <select 
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as CodingProfile['platform'])}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Username / URL</label>
              <input 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAdd}
              className="flex-1 bg-blue-500 text-black font-bold py-2 rounded-xl text-sm active:scale-95 transition-all"
            >
              Connect Profile
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-white/5 text-zinc-400 font-bold rounded-xl text-sm hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <motion.div 
            key={profile.platform}
            layoutId={profile.platform}
            className="glass p-6 rounded-[32px] border border-white/5 relative group hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-blue-400">
                  {profile.platform[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{profile.platform}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">{profile.usernameOrUrl}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => onRefresh(profile.platform)}
                  className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onRemove(profile.platform)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {profile.stats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    Rating
                  </div>
                  <div className="text-sm font-black text-white">{profile.stats.rating || 'N/A'}</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Solved
                  </div>
                  <div className="text-sm font-black text-white">{profile.stats.problemsSolved || 0}</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-orange-500" />
                    Streak
                  </div>
                  <div className="text-sm font-black text-white">{profile.stats.submissionStreak || 0} days</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Award className="w-3 h-3 text-blue-500" />
                    Badges
                  </div>
                  <div className="text-sm font-black text-white">{profile.stats.badges || 0}</div>
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                </div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Fetching stats...</p>
              </div>
            )}
            
            <a 
              href={profile.usernameOrUrl.startsWith('http') ? profile.usernameOrUrl : `https://${profile.platform.toLowerCase()}.com/${profile.usernameOrUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        ))}

        {profiles.length === 0 && !isAdding && (
          <div className="col-span-full border-2 border-dashed border-white/5 rounded-[40px] py-12 flex flex-col items-center justify-center gap-4 group hover:border-blue-500/20 transition-all cursor-pointer" onClick={() => setIsAdding(true)}>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-zinc-500 group-hover:text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-zinc-500 font-bold text-sm">No profiles connected</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Monitor your competitive coding progress</p>
            </div>
          </div>
        )}
      </div>

      {profiles.length > 0 && (
        <div className="glass p-6 rounded-[32px] border border-blue-500/10 bg-blue-500/5">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-wider">AI Suggestions</h4>
           </div>
           
           <div className="space-y-4">
             <div className="flex gap-4">
               <div className="w-1 bg-blue-500 rounded-full shrink-0" />
               <div>
                  <div className="text-xs font-bold text-white mb-1">Focus Target</div>
                  <p className="text-xs text-zinc-400">Based on your activity, LeetCode "Dynamic Programming" needs work. Try solved 3 Medium problems today.</p>
               </div>
             </div>
             <div className="flex gap-4">
               <div className="w-1 bg-yellow-500 rounded-full shrink-0" />
               <div>
                  <div className="text-xs font-bold text-white mb-1">Contest Advisory</div>
                  <p className="text-xs text-zinc-400">Next Codeforces Round is in 2 days. Practice Binary Search to improve your rating performance.</p>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
