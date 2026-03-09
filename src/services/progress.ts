export interface Problem {
  id: string;
  title: string;
  url: string;
  platform: string;
  completed: boolean;
  completedAt?: number;
  category?: 'interview' | 'related';
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

export interface Progress {
  userName: string;
  completedTopics: string[]; // For search-based topics
  lastSearched: string[];
  customTopics: CustomTopic[];
  completionHistory: CompletionEntry[];
}

export const progressService = {
  getProgress: (): Progress => {
    const data = localStorage.getItem('cs_scholar_progress');
    const defaultProgress: Progress = { 
      userName: '', 
      completedTopics: [], 
      lastSearched: [], 
      customTopics: [],
      completionHistory: []
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
    } else {
      p.completedTopics.push(topic);
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
  }
};
