import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Video, Filter, SortDesc, Zap, Clock, 
  Eye, Star, ExternalLink, BookmarkPlus, Play,
  ChevronRight, Sparkles, TrendingUp, Award,
  CheckCircle2, Loader2, BookmarkCheck, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { searchTutorials } from '../services/gemini';
import { progressService, Tutorial } from '../services/progress';

interface TutorialsProps {
  isDarkMode: boolean;
}

const CATEGORIES = [
  "All", "Programming", "DSA", "AI / ML", "Web Development", 
  "Aptitude", "Interview Prep", "Productivity", "DevOps"
];

const SORT_OPTIONS = [
  "Most Popular", "Highest Rated", "Most Viewed", "Latest", "Beginner Friendly"
];

export function Tutorials({ isDarkMode }: TutorialsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('Most Popular');
  const [results, setResults] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(progressService.getProgress());

  useEffect(() => {
    setSavedIds(new Set(progress.savedTutorials.map(t => t.id)));
  }, [progress]);

  // Initial trending tutorials - REMOVED for Priority 4 requirement
  // useEffect(() => {
  //   handleSearch('Top computer science tutorials 2024');
  // }, []);

  const handleSearch = async (query: string = searchQuery, cat: string = activeCategory) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const videos = await searchTutorials(query, cat);
      setResults(videos);
      
      // AI Recommendations based on search
      if (videos.length > 0) {
        const recs = videos.slice(0, 3).map((v: any) => ({
          ...v,
          id: `rec_${v.id}`,
          isRecommendation: true
        }));
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToRoadmap = (video: any) => {
    const tutorial: Omit<Tutorial, 'savedAt' | 'status'> = {
      id: video.id,
      title: video.title,
      channelName: video.channelName,
      views: video.views,
      uploadDate: video.uploadDate,
      duration: video.duration,
      thumbnail: video.thumbnail,
      category: video.category,
      aiScore: video.aiScore
    };
    const updated = progressService.addTutorialToRoadmap(tutorial);
    setProgress(updated);
  };

  const VideoCard = ({ video, isRec = false }: { video: any, isRec?: boolean }) => {
    const isSaved = savedIds.has(video.id) || savedIds.has(video.id.replace('rec_', ''));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "group relative flex flex-col glass rounded-3xl overflow-hidden border transition-all duration-500",
          isDarkMode ? "border-white/5 hover:border-blue-500/50" : "border-black/5 hover:border-blue-500/30 shadow-sm hover:shadow-xl",
          isRec ? "border-purple-500/30" : ""
        )}
      >
        {/* Thumbnail area */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <a 
              href={`https://www.youtube.com/watch?v=${video.id.replace('rec_', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-blue-500 text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
            >
              <Play className="w-6 h-6 fill-current" />
            </a>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-lg text-[10px] font-bold text-white backdrop-blur-md">
            {video.duration}
          </div>
          {isRec && (
            <div className="absolute top-2 left-2 px-3 py-1 bg-purple-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Choice
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3 className={cn(
              "font-bold text-sm line-clamp-2 leading-tight transition-colors",
              isDarkMode ? "text-white" : "text-zinc-900 group-hover:text-blue-600"
            )}>
              {video.title}
            </h3>
            <div className={cn(
              "flex flex-col items-center justify-center w-10 h-10 rounded-xl border shrink-0",
              video.aiScore > 90 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "border-blue-500/20 text-blue-400"
            )}>
              <span className="text-[10px] font-black leading-none">{video.aiScore}</span>
              <span className="text-[8px] uppercase font-bold opacity-60">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Video className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-xs text-zinc-500 font-medium truncate">{video.channelName}</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.views}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.uploadDate}
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${video.id.replace('rec_', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-zinc-900 border border-black/5"
              )}
            >
              Watch Now
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => handleSaveToRoadmap(video)}
              disabled={isSaved}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                isSaved 
                  ? "bg-emerald-500/10 text-emerald-500 cursor-default" 
                  : (isDarkMode ? "bg-blue-500 text-black hover:bg-blue-400 shadow-lg shadow-blue-500/20" : "bg-blue-500 text-black hover:bg-blue-400 shadow-lg shadow-blue-500/20")
              )}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3 h-3" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3 h-3" />
                  Save to Roadmap
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-full pb-20">
      {/* Hero Section */}
      <div className="relative h-[300px] mb-12 overflow-hidden flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 z-0">
          <div className={cn(
            "absolute inset-0 opacity-20",
            isDarkMode ? "bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_70%)]" : "bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_70%)]"
          )} />
          <div className="absolute inset-0 backdrop-blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 mb-4 inline-block">
              Knowledge Hub
            </span>
            <h1 className={cn(
              "text-5xl md:text-6xl font-black mb-4 tracking-tight transition-colors",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              Master Any Topic <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Visually.</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Curated YouTube tutorials with AI-powered quality assessment and roadmap integration.
            </p>
          </motion.div>

          {/* Search Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="relative max-w-2xl mx-auto group"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials, coding, AI, DSA, Web Dev..."
              className={cn(
                "w-full h-16 pl-14 pr-32 rounded-3xl text-sm font-medium focus:outline-none transition-all border",
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50" 
                  : "bg-white border-black/5 text-zinc-900 shadow-xl focus:border-blue-500/50"
              )}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Filters and Sorting */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter className={cn("w-4 h-4 mr-2", isDarkMode ? "text-zinc-500" : "text-zinc-400")} />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); handleSearch(searchQuery, cat); }}
                className={cn(
                  "px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border",
                  activeCategory === cat 
                    ? "bg-blue-500 text-black border-blue-500 shadow-lg shadow-blue-500/20" 
                    : (isDarkMode ? "bg-white/5 border-white/5 text-zinc-400 hover:text-white" : "bg-black/5 border-black/5 text-zinc-500 hover:text-zinc-900")
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={cn("hidden lg:block w-px h-6", isDarkMode ? "bg-white/10" : "bg-black/10")} />
            <div className="flex items-center gap-2 group cursor-pointer relative">
              <SortDesc className="w-4 h-4 text-zinc-500" />
              <select 
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                className={cn(
                  "bg-transparent text-xs font-bold focus:outline-none appearance-none cursor-pointer pr-4",
                  isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <AnimatePresence>
          {recommendations.length > 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Recommended Path</h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Curated learning sequence for you</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recommendations.map(video => (
                  <VideoCard key={video.id} video={video} isRec={true} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Search Results</h2>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Top tutorials matching your query</p>
              </div>
            </div>
            
            <div className="text-xs font-bold text-zinc-500 bg-white/5 px-4 py-2 rounded-xl border border-white/10 uppercase tracking-tighter">
              Showing {results.length} results
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={cn("aspect-video rounded-3xl animate-pulse", isDarkMode ? "bg-white/5" : "bg-black/5")} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 glass rounded-[40px] border-dashed border-2 border-white/5">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No tutorials found</h3>
              <p className="text-zinc-500 max-w-sm">Try searching for different keywords or check your connection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
