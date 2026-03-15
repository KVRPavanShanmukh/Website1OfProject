import { format } from 'date-fns';

export interface Problem {
  id: string;
  title: string;
  url: string;
  platform: string;
  completed: boolean;
  completedAt?: number;
  category?: 'interview' | 'related' | 'best';
  reason?: string;
}

export interface CustomTopic {
  id: string;
  title: string;
  completed: boolean;
  problems: Problem[];
}

export interface CompletionEntry {
  id: string;
  type: 'problem' | 'topic';
  title: string;
  timestamp: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface Activity {
  id: string;
  type: 'problem_solved' | 'topic_completed' | 'streak_milestone' | 'friend_added' | 'referral';
  message: string;
  timestamp: number;
  userName: string;
}

export interface Friend {
  userName: string;
  status: 'pending' | 'accepted';
}

export interface Challenge {
  id: string;
  from: string;
  problems: Problem[];
  timeLimit: number; // in minutes
  status: 'pending' | 'completed' | 'failed';
  score?: number;
  timestamp: number;
}

export interface SpeedCodingStat {
  challengeId: string;
  timeTaken: number;
  memoryUsed: number;
  problemsSolved: number;
  timestamp: number;
}

export interface Progress {
  userName: string;
  completedTopics: string[]; // For search-based topics
  lastSearched: string[];
  customTopics: CustomTopic[];
  completionHistory: CompletionEntry[];
  // Social & Engagement
  referralCode: string;
  referredFriends: string[];
  friends: Friend[];
  badges: Badge[];
  streak: {
    current: number;
    lastActivity: number;
    best: number;
  };
  activityFeed: Activity[];
  points: number;
  // New Features
  heatmap: { [date: string]: number }; // YYYY-MM-DD -> count
  speedCodingStats: SpeedCodingStat[];
  challenges: Challenge[];
  lastRevisionCheck: number;
}

export const progressService = {
  getProgress: (): Progress => {
    const data = localStorage.getItem('cs_scholar_progress');
    const defaultProgress: Progress = { 
      userName: '', 
      completedTopics: [], 
      lastSearched: [], 
      customTopics: [],
      completionHistory: [],
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      referredFriends: [],
      friends: [],
      badges: [],
      streak: {
        current: 0,
        lastActivity: 0,
        best: 0
      },
      activityFeed: [],
      points: 0,
      heatmap: {},
      speedCodingStats: [],
      challenges: [],
      lastRevisionCheck: 0
    };
    if (!data) return defaultProgress;
    try {
      const parsed = JSON.parse(data);
      const merged = { ...defaultProgress, ...parsed };
      // Ensure each topic has a problems array
      merged.customTopics = merged.customTopics.map((t: any) => ({
        ...t,
        problems: t.problems || []
      }));
      return merged;
    } catch (e) {
      return defaultProgress;
    }
  },
  saveProgress: (progress: Progress) => {
    localStorage.setItem('cs_scholar_progress', JSON.stringify(progress));
  },
  updateStreak: () => {
    const p = progressService.getProgress();
    const now = Date.now();
    const last = p.streak.lastActivity;
    
    if (last === 0) {
      p.streak.current = 1;
      p.streak.lastActivity = now;
    } else {
      const diff = now - last;
      const oneDay = 24 * 60 * 60 * 1000;
      const twoDays = 48 * 60 * 60 * 1000;

      if (diff < oneDay) {
        // Already active today, do nothing
      } else if (diff < twoDays) {
        // Consecutive day
        p.streak.current += 1;
        p.streak.lastActivity = now;
      } else {
        // Streak broken
        p.streak.current = 1;
        p.streak.lastActivity = now;
      }
    }

    if (p.streak.current > p.streak.best) {
      p.streak.best = p.streak.current;
    }

    // Check for streak badges
    if (p.streak.current === 7 && !p.badges.find(b => b.id === 'streak_7')) {
      progressService.addBadge(p, {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintained a 7-day learning streak',
        icon: 'Flame'
      });
    }

    progressService.saveProgress(p);
    return p;
  },
  addBadge: (p: Progress, badge: Omit<Badge, 'unlockedAt'>) => {
    p.badges.push({ ...badge, unlockedAt: Date.now() });
    p.activityFeed.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'streak_milestone',
      message: `Unlocked the "${badge.title}" badge!`,
      timestamp: Date.now(),
      userName: p.userName
    });
  },
  addPoints: (amount: number) => {
    const p = progressService.getProgress();
    p.points += amount;
    progressService.saveProgress(p);
    return p;
  },
  addFriendRequest: (friendName: string) => {
    const p = progressService.getProgress();
    if (!p.friends.find(f => f.userName === friendName)) {
      p.friends.push({ userName: friendName, status: 'pending' });
      progressService.saveProgress(p);
    }
    return p;
  },
  acceptFriendRequest: (friendName: string) => {
    const p = progressService.getProgress();
    p.friends = p.friends.map(f => 
      f.userName === friendName ? { ...f, status: 'accepted' } : f
    );
    p.activityFeed.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'friend_added',
      message: `Became friends with ${friendName}`,
      timestamp: Date.now(),
      userName: p.userName
    });
    progressService.saveProgress(p);
    return p;
  },
  useReferral: (code: string) => {
    const p = progressService.getProgress();
    // In a real app, we'd verify this code on the server
    p.points += 500;
    p.activityFeed.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'referral',
      message: `Joined using referral code: ${code}`,
      timestamp: Date.now(),
      userName: p.userName
    });
    progressService.saveProgress(p);
    return p;
  },
  setUserName: (name: string) => {
    const p = progressService.getProgress();
    p.userName = name;
    progressService.saveProgress(p);
    return p;
  },
  addCustomTopic: (title: string, problems: any[] = []) => {
    const p = progressService.getProgress();
    const newTopic: CustomTopic = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      problems: problems.map(prob => ({
        id: Math.random().toString(36).substr(2, 9),
        title: prob.title,
        url: prob.url,
        platform: prob.platform,
        category: prob.category,
        reason: prob.reason,
        completed: false
      }))
    };
    p.customTopics.push(newTopic);
    progressService.saveProgress(p);
    return p;
  },
  toggleProblemCompletion: (topicId: string, problemId: string) => {
    const p = progressService.getProgress();
    p.customTopics = p.customTopics.map(t => {
      if (t.id === topicId) {
        const updatedProblems = t.problems.map(prob => {
          if (prob.id === problemId) {
            const newCompleted = !prob.completed;
            if (newCompleted) {
              p.completionHistory.push({
                id: prob.id,
                type: 'problem',
                title: prob.title,
                timestamp: Date.now()
              });
            } else {
              p.completionHistory = p.completionHistory.filter(h => h.id !== prob.id);
            }
            return { ...prob, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined };
          }
          return prob;
        });
        // If all problems are completed, mark topic as completed
        const allCompleted = updatedProblems.length > 0 && updatedProblems.every(prob => prob.completed);
        if (allCompleted && !t.completed) {
          p.completionHistory.push({
            id: t.id,
            type: 'topic',
            title: t.title,
            timestamp: Date.now()
          });
        } else if (!allCompleted && t.completed) {
          p.completionHistory = p.completionHistory.filter(h => h.id !== t.id);
        }
        return { ...t, problems: updatedProblems, completed: allCompleted };
      }
      return t;
    });
    progressService.saveProgress(p);
    return p;
  },
  toggleCustomTopic: (id: string) => {
    const p = progressService.getProgress();
    p.customTopics = p.customTopics.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        // If topic is completed, mark all problems as completed
        const updatedProblems = t.problems.map(prob => ({ ...prob, completed: newCompleted }));
        
        if (newCompleted) {
          // Add topic to history
          if (!p.completionHistory.find(h => h.id === t.id)) {
            p.completionHistory.push({
              id: t.id,
              type: 'topic',
              title: t.title,
              timestamp: Date.now()
            });
          }
          // Add all problems to history if not already there
          updatedProblems.forEach(prob => {
            if (!p.completionHistory.find(h => h.id === prob.id)) {
              p.completionHistory.push({
                id: prob.id,
                type: 'problem',
                title: prob.title,
                timestamp: Date.now()
              });
            }
          });
        } else {
          // Remove topic and its problems from history
          p.completionHistory = p.completionHistory.filter(h => h.id !== t.id && !t.problems.find(p => p.id === h.id));
        }
        
        return { ...t, completed: newCompleted, problems: updatedProblems };
      }
      return t;
    });
    progressService.saveProgress(p);
    return p;
  },
  deleteCustomTopic: (id: string) => {
    const p = progressService.getProgress();
    p.customTopics = p.customTopics.filter(t => t.id !== id);
    progressService.saveProgress(p);
    return p;
  },
  toggleTopic: (topic: string) => {
    const p = progressService.getProgress();
    if (p.completedTopics.includes(topic)) {
      p.completedTopics = p.completedTopics.filter(t => t !== topic);
      p.completionHistory = p.completionHistory.filter(h => h.id !== topic);
    } else {
      p.completedTopics.push(topic);
      p.completionHistory.push({
        id: topic,
        type: 'topic',
        title: topic,
        timestamp: Date.now()
      });
    }
    progressService.saveProgress(p);
    return p;
  },
  addSearch: (concept: string) => {
    const p = progressService.getProgress();
    if (!p.lastSearched.includes(concept)) {
      p.lastSearched = [concept, ...p.lastSearched].slice(0, 10);
      progressService.saveProgress(p);
    }
    return p;
  },
  updateHeatmap: (date?: string) => {
    const p = progressService.getProgress();
    const d = date || format(new Date(), 'yyyy-MM-dd');
    p.heatmap[d] = (p.heatmap[d] || 0) + 1;
    progressService.saveProgress(p);
    return p;
  },
  addSpeedCodingStat: (stat: SpeedCodingStat) => {
    const p = progressService.getProgress();
    p.speedCodingStats.push(stat);
    p.points += stat.problemsSolved * 100;
    progressService.saveProgress(p);
    return p;
  },
  sendChallenge: (friendName: string, problems: Problem[], timeLimit: number) => {
    const p = progressService.getProgress();
    // In a real app, we'd send this to the friend's account via backend
    // For now, we'll just simulate it or add it to a "sent" list if we had one
    return p;
  },
  receiveChallenge: (challenge: Challenge) => {
    const p = progressService.getProgress();
    p.challenges.push(challenge);
    progressService.saveProgress(p);
    return p;
  },
  getRevisionProblems: () => {
    const p = progressService.getProgress();
    const now = Date.now();
    const twentyDays = 20 * 24 * 60 * 60 * 1000;
    
    const revisionNeeded: { topicTitle: string; problem: Problem }[] = [];
    
    p.customTopics.forEach(topic => {
      topic.problems.forEach(prob => {
        if (prob.completed && prob.completedAt && (now - prob.completedAt > twentyDays)) {
          revisionNeeded.push({ topicTitle: topic.title, problem: prob });
        }
      });
    });
    
    return revisionNeeded;
  }
};
