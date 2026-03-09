import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  Video, 
  CheckCircle2, 
  Circle, 
  Users, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  MessageSquare, 
  X,
  Send,
  Globe,
  Trophy,
  ChevronRight,
  Terminal,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Award,
  User,
  Zap,
  Flame,
  Star,
  Code2,
  Play,
  RotateCcw,
  AlertCircle,
  Folder,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  Loader2,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Briefcase,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval } from 'date-fns';
import { searchCSConcept, getSimulatedStudentResponse, fetchChallengesForTopic, getGeneralizedTopicName } from './services/gemini';
import { progressService, Progress } from './services/progress';
import { challenges, Challenge } from './constants/challenges';
import { cn } from './lib/utils';

type Tab = 'search' | 'progress' | 'meet' | 'challenges' | 'analytics' | 'about' | 'projects';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ text: string; sources: any[] } | null>(null);
  const [progress, setProgress] = useState<Progress>(progressService.getProgress());
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [userNameInput, setUserNameInput] = useState(progress.userName);
  
  // Challenges State
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [userCode, setUserCode] = useState('');
  const [challengeFeedback, setChallengeFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  // Meet State
  const [isMeetActive, setIsMeetActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [meetMessages, setMeetMessages] = useState<{ role: 'teacher' | 'student', text: string }[]>([]);
  const [meetInput, setMeetInput] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [studentInstruction, setStudentInstruction] = useState('A curious beginner who asks deep questions');
  const [isStudentTyping, setIsStudentTyping] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [audienceState, setAudienceState] = useState<'attentive' | 'engaged' | 'idle'>('attentive');
  const videoRef = useRef<HTMLVideoElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPresenting) {
      setAudienceState('engaged');
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = setTimeout(() => {
        setAudienceState('idle');
      }, 5000); // Idle after 5 seconds of no typing
    } else {
      setAudienceState('attentive');
    }
  }, [meetInput, isPresenting]);

  useEffect(() => {
    if (isMeetActive && isCamOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera error:", err));
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isMeetActive, isCamOn]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchCSConcept(searchQuery);
      setSearchResults(results);
      setProgress(progressService.addSearch(searchQuery));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetInput.trim()) return;
    
    const userMsg = meetInput;
    setMeetMessages(prev => [...prev, { role: 'teacher', text: userMsg }]);
    setMeetInput('');
    setIsStudentTyping(true);

    try {
      const response = await getSimulatedStudentResponse(userMsg, studentInstruction);
      setMeetMessages(prev => [...prev, { role: 'student', text: response || '...' }]);
    } catch (error) {
      console.error("Student response failed:", error);
    } finally {
      setIsStudentTyping(false);
    }
  };

  const handleAddCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || isAddingTopic) return;
    
    setIsAddingTopic(true);
    try {
      const challenges = await fetchChallengesForTopic(newTopicTitle);
      const updatedProgress = progressService.addCustomTopic(newTopicTitle, challenges);
      setProgress(updatedProgress);
      setNewTopicTitle('');
      // Automatically expand the new topic
      const newTopic = updatedProgress.customTopics[updatedProgress.customTopics.length - 1];
      if (newTopic) setExpandedTopics(prev => [...prev, newTopic.id]);
    } catch (error) {
      console.error("Failed to fetch challenges for topic:", error);
      // Fallback: add without challenges if AI fails
      setProgress(progressService.addCustomTopic(newTopicTitle));
      setNewTopicTitle('');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleAddSearchTopicToRoadmap = async () => {
    if (!searchQuery.trim() || isAddingTopic) return;
    
    setIsAddingTopic(true);
    try {
      const generalizedName = await getGeneralizedTopicName(searchQuery);
      const challenges = await fetchChallengesForTopic(generalizedName);
      const updatedProgress = progressService.addCustomTopic(generalizedName, challenges);
      setProgress(updatedProgress);
      
      // Automatically expand the new topic and switch to roadmap tab
      const newTopic = updatedProgress.customTopics[updatedProgress.customTopics.length - 1];
      if (newTopic) setExpandedTopics(prev => [...prev, newTopic.id]);
      setActiveTab('progress');
    } catch (error) {
      console.error("Failed to add search topic to roadmap:", error);
      setProgress(progressService.addCustomTopic(searchQuery));
      setActiveTab('progress');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const toggleTopicExpansion = (id: string) => {
    setExpandedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSaveName = () => {
    setProgress(progressService.setUserName(userNameInput));
  };

  const calculateProgress = () => {
    if (progress.customTopics.length === 0) return 0;
    const completed = progress.customTopics.filter(t => t.completed).length;
    return Math.round((completed / progress.customTopics.length) * 100);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: '#0a0a0a',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${progress.userName || 'Student'}_Certificate.pdf`);
  };

  const runChallenge = () => {
    if (!selectedChallenge) return;
    try {
      // Create a function from the user's code
      // We assume the function name matches the one in starter code
      const funcName = selectedChallenge.starterCode.match(/function\s+(\w+)/)?.[1];
      if (!funcName) throw new Error("Could not find function name");

      const userFunc = new Function(`${userCode}; return ${funcName};`)();
      
      let allPassed = true;
      for (const test of selectedChallenge.testCases) {
        const result = userFunc(...test.input);
        if (JSON.stringify(result) !== JSON.stringify(test.expected)) {
          allPassed = false;
          setChallengeFeedback({ 
            success: false, 
            message: `Failed test case: input(${JSON.stringify(test.input)}) expected ${JSON.stringify(test.expected)} but got ${JSON.stringify(result)}` 
          });
          break;
        }
      }

      if (allPassed) {
        setChallengeFeedback({ success: true, message: "All test cases passed! Great job!" });
        setProgress(progressService.completeChallenge(selectedChallenge.id, selectedChallenge.title));
      }
    } catch (err: any) {
      setChallengeFeedback({ success: false, message: `Error: ${err.message}` });
    }
  };

  const currentProgress = calculateProgress();
  const masteredCount = progress.completedTopics.length + progress.customTopics.filter(t => t.completed).length + progress.completedChallenges.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Terminal className="text-black w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Shanmukh AI VidyaPeettham
          </span>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10">
          {[
            { id: 'search', icon: Search, label: 'Global Search' },
            { id: 'progress', icon: BookOpen, label: 'My Roadmap' },
            { id: 'challenges', icon: Code2, label: 'Challenges' },
            { id: 'projects', icon: Briefcase, label: 'Projects' },
            { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
            { id: 'meet', icon: Video, label: 'Dummy Meet' },
            { id: 'about', icon: Info, label: 'About' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden group",
                activeTab === tab.id 
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-white/20 pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
            <span className="text-xs font-mono text-emerald-400 font-bold">{masteredCount} Mastered</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-6 py-12"
            >
              <div className="text-center mb-12">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  AI-Powered Global Learning
                </motion.div>
                <h1 className="text-6xl font-black mb-4 tracking-tight leading-tight">
                  Master Any <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">CS Concept</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                  Fetch the best resources from across the globe. 
                  Get the most efficient path to expertise, instantly.
                </p>
              </div>

              <form onSubmit={handleSearch} className="relative mb-12 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter a concept (e.g., Dynamic Programming, Kubernetes, Rust Ownership...)"
                    className="w-full h-16 bg-zinc-900 border border-white/10 rounded-2xl px-6 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-500 text-black rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </form>

              {searchResults && (
                <div className="space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl p-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Globe className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Globe className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Global Insights</span>
                      </div>
                      <button
                        onClick={handleAddSearchTopicToRoadmap}
                        disabled={isAddingTopic}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAddingTopic ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Add problems to roadmap
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none relative z-10">
                      <Markdown>{searchResults.text}</Markdown>
                    </div>
                  </motion.div>

                  {searchResults.sources.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.sources.map((source, i) => (
                        <motion.a 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-emerald-500/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-emerald-400 group-hover:underline truncate flex-1">
                              {source.title}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400" />
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2">{source.uri}</p>
                        </motion.a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!searchResults && progress.lastSearched.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {progress.lastSearched.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => { setSearchQuery(s); }}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 hover:border-emerald-500/30 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div 
              key="challenges"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl mx-auto px-6 py-12"
            >
              <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black mb-2">Coding Challenges</h2>
                  <p className="text-zinc-400">Sharpen your skills with CS-focused problems.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[140px]"
                    >
                      <option value="All">All Categories</option>
                      {Array.from(new Set(challenges.map(c => c.category))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</label>
                    <select 
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[140px]"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Challenge List */}
                <div className="space-y-4">
                  {challenges
                    .filter(c => (filterCategory === 'All' || c.category === filterCategory) && (filterDifficulty === 'All' || c.difficulty === filterDifficulty))
                    .map((challenge) => (
                    <button
                      key={challenge.id}
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setUserCode(challenge.starterCode);
                        setChallengeFeedback(null);
                      }}
                      className={cn(
                        "w-full p-6 glass rounded-2xl border transition-all text-left group relative overflow-hidden",
                        selectedChallenge?.id === challenge.id 
                          ? "border-emerald-500/50 bg-emerald-500/5" 
                          : "border-white/5 hover:border-white/20",
                        progress.completedChallenges.includes(challenge.id) && "border-emerald-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                          challenge.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-400" :
                          challenge.difficulty === 'Medium' ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-red-500/10 text-red-400"
                        )}>
                          {challenge.difficulty}
                        </span>
                        {progress.completedChallenges.includes(challenge.id) && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{challenge.title}</h3>
                      <p className="text-xs text-zinc-500">{challenge.category}</p>
                    </button>
                  ))}
                  {challenges.filter(c => (filterCategory === 'All' || c.category === filterCategory) && (filterDifficulty === 'All' || c.difficulty === filterDifficulty)).length === 0 && (
                    <div className="p-12 text-center glass rounded-2xl border border-dashed border-white/10">
                      <p className="text-zinc-500 text-sm">No challenges found matching these filters.</p>
                    </div>
                  )}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-2">
                  {selectedChallenge ? (
                    <div className="flex flex-col h-full glass rounded-3xl border border-white/10 overflow-hidden">
                      <div className="p-6 border-b border-white/10 bg-white/5">
                        <h3 className="text-xl font-bold mb-2">{selectedChallenge.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">{selectedChallenge.description}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col p-6 gap-4">
                        <div className="flex-1 relative font-mono text-sm">
                          <textarea
                            value={userCode}
                            onChange={(e) => setUserCode(e.target.value)}
                            className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none text-emerald-400"
                            spellCheck={false}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => setUserCode(selectedChallenge.starterCode)}
                            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset Code
                          </button>
                          <button 
                            onClick={runChallenge}
                            className="px-8 py-3 bg-emerald-500 text-black rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Run Tests
                          </button>
                        </div>

                        <AnimatePresence>
                          {challengeFeedback && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className={cn(
                                "p-4 rounded-xl border flex items-start gap-3",
                                challengeFeedback.success 
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                  : "bg-red-500/10 border-red-500/30 text-red-400"
                              )}
                            >
                              {challengeFeedback.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                              <p className="text-sm font-medium">{challengeFeedback.message}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center glass rounded-3xl border border-dashed border-white/10 p-12 text-center">
                      <Code2 className="w-16 h-16 text-zinc-800 mb-4" />
                      <h3 className="text-xl font-bold mb-2">Select a Challenge</h3>
                      <p className="text-zinc-500 max-w-xs">Choose a problem from the list to start coding and testing your skills.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div 
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto px-6 py-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 glass rounded-3xl p-8 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-black mb-2">My Roadmap</h2>
                      <p className="text-zinc-400 text-sm">Track your progress and earn your certificate.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black text-emerald-400">{currentProgress}%</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Complete</div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-8">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentProgress}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>

                  <form onSubmit={handleAddCustomTopic} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="Add a topic (e.g., DP, LeetCode, Graphs)..."
                        disabled={isAddingTopic}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                      />
                      {isAddingTopic && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    <button 
                      type="submit"
                      disabled={isAddingTopic}
                      className="p-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                <div className="glass rounded-3xl p-8 flex flex-col justify-between border-emerald-500/20">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Profile</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Your Name</label>
                        <input 
                          type="text"
                          value={userNameInput}
                          onChange={(e) => setUserNameInput(e.target.value)}
                          placeholder="Enter your name..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <button 
                        onClick={handleSaveName}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                      >
                        Save Profile
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      <span>Achievement</span>
                      <Star className="w-3 h-3 text-yellow-500" />
                    </div>
                    <p className="text-[10px] text-zinc-500 italic">Reach 100% to unlock your professional certificate.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {progress.customTopics.length === 0 ? (
                  <div className="p-12 text-center glass rounded-3xl border-dashed border-2 border-white/10">
                    <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">Add topics you want to study to start your roadmap.</p>
                  </div>
                ) : (
                  progress.customTopics.map((topic, i) => {
                    const isExpanded = expandedTopics.includes(topic.id);
                    // Group problems by platform
                    const groupedProblems = topic.problems.reduce((acc: any, prob) => {
                      if (!acc[prob.platform]) acc[prob.platform] = [];
                      acc[prob.platform].push(prob);
                      return acc;
                    }, {});

                    return (
                      <motion.div 
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "glass rounded-2xl border transition-all overflow-hidden",
                          topic.completed ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5"
                        )}
                      >
                        <div className="flex items-center justify-between p-6 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setProgress(progressService.toggleCustomTopic(topic.id))}
                              className="transition-transform active:scale-90"
                            >
                              {topic.completed ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              ) : (
                                <Circle className="w-8 h-8 text-zinc-700 hover:text-zinc-500" />
                              )}
                            </button>
                            <button 
                              onClick={() => toggleTopicExpansion(topic.id)}
                              className="flex items-center gap-3 text-left"
                            >
                              {isExpanded ? (
                                <FolderOpen className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Folder className="w-5 h-5 text-zinc-500" />
                              )}
                                <div>
                                  <h3 className={cn(
                                    "text-lg font-bold transition-all",
                                    topic.completed ? "text-emerald-400" : "text-white"
                                  )}>
                                    {topic.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                      {topic.problems.length} Interview Questions • {topic.problems.filter(p => p.completed).length} Done
                                    </p>
                                    {!topic.completed && topic.problems.length > 0 && (
                                      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-emerald-500 transition-all duration-500"
                                          style={{ width: `${(topic.problems.filter(p => p.completed).length / topic.problems.length) * 100}%` }}
                                        />
                                      </div>
                                    )}
                                    {topic.completed && (
                                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Mastered</span>
                                    )}
                                  </div>
                                </div>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleTopicExpansion(topic.id)}
                              className={cn(
                                "p-2 hover:bg-white/5 rounded-lg transition-all",
                                isExpanded && "rotate-180"
                              )}
                            >
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            </button>
                            <button 
                              onClick={() => setProgress(progressService.deleteCustomTopic(topic.id))}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 bg-black/20"
                            >
                              <div className="p-6 space-y-6">
                                {Object.entries(groupedProblems).length > 0 ?
                                  <>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                        <Trophy className="w-3 h-3" />
                                        Top 10 Interview Questions
                                      </h4>
                                    </div>
                                    {Object.entries(groupedProblems).map(([platform, probs]: [string, any]) => (
                                    <div key={platform} className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">
                                          {platform}
                                        </span>
                                        <div className="h-px flex-1 bg-white/5" />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {probs.map((prob: any) => (
                                          <div 
                                            key={prob.id}
                                            className={cn(
                                              "flex items-center justify-between p-3 rounded-xl border transition-all",
                                              prob.completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                          >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                              <button 
                                                onClick={() => setProgress(progressService.toggleProblemCompletion(topic.id, prob.id))}
                                                className="shrink-0"
                                              >
                                                {prob.completed ? (
                                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                  <Circle className="w-5 h-5 text-zinc-700" />
                                                )}
                                              </button>
                                              <span className={cn(
                                                "text-sm font-medium truncate",
                                                prob.completed ? "text-zinc-500 line-through" : "text-zinc-300"
                                              )}>
                                                {prob.title}
                                              </span>
                                            </div>
                                            <a 
                                              href={prob.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 text-zinc-600 hover:text-emerald-400 transition-colors shrink-0"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </>
                                : (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-zinc-500">No specific challenges found for this topic.</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {currentProgress === 100 && progress.customTopics.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-12 p-8 glass rounded-3xl border-emerald-500/50 bg-emerald-500/5 text-center relative overflow-hidden"
                >
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                  
                  <Award className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-3xl font-black mb-2">Congratulations, {progress.userName || 'Scholar'}!</h2>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    You have successfully completed your custom roadmap. You are now officially a Master of your selected CS concepts.
                  </p>
                  
                  <button 
                    onClick={downloadCertificate}
                    className="px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold flex items-center gap-2 mx-auto hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Download Certificate
                  </button>

                  {/* Hidden Certificate for Generation */}
                  <div className="fixed left-[-9999px] top-0">
                    <div 
                      ref={certificateRef}
                      style={{ backgroundColor: '#0a0a0a', borderColor: '#10b981' }}
                      className="w-[1000px] h-[700px] border-[20px] p-20 flex flex-col items-center justify-between text-white font-sans relative"
                    >
                      <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div style={{ background: 'radial-gradient(circle at center, #10b981, transparent, transparent)' }} className="w-full h-full" />
                      </div>
                      
                      <div className="text-center">
                        <div style={{ backgroundColor: '#10b981' }} className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
                          <Terminal style={{ color: '#000000' }} className="w-12 h-12" />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">CERTIFICATE OF EXCELLENCE</h1>
                        <div style={{ backgroundColor: '#10b981' }} className="h-1 w-48 mx-auto mb-8" />
                        <p style={{ color: '#a1a1aa' }} className="text-xl uppercase tracking-[0.3em] font-bold">This is to certify that</p>
                      </div>

                      <div className="text-center">
                        <h2 style={{ color: '#34d399' }} className="text-8xl font-black mb-4">{progress.userName || 'Student'}</h2>
                        <p style={{ color: '#d4d4d8' }} className="text-2xl max-w-2xl mx-auto leading-relaxed">
                          has successfully completed the global computer science roadmap and demonstrated mastery over advanced technical concepts at Shanmukh AI VidyaPeettham.
                        </p>
                      </div>

                      <div className="w-full flex justify-between items-end">
                        <div className="text-left">
                          <div style={{ backgroundColor: '#3f3f46' }} className="h-px w-48 mb-4" />
                          <p style={{ color: '#71717a' }} className="text-sm font-bold uppercase tracking-widest">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                          <Award style={{ color: '#10b981' }} className="w-20 h-20 mb-2" />
                          <p style={{ color: '#10b981' }} className="text-xs font-bold uppercase tracking-widest">Official Seal</p>
                        </div>
                        <div className="text-right">
                          <div style={{ backgroundColor: '#3f3f46' }} className="h-px w-48 mb-4" />
                          <p style={{ color: '#71717a' }} className="text-sm font-bold uppercase tracking-widest">Shanmukh AI VidyaPeettham</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                    <TrendingUp className="w-10 h-10 text-emerald-500" />
                    Learning Analytics
                  </h1>
                  <p className="text-zinc-400">Deep dive into your progress and learning patterns.</p>
                </div>
                <div className="flex gap-4">
                  {progress.completionHistory.length === 0 && (
                    <button 
                      onClick={() => {
                        const mockHistory = [];
                        const types: ('problem' | 'challenge' | 'topic')[] = ['problem', 'challenge', 'topic'];
                        for (let i = 0; i < 30; i++) {
                          const daysAgo = Math.floor(Math.random() * 10);
                          const type = types[Math.floor(Math.random() * 3)];
                          mockHistory.push({
                            id: Math.random().toString(36).substr(2, 9),
                            type,
                            title: `Example ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
                            timestamp: subDays(new Date(), daysAgo).getTime() - (Math.random() * 3600000 * 24)
                          });
                        }
                        const p = { ...progress, completionHistory: mockHistory.sort((a, b) => a.timestamp - b.timestamp) };
                        setProgress(p);
                        progressService.saveProgress(p);
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all active:scale-95"
                    >
                      Seed Demo Data
                    </button>
                  )}
                  <div className="glass p-4 rounded-2xl text-center min-w-[120px]">
                    <div className="text-2xl font-black text-emerald-500">{progress.completionHistory.length}</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Actions</div>
                  </div>
                  <div className="glass p-4 rounded-2xl text-center min-w-[120px]">
                    <div className="text-2xl font-black text-emerald-500">
                      {progress.customTopics.filter(t => t.completed).length}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Topics Mastered</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Completion Over Time */}
                <div className="glass p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Completion Velocity
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last 7 Days</span>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(() => {
                        const last7Days = eachDayOfInterval({
                          start: subDays(new Date(), 6),
                          end: new Date()
                        });
                        return last7Days.map(day => ({
                          date: format(day, 'MMM dd'),
                          count: progress.completionHistory.filter(h => isSameDay(new Date(h.timestamp), day)).length
                        }));
                      })()}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#71717a" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#71717a" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution by Type */}
                <div className="glass p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-emerald-500" />
                      Learning Distribution
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">By Category</span>
                  </div>
                  <div className="h-[300px] w-full flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Problems', value: progress.completionHistory.filter(h => h.type === 'problem').length },
                            { name: 'Challenges', value: progress.completionHistory.filter(h => h.type === 'challenge').length },
                            { name: 'Topics', value: progress.completionHistory.filter(h => h.type === 'topic').length },
                          ].filter(d => d.value > 0).length > 0 ? [
                            { name: 'Problems', value: progress.completionHistory.filter(h => h.type === 'problem').length },
                            { name: 'Challenges', value: progress.completionHistory.filter(h => h.type === 'challenge').length },
                            { name: 'Topics', value: progress.completionHistory.filter(h => h.type === 'topic').length },
                          ] : [
                            { name: 'No Data', value: 1 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#27272a" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-4 pr-8">
                      {[
                        { label: 'Problems', color: 'bg-emerald-500', count: progress.completionHistory.filter(h => h.type === 'problem').length },
                        { label: 'Challenges', color: 'bg-blue-500', count: progress.completionHistory.filter(h => h.type === 'challenge').length },
                        { label: 'Topics', color: 'bg-purple-500', count: progress.completionHistory.filter(h => h.type === 'topic').length },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", item.color)} />
                          <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className="text-[10px] text-zinc-500">{item.count} Actions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 glass p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {progress.completionHistory.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500">
                        No activity recorded yet. Start learning to see your progress!
                      </div>
                    ) : (
                      progress.completionHistory.slice().reverse().slice(0, 6).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              entry.type === 'problem' ? "bg-emerald-500/10 text-emerald-500" :
                              entry.type === 'challenge' ? "bg-blue-500/10 text-blue-500" :
                              "bg-purple-500/10 text-purple-500"
                            )}>
                              {entry.type === 'problem' ? <CheckCircle2 className="w-5 h-5" /> :
                               entry.type === 'challenge' ? <Code2 className="w-5 h-5" /> :
                               <Trophy className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold">{entry.title}</div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                {entry.type} Completed
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Mastery Breakdown
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Easy', count: progress.completionHistory.filter(h => h.title.toLowerCase().includes('easy')).length || 5 },
                        { name: 'Medium', count: progress.completionHistory.filter(h => h.title.toLowerCase().includes('medium')).length || 3 },
                        { name: 'Hard', count: progress.completionHistory.filter(h => h.title.toLowerCase().includes('hard')).length || 1 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your mastery is growing! You've focused primarily on <span className="text-emerald-400 font-bold">Problem Solving</span> this week.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <div className="mb-12">
                <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                  <Briefcase className="w-10 h-10 text-emerald-500" />
                  Featured Projects
                </h1>
                <p className="text-zinc-400">A collection of my technical work and research.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Ransomware Pre-Encryption Detection System",
                    description: "Built a proactive ransomware detection system using behavioral anomaly monitoring. Designed real-time file system tracking with Watchdog, implemented threshold-based mass rename detection, secure event ingestion via Flask API, MySQL logging, email alerting, and automated analytical report generation.",
                    tags: ["Python", "Flask", "MySQL", "Cybersecurity"],
                    repo: "https://github.com/PavanShanmukh/ransomware-detection",
                    demo: null
                  },
                  {
                    title: "Word Count using AVL Tree",
                    description: "Analyzed text documents and counted unique words and frequencies using self-balancing AVL trees for optimal performance.",
                    tags: ["C++", "Data Structures", "Algorithms"],
                    repo: "https://github.com/PavanShanmukh/word-count-avl",
                    demo: "https://word-count-avl.demo"
                  },
                  {
                    title: "Distributed Ledger Analytics Tool",
                    description: "A research project exploring data patterns in distributed ledgers to identify anomalies and trends.",
                    tags: ["Blockchain", "Analytics", "Research"],
                    repo: "https://github.com/PavanShanmukh/ledger-analytics",
                    demo: null
                  }
                ].map((project, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-3xl p-8 border border-white/5 flex flex-col h-full hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-4 group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.tags.map((tag, j) => (
                          <span key={j} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md text-zinc-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <a 
                        href={project.repo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                      >
                        <Github className="w-4 h-4" />
                        Repository
                      </a>
                      {project.demo && (
                        <a 
                          href={project.demo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-black rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto p-8"
            >
              <div className="glass rounded-[40px] overflow-hidden border border-white/5">
                <div className="h-48 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 relative">
                  <div className="absolute -bottom-16 left-12">
                    <div className="w-32 h-32 rounded-3xl bg-zinc-900 border-4 border-[#0a0a0a] flex items-center justify-center shadow-2xl overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                        <User className="w-16 h-16 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-20 pb-12 px-12">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h1 className="text-4xl font-black mb-2">Pavan Shanmukh Kakarla</h1>
                      <p className="text-emerald-400 font-bold">3rd Year B.Tech CSIT Undergraduate</p>
                      <p className="text-zinc-500 text-sm">KL University</p>
                    </div>
                    <div className="flex gap-3">
                      <a href="#" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <Github className="w-5 h-5" />
                      </a>
                      <a href="#" className="p-3 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="text-emerald-400 mb-2"><Award className="w-6 h-6" /></div>
                      <div className="text-sm font-bold mb-1">Specialization</div>
                      <div className="text-xs text-zinc-500">Distributed Ledger Analytics</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="text-blue-400 mb-2"><Code2 className="w-6 h-6" /></div>
                      <div className="text-sm font-bold mb-1">Experience</div>
                      <div className="text-xs text-zinc-500">Full Stack & Security</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="text-purple-400 mb-2"><Globe className="w-6 h-6" /></div>
                      <div className="text-sm font-bold mb-1">Location</div>
                      <div className="text-xs text-zinc-500">India</div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-500" />
                        About Me
                      </h3>
                      <p className="text-zinc-400 leading-relaxed">
                        I am a passionate Computer Science and Information Technology student at KL University, currently in my 3rd year. 
                        My academic focus is on Distributed Ledger Analytics, where I explore the intersection of blockchain technology and data science.
                      </p>
                      <p className="text-zinc-400 leading-relaxed mt-4">
                        Beyond my specialization, I have a strong interest in cybersecurity and software engineering. I have developed several projects 
                        ranging from proactive ransomware detection systems to optimized data structure implementations. I am always eager to learn 
                        new technologies and tackle complex problems.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-500" />
                        Technical Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {["Python", "C++", "Flask", "MySQL", "Blockchain", "Data Structures", "Algorithms", "Cybersecurity", "React", "TypeScript"].map((skill, i) => (
                          <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'meet' && (
            <motion.div 
              key="meet"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-64px)] p-6 flex flex-col"
            >
              {!isMeetActive ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="max-w-md w-full glass rounded-3xl p-8 text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Video className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Teaching Room</h2>
                    <p className="text-zinc-400 mb-8">
                      Practice teaching to AI students. They'll listen, ask questions, and respond based on your instructions.
                    </p>
                    
                    <div className="text-left mb-8">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Student Persona</label>
                      <select 
                        value={studentInstruction}
                        onChange={(e) => setStudentInstruction(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                      >
                        <option value="A curious beginner who asks deep questions">Curious Beginner</option>
                        <option value="A skeptical student who needs proof for everything">Skeptical Expert</option>
                        <option value="A distracted student who needs engagement">Distracted Peer</option>
                        <option value="A supportive friend who encourages you">Supportive Friend</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => setIsMeetActive(true)}
                      className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                  {/* Main Video Area */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="flex-1 relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                      {/* Seminar Hall Background */}
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                        <div className="grid grid-cols-8 gap-4 p-8 h-full items-end justify-items-center">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={
                                audienceState === 'engaged' ? {
                                  y: [0, -5, 0],
                                  rotate: [0, 2, -2, 0],
                                } : audienceState === 'idle' ? {
                                  y: 0,
                                  rotate: 0,
                                  opacity: 0.6
                                } : {
                                  y: [0, -2, 0],
                                  rotate: 0
                                }
                              }
                              transition={{
                                duration: audienceState === 'engaged' ? 2 : 4,
                                repeat: Infinity,
                                delay: i * 0.1
                              }}
                              className="w-8 h-12 bg-zinc-800 rounded-t-full relative"
                            >
                              <div className="w-6 h-6 bg-zinc-700 rounded-full absolute -top-4 left-1" />
                              {audienceState === 'idle' && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                                  <div className="w-2 h-0.5 bg-zinc-600 rounded-full" />
                                  <div className="w-2 h-0.5 bg-zinc-600 rounded-full" />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {isCamOn ? (
                        <div className="absolute inset-0 flex items-center justify-center p-12 z-20">
                          <div className="w-full max-w-2xl aspect-video relative rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              muted 
                              playsInline 
                              className="w-full h-full object-cover mirror"
                            />
                            {/* Podium Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t-4 border-zinc-800 flex items-center justify-center">
                              <div className="w-32 h-4 bg-emerald-500/20 rounded-full" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 z-20">
                          <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <VideoOff className="w-12 h-12 text-emerald-500/50" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 glass rounded-full z-30">
                        <button 
                          onClick={() => setIsPresenting(!isPresenting)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            isPresenting ? "bg-emerald-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {isPresenting ? 'Stop Presenting' : 'Start Presentation'}
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <button 
                          onClick={() => setIsMicOn(!isMicOn)}
                          className={cn(
                            "p-3 rounded-full transition-all",
                            isMicOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"
                          )}
                        >
                          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setIsCamOn(!isCamOn)}
                          className={cn(
                            "p-3 rounded-full transition-all",
                            isCamOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"
                          )}
                        >
                          {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <button 
                          onClick={() => setIsMeetActive(false)}
                          className="px-6 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all active:scale-95"
                        >
                          End Call
                        </button>
                      </div>

                      <div className="absolute top-6 left-6 px-4 py-2 glass rounded-full flex items-center gap-2 z-30">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          isPresenting ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {isPresenting ? 'Mode: Seminar Presentation' : 'Mode: Teaching Room'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 h-32">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-2xl flex items-center justify-center relative overflow-hidden group">
                          <Users className="w-8 h-8 text-zinc-800 group-hover:text-emerald-500/20 transition-colors" />
                          <div className="absolute bottom-2 left-2 text-[10px] font-bold text-zinc-500 uppercase">AI Participant {i}</div>
                        </div>
                      ))}
                    </div>
                  </div>                  {/* Sidebar: Participants & Chat */}
                  <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                    {/* Participants List */}
                    <div className="flex flex-col glass rounded-3xl overflow-hidden border border-white/5 max-h-[40%]">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-sm">Participants</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-bold">4 Online</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {[
                          { name: progress.userName || 'You', role: 'Teacher', status: 'Host', color: 'bg-emerald-500' },
                          { name: 'AI Student 1', role: 'Student', status: 'Curious', color: 'bg-blue-500' },
                          { name: 'AI Student 2', role: 'Student', status: 'Skeptical', color: 'bg-purple-500' },
                          { name: 'AI Student 3', role: 'Student', status: 'Distracted', color: 'bg-orange-500' },
                        ].map((participant, i) => (
                          <div 
                            key={i}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                          >
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-black font-black text-xs", participant.color)}>
                              {participant.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold truncate">{participant.name}</h4>
                                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">{participant.role}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] text-zinc-500">{participant.status}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Mic className="w-2.5 h-2.5 text-zinc-600" />
                              <VideoIcon className="w-2.5 h-2.5 text-zinc-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Class Chat */}
                    <div className="flex-1 flex flex-col glass rounded-3xl overflow-hidden border border-white/5">
                      <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm">Class Chat</span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {meetMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6">
                            <Sparkles className="w-8 h-8 text-zinc-800 mb-2" />
                            <p className="text-xs text-zinc-500">Start teaching! Type your lecture points here, and the students will respond.</p>
                          </div>
                        )}
                        {meetMessages.map((msg, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex flex-col",
                              msg.role === 'teacher' ? "items-end" : "items-start"
                            )}
                          >
                            <span className="text-[10px] text-zinc-500 mb-1 uppercase tracking-widest font-bold">
                              {msg.role === 'teacher' ? 'You' : 'Student'}
                            </span>
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                              msg.role === 'teacher' 
                                ? "bg-emerald-500 text-black rounded-tr-none" 
                                : "bg-white/5 border border-white/10 rounded-tl-none"
                            )}>
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                        {isStudentTyping && (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] text-zinc-500 mb-1 uppercase tracking-widest font-bold">Student</span>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
                        <div className="relative">
                          <input 
                            type="text"
                            value={meetInput}
                            onChange={(e) => setMeetInput(e.target.value)}
                            placeholder="Teach something..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        .prose h1, .prose h2, .prose h3 {
          @apply text-emerald-400 font-bold mt-6 mb-4;
        }
        .prose p {
          @apply text-zinc-300 mb-4 leading-relaxed;
        }
        .prose ul {
          @apply list-disc list-inside space-y-2 mb-4 text-zinc-300;
        }
        .prose a {
          @apply text-emerald-400 hover:underline;
        }
        .prose code {
          @apply bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-sm;
        }
      `}</style>
    </div>
  );
}
