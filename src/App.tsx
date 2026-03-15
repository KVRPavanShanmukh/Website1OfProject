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
  Folder,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Clock,
  Loader2,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Briefcase,
  Github,
  Monitor,
  Youtube,
  Settings,
  Share2,
  Lightbulb,
  Fan,
  Power,
  RefreshCw,
  Home,
  LogIn,
  LogOut,
  Play,
  Moon,
  LayoutDashboard
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
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';
import { searchCSConcept, getSimulatedStudentResponse, fetchChallengesForTopic, getGeneralizedTopicName, chatWithAI } from './services/gemini';
import { progressService, Progress, SpeedCodingStat, Problem, Challenge } from './services/progress';
import { cn } from './lib/utils';
import { CodingHeatmap } from './components/CodingHeatmap';
import { ConceptVisualizer } from './components/ConceptVisualizer';
import { SpeedCoding } from './components/SpeedCoding';
import { SilentStudy } from './components/SilentStudy';
import { ConceptGraph } from './components/ConceptGraph';

type Tab = 'landing' | 'login' | 'search' | 'dashboard' | 'meet' | 'games' | 'about' | 'features' | 'visualizer' | 'speed-coding' | 'silent-study';

const MOTIVATIONAL_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
];

const BootingLoader = () => {
  const [lines, setLines] = useState<string[]>([]);
  const bootSequence = [
    "> INITIALIZING SHANMUKH AI KERNEL...",
    "> LOADING NEURAL NETWORKS...",
    "> CONNECTING TO GLOBAL KNOWLEDGE GRAPH...",
    "> FETCHING CHALLENGES FROM LEETCODE...",
    "> PARSING GEEKSFORGEEKS REPOSITORY...",
    "> OPTIMIZING LEARNING PATHWAY...",
    "> INJECTING KNOWLEDGE INTO ROADMAP...",
    "> SYSTEM READY."
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootSequence.length) {
        setLines(prev => [...prev, bootSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 font-mono"
    >
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center animate-pulse">
            <Terminal className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-blue-500 font-bold text-xl tracking-tighter">SYSTEM BOOT</h2>
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em]">Shanmukh AI VidyaPeettham v2.5</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-12">
          {lines.map((line, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-blue-400/80 text-sm"
            >
              {line}
            </motion.div>
          ))}
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-blue-500 inline-block align-middle ml-1"
          />
        </div>

        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.2, ease: "linear" }}
            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          />
        </div>
      </div>
    </motion.div>
  );
};

const socket = io();

const MotivationNotification = ({ quote, isVisible }: { quote: { text: string, author: string }, isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6"
      >
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-200 italic mb-2 leading-relaxed">"{quote.text}"</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">— {quote.author}</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ text: string; sources: any[] } | null>(null);
  const [progress, setProgress] = useState<Progress>(progressService.getProgress());
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [showMoreProblems, setShowMoreProblems] = useState<Record<string, boolean>>({});
  const [userNameInput, setUserNameInput] = useState(progress.userName);
  const [gameScore, setGameScore] = useState(0);
  const [gameHighScore, setGameHighScore] = useState(() => Number(localStorage.getItem('2048-highscore') || 0));
  const [gameAttempts, setGameAttempts] = useState(() => Number(localStorage.getItem('2048-attempts') || 0));
  const [lockoutUntil, setLockoutUntil] = useState(() => Number(localStorage.getItem('2048-lockout') || 0));
  const [grid, setGrid] = useState<number[][]>(() => {
    const initialGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    // Add two initial tiles
    let count = 0;
    while (count < 2) {
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 4);
      if (initialGrid[r][c] === 0) {
        initialGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
        count++;
      }
    }
    return initialGrid;
  });

  const initGame = () => {
    // Check lockout
    if (lockoutUntil > Date.now()) return;

    const newAttempts = gameAttempts + 1;
    setGameAttempts(newAttempts);
    localStorage.setItem('2048-attempts', newAttempts.toString());

    if (newAttempts >= 3) {
      const until = Date.now() + 24 * 60 * 60 * 1000;
      setLockoutUntil(until);
      localStorage.setItem('2048-lockout', until.toString());
    }

    const newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    let count = 0;
    while (count < 2) {
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 4);
      if (newGrid[r][c] === 0) {
        newGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
        count++;
      }
    }
    setGrid(newGrid);
    setGameScore(0);
  };

  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil > 0 && Date.now() > lockoutUntil) {
        setLockoutUntil(0);
        setGameAttempts(0);
        localStorage.setItem('2048-lockout', '0');
        localStorage.setItem('2048-attempts', '0');
      }
    };
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    let newGrid = JSON.parse(JSON.stringify(grid));
    let moved = false;
    let addedScore = 0;

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

    // Normalize direction to 'left'
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) newGrid = rotate(newGrid);

    // Slide and merge left
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

    // Rotate back
    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotate(newGrid);

    if (moved) {
      // Add a new tile
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
      setGameScore(prev => prev + addedScore);
      if (gameScore + addedScore > gameHighScore) {
        setGameHighScore(gameScore + addedScore);
        localStorage.setItem('2048-highscore', (gameScore + addedScore).toString());
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'games') return;
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
  }, [grid, activeTab, gameScore, gameHighScore]);
  
  // Meet State
  const [isMeetActive, setIsMeetActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isYoutubeStreaming, setIsYoutubeStreaming] = useState(false);
  const [youtubeStreamKey, setYoutubeStreamKey] = useState('');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [meetMessages, setMeetMessages] = useState<{ role: 'teacher' | 'student', text: string }[]>([]);
  const [meetInput, setMeetInput] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [studentInstruction, setStudentInstruction] = useState('A curious beginner who asks deep questions');
  const [isStudentTyping, setIsStudentTyping] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [audienceState, setAudienceState] = useState<'attentive' | 'engaged' | 'idle'>('attentive');
  
  // Sidebar Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('auth_token') === 'true');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '');
  const [authError, setAuthError] = useState('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<{ email: string; name: string; points: number; lastUpdate: number }[]>([]);
  
  // Interactive Room State
  const [isLightOn, setIsLightOn] = useState(true);
  const [isACOn, setIsACOn] = useState(false);
  const [isComputerOn, setIsComputerOn] = useState(false);
  
  // Social & Engagement State
  const [showMotivation, setShowMotivation] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [referralInput, setReferralInput] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState([
    { name: 'Alice Chen', email: 'alice@example.com', status: 'online' },
    { name: 'Bob Smith', email: 'bob@example.com', status: 'offline' },
    { name: 'Charlie Day', email: 'charlie@example.com', status: 'online' },
    { name: 'Diana Prince', email: 'diana@example.com', status: 'online' },
  ]);
  
  // Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptcha, setCurrentCaptcha] = useState('');

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isMeetActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isMeetActive]);

  useEffect(() => {
    if (isMeetActive) {
      if (isScreenSharing && screenStream) {
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
      } else if (isCamOn) {
        if (cameraStream) {
          if (videoRef.current) videoRef.current.srcObject = cameraStream;
        } else {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
              setCameraStream(stream);
              if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => {
              console.error("Camera error:", err);
              setIsCamOn(false);
            });
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject = null;
        }
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null;
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setIsScreenSharing(false);
      }
    }
  }, [isMeetActive, isCamOn, isScreenSharing, screenStream, cameraStream, activeTab]);

  useEffect(() => {
    socket.on('leaderboard_update', (data) => {
      setGlobalLeaderboard(data);
    });
    return () => {
      socket.off('leaderboard_update');
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      const points = progress.completionHistory.filter(h => h.type === 'problem').length * 10 + 
                     progress.completionHistory.filter(h => h.type === 'topic').length * 50;
      socket.emit('update_points', {
        email: userEmail,
        name: progress.userName || userEmail.split('@')[0],
        points
      });
    }
  }, [progress.completionHistory, progress.userName, isAuthenticated, userEmail]);

  useEffect(() => {
    if (!isAuthenticated) {
      generateCaptcha();
    }
  }, [isAuthenticated]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentCaptcha(result);
    setCaptchaInput('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!usernameInput.trim()) {
      setAuthError('Please enter a username.');
      return;
    }

    if (captchaInput.toUpperCase() !== currentCaptcha) {
      setAuthError('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
      return;
    }

    setIsAuthenticated(true);
    setUserEmail(usernameInput);
    localStorage.setItem('auth_token', 'true');
    localStorage.setItem('user_email', usernameInput);
    
    // Update progress with username if not set
    const p = progressService.getProgress();
    if (!p.userName) {
      progressService.setUserName(usernameInput);
    }
    
    // Update streak on login
    const updatedProgress = progressService.updateStreak();
    setProgress(updatedProgress);

    // Show motivational quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setCurrentQuote(randomQuote);
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 8000);

    triggerConfetti();
    // Redirect to landing page (which will now show the hero section)
    setActiveTab('landing');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setUsernameInput('');
    setCaptchaInput('');
    setIsComputerOn(false);
    setIsACOn(false);
    setIsMeetActive(false);
    setActiveTab('landing');
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          cursor: "always"
        } as any,
        audio: false 
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };
    } catch (err: any) {
      console.error("Screen share error:", err);
      setIsScreenSharing(false);
      if (err.name === 'NotAllowedError') {
        // User denied permission or cancelled
        alert("Screen sharing permission was denied. Please allow access to share your screen.");
      }
    }
  };

  const handleYoutubeStream = () => {
    if (isYoutubeStreaming) {
      setIsYoutubeStreaming(false);
      return;
    }
    setShowYoutubeModal(true);
  };

  const startYoutubeStream = () => {
    if (!youtubeStreamKey.trim()) return;
    setIsYoutubeStreaming(true);
    setShowYoutubeModal(false);
  };

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

  const handleAddSearchTopicToRoadmap = async () => {
    if (!searchQuery.trim() || isAddingTopic) return;
    
    setIsAddingTopic(true);
    try {
      const generalizedName = await getGeneralizedTopicName(searchQuery);
      const challenges = await fetchChallengesForTopic(generalizedName);
      const updatedProgress = progressService.addCustomTopic(generalizedName, challenges);
      setProgress(updatedProgress);
      
      // Automatically expand the new topic and switch to search tab (where roadmap is)
      const newTopic = updatedProgress.customTopics[updatedProgress.customTopics.length - 1];
      if (newTopic) setExpandedTopics(prev => [...prev, newTopic.id]);
      setActiveTab('search');
    } catch (error) {
      console.error("Failed to add search topic to roadmap:", error);
      setProgress(progressService.addCustomTopic(searchQuery));
      setActiveTab('search');
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

  const currentProgress = calculateProgress();
  const masteredCount = progress.completedTopics.length + progress.customTopics.filter(t => t.completed).length;

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6']
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, parts: [{ text: userMessage }] }];
    setChatMessages(newHistory);
    setIsChatTyping(true);

    try {
      const response = await chatWithAI(userMessage, chatMessages);
      setChatMessages([...newHistory, { role: 'model' as const, parts: [{ text: response || "I'm sorry, I couldn't process that." }] }]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleUseReferral = () => {
    if (!referralInput.trim()) return;
    const updated = progressService.useReferral(referralInput);
    setProgress(updated);
    setReferralInput('');
    triggerConfetti();
  };

  const handleSendFriendRequest = () => {
    if (!friendInput.trim()) return;
    const updated = progressService.addFriendRequest(friendInput);
    setProgress(updated);
    setFriendInput('');
  };

  const handleAcceptFriend = (name: string) => {
    const updated = progressService.acceptFriendRequest(name);
    setProgress(updated);
  };

  const handleSendChallenge = (friendName: string) => {
    const challengeProblems: Problem[] = [
      { id: 'bs-1', title: 'Binary Search', url: '#', platform: 'Internal', completed: false },
      { id: 'tp-1', title: 'Two Pointers', url: '#', platform: 'Internal', completed: false }
    ];
    const updated = progressService.sendChallenge(friendName, challengeProblems, 20);
    setProgress(updated);
    triggerConfetti();
  };

  const handleAcceptChallenge = (challengeId: string) => {
    const challenge = progress.challenges.find(c => c.id === challengeId);
    if (!challenge) return;
    const updated = progressService.receiveChallenge(challenge);
    setProgress(updated);
    setActiveTab('speed-coding');
  };

  const [showSilentStudy, setShowSilentStudy] = useState(false);
  const [revisionNeeded, setRevisionNeeded] = useState<{ topicTitle: string; problem: any }[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const revision = progressService.getRevisionProblems();
      setRevisionNeeded(revision);
    }
  }, [isAuthenticated, progress]);

  const handleSpeedCodingComplete = (stats: { timeTaken: number; memoryUsed: number; problemsSolved: number }) => {
    const newStat: SpeedCodingStat = {
      challengeId: Math.random().toString(36).substr(2, 9),
      ...stats,
      timestamp: Date.now()
    };
    const updated = progressService.addSpeedCodingStat(newStat);
    setProgress(updated);
    triggerConfetti();
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <AnimatePresence>
        {isAddingTopic && <BootingLoader />}
      </AnimatePresence>
      {/* Navigation */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Terminal className="text-black w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Shanmukh AI VidyaPeettham
          </span>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10 overflow-x-auto max-w-[60vw]">
          {[
            { id: 'landing', icon: Home, label: 'Home', public: true },
            { id: 'search', icon: Search, label: 'Search', public: false },
            { id: 'visualizer', icon: Play, label: 'Visualizer', public: false },
            { id: 'speed-coding', icon: Zap, label: 'Speed', public: false },
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', public: false },
            { id: 'meet', icon: Video, label: 'Meet', public: false },
            { id: 'about', icon: Info, label: 'About', public: false },
            ...(!isAuthenticated ? [{ id: 'login', icon: LogIn, label: 'Login', public: true }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden group whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-blue-500 text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{tab.label}</span>
              {tab.id === 'meet' && isMeetActive && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
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
          {isAuthenticated && (
            <button
              onClick={() => setShowSilentStudy(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all whitespace-nowrap"
            >
              <Moon className="w-4 h-4" />
              <span className="hidden lg:inline">Focus</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
              <span className="text-xs font-mono text-blue-400 font-bold">{masteredCount} Mastered</span>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('login')}
              className="px-4 py-2 bg-blue-500 text-black rounded-xl text-xs font-bold hover:bg-blue-400 transition-all active:scale-95"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full"
            >
              {!isAuthenticated ? (
                /* Interactive Room for Unauthenticated Users */
                <div className={cn(
                  "relative min-h-[calc(100vh-80px)] overflow-hidden transition-colors duration-1000",
                  isLightOn ? "bg-zinc-100" : "bg-[#050505]"
                )}>
                  {/* Room Environment Effects */}
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
                    isLightOn ? "opacity-0" : "opacity-100"
                  )}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 blur-[120px]" />
                  </div>

                  {/* Ceiling Light */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-800 rounded-b-xl z-20">
                    <div className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full transition-all duration-300",
                      isLightOn ? "bg-yellow-200 shadow-[0_0_50px_20px_rgba(254,240,138,0.5)]" : "bg-zinc-900"
                    )} />
                  </div>

                  {/* Wall Controls */}
                  <div className="absolute top-1/3 left-20 flex flex-col gap-8 z-20">
                    {/* Light Switch */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Light</span>
                      <button 
                        onClick={() => setIsLightOn(!isLightOn)}
                        className={cn(
                          "w-12 h-20 rounded-xl border-4 transition-all flex flex-col p-1",
                          isLightOn ? "bg-yellow-400 border-yellow-500" : "bg-zinc-800 border-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-full h-1/2 rounded-lg transition-all",
                          isLightOn ? "bg-yellow-200 translate-y-full" : "bg-zinc-700"
                        )} />
                      </button>
                    </div>

                    {/* AC Switch */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AC</span>
                      <button 
                        onClick={() => setIsACOn(!isACOn)}
                        className={cn(
                          "w-12 h-20 rounded-xl border-4 transition-all flex flex-col p-1",
                          isACOn ? "bg-blue-400 border-blue-500" : "bg-zinc-800 border-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-full h-1/2 rounded-lg transition-all",
                          isACOn ? "bg-blue-200 translate-y-full" : "bg-zinc-700"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* AC (Wall Mounted) */}
                  <div className="absolute top-10 right-20 z-10">
                    <div className={cn(
                      "relative w-64 h-20 bg-zinc-200 rounded-lg shadow-xl border-b-4 border-zinc-300 transition-all duration-500",
                      !isLightOn && "brightness-50"
                    )}>
                      {/* AC Display */}
                      <div className="absolute top-4 right-4 w-12 h-6 bg-black/80 rounded flex items-center justify-center font-mono text-[10px] text-emerald-400">
                        {isACOn ? "22°C" : "--"}
                      </div>
                      {/* AC Flap */}
                      <motion.div 
                        animate={{ rotateX: isACOn ? 45 : 0 }}
                        className="absolute bottom-0 left-0 w-full h-2 bg-zinc-300 origin-top"
                      />
                      {/* Air Flow Animation */}
                      {isACOn && (
                        <div className="absolute -bottom-12 left-0 w-full flex justify-around pointer-events-none">
                          {[1, 2, 3].map(i => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 0 }}
                              animate={{ opacity: [0, 0.5, 0], y: [0, 20, 40] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                              className="w-px h-8 bg-blue-400/30 blur-sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Computer Setup */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[80%] flex flex-col items-center z-10">
                    {/* Monitor */}
                    <div className="relative w-full max-w-3xl aspect-video bg-zinc-800 rounded-[40px] p-6 border-[12px] border-zinc-700 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                      <div className={cn(
                        "w-full h-full rounded-2xl overflow-hidden transition-all duration-1000 relative",
                        isComputerOn ? "bg-black" : "bg-zinc-900"
                      )}>
                        {isComputerOn ? (
                          <AnimatePresence mode="wait">
                            <motion.div 
                              key="login-screen"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="w-full h-full bg-[#0a0a0a] flex items-center justify-center p-8 relative"
                            >
                              {/* Scanline effect */}
                              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
                              
                              <div className="w-full max-w-sm relative z-20">
                                <div className="flex flex-col items-center text-center mb-8">
                                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-4">
                                    <Terminal className="text-black w-8 h-8" />
                                  </div>
                                  <h1 className="text-2xl font-black mb-1 tracking-tight">System Access</h1>
                                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Authentication Required</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                                    <motion.div 
                                      whileHover={{ scale: 1.02 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      className="relative"
                                    >
                                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                      <input 
                                        type="text"
                                        required
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value)}
                                        placeholder="Enter username"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all"
                                      />
                                    </motion.div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">CAPTCHA</label>
                                    <div className="flex gap-2">
                                      <div className="flex-1 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center font-mono text-lg tracking-[0.3em] text-blue-400 select-none italic line-through decoration-white/20 h-12">
                                        {currentCaptcha}
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={generateCaptcha}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-colors h-12 w-12 flex items-center justify-center"
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <motion.input 
                                      whileHover={{ scale: 1.02 }}
                                      whileFocus={{ scale: 1.02 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      type="text"
                                      required
                                      value={captchaInput}
                                      onChange={(e) => setCaptchaInput(e.target.value)}
                                      placeholder="Enter code"
                                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all uppercase"
                                    />
                                  </div>

                                  {authError && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-2">
                                      <Info className="w-3 h-3" />
                                      {authError}
                                    </div>
                                  )}

                                  <button 
                                    type="submit"
                                    className="w-full py-3 bg-blue-500 text-black rounded-xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                  >
                                    Initialize Session
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </form>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 animate-pulse" />
                          </div>
                        )}
                      </div>
                      
                      {/* Monitor Stand */}
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 h-16 bg-zinc-700" />
                      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-6 bg-zinc-600 rounded-full shadow-2xl" />
                    </div>

                    {/* Desk */}
                    <div className="w-full h-12 bg-zinc-800 mt-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-8 border-zinc-900" />

                    {/* CPU */}
                    <div className="absolute bottom-0 right-20 w-40 h-64 bg-zinc-800 rounded-t-[32px] border-x-[12px] border-t-[12px] border-zinc-700 p-6 flex flex-col items-center gap-6 shadow-2xl">
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                      <button 
                        onClick={() => setIsComputerOn(!isComputerOn)}
                        className={cn(
                          "w-16 h-16 rounded-full border-8 flex items-center justify-center transition-all mt-auto mb-4 group",
                          isComputerOn ? "bg-blue-500 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]" : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        <Power className={cn("w-8 h-8 transition-colors", isComputerOn ? "text-black" : "text-zinc-600 group-hover:text-zinc-500")} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Hero Section for Authenticated Users */
                <>
                  {/* Hero Section */}
                  <div className="relative py-24 px-6 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-500/10 to-transparent blur-[120px]" />
                    </div>
                    
                    <div className="max-w-5xl mx-auto text-center relative z-10">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
                      >
                        <Sparkles className="w-4 h-4" />
                        The Future of CS Education
                      </motion.div>
                      
                      <h1 className="text-7xl font-black mb-8 tracking-tighter leading-[0.9]">
                        WELCOME TO THE <br />
                        <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">AI VIDYAPEETTHAM</span>
                      </h1>
                      
                      <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        An immersive, AI-driven workspace designed to help you master complex computer science concepts through real-time collaboration and personalized roadmaps.
                      </p>
                      
                      <div className="flex flex-wrap justify-center gap-4">
                        <button 
                          onClick={() => setActiveTab('search')}
                          className="px-8 py-4 bg-blue-500 text-black rounded-2xl font-black text-lg hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                        >
                          Go to Dashboard
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setActiveTab('features')}
                          className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-95"
                        >
                          Explore Features
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feature Grid */}
                  <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { title: "AI Roadmaps", desc: "Personalized learning paths generated instantly for any topic.", icon: BookOpen, color: "text-blue-400" },
                      { title: "Real-time Leaderboard", desc: "Compete with students globally and track your ranking.", icon: Trophy, color: "text-yellow-400" },
                      { title: "Interactive Meet", desc: "Collaborate in a virtual classroom with AI-simulated students.", icon: Video, color: "text-emerald-400" }
                    ].map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 glass rounded-[32px] border border-white/10 hover:border-blue-500/30 transition-all group"
                      >
                        <feature.icon className={cn("w-12 h-12 mb-6 group-hover:scale-110 transition-transform", feature.color)} />
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'login' && !isAuthenticated && (
            <motion.div 
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full"
            >
              {/* Interactive Room for Login Tab */}
              <div className={cn(
                "relative min-h-[calc(100vh-80px)] overflow-hidden transition-colors duration-1000",
                isLightOn ? "bg-zinc-100" : "bg-[#050505]"
              )}>
                {/* Room Environment Effects */}
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
                  isLightOn ? "opacity-0" : "opacity-100"
                )}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 blur-[120px]" />
                </div>

                {/* Ceiling Light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-800 rounded-b-xl z-20">
                  <div className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full transition-all duration-300",
                    isLightOn ? "bg-yellow-200 shadow-[0_0_50px_20px_rgba(254,240,138,0.5)]" : "bg-zinc-900"
                  )} />
                </div>

                {/* Wall Controls */}
                <div className="absolute top-1/3 left-20 flex flex-col gap-8 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Light</span>
                    <button 
                      onClick={() => setIsLightOn(!isLightOn)}
                      className={cn(
                        "w-12 h-20 rounded-xl border-4 transition-all flex flex-col p-1",
                        isLightOn ? "bg-yellow-400 border-yellow-500" : "bg-zinc-800 border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-full h-1/2 rounded-lg transition-all",
                        isLightOn ? "bg-yellow-200 translate-y-full" : "bg-zinc-700"
                      )} />
                    </button>
                  </div>

                  {/* AC Switch */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AC</span>
                    <button 
                      onClick={() => setIsACOn(!isACOn)}
                      className={cn(
                        "w-12 h-20 rounded-xl border-4 transition-all flex flex-col p-1",
                        isACOn ? "bg-blue-400 border-blue-500" : "bg-zinc-800 border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-full h-1/2 rounded-lg transition-all",
                        isACOn ? "bg-blue-200 translate-y-full" : "bg-zinc-700"
                      )} />
                    </button>
                  </div>
                </div>

                {/* AC (Wall Mounted) */}
                <div className="absolute top-10 right-20 z-10">
                  <div className={cn(
                    "relative w-64 h-20 bg-zinc-200 rounded-lg shadow-xl border-b-4 border-zinc-300 transition-all duration-500",
                    !isLightOn && "brightness-50"
                  )}>
                    {/* AC Display */}
                    <div className="absolute top-4 right-4 w-12 h-6 bg-black/80 rounded flex items-center justify-center font-mono text-[10px] text-emerald-400">
                      {isACOn ? "22°C" : "--"}
                    </div>
                    {/* AC Flap */}
                    <motion.div 
                      animate={{ rotateX: isACOn ? 45 : 0 }}
                      className="absolute bottom-0 left-0 w-full h-2 bg-zinc-300 origin-top"
                    />
                    {/* Air Flow Animation */}
                    {isACOn && (
                      <div className="absolute -bottom-12 left-0 w-full flex justify-around pointer-events-none">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 0 }}
                            animate={{ opacity: [0, 0.5, 0], y: [0, 20, 40] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                            className="w-px h-8 bg-blue-400/30 blur-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Computer Setup */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[80%] flex flex-col items-center z-10">
                  <div className="relative w-full max-w-3xl aspect-video bg-zinc-800 rounded-[40px] p-6 border-[12px] border-zinc-700 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                    <div className={cn(
                      "w-full h-full rounded-2xl overflow-hidden transition-all duration-1000 relative",
                      isComputerOn ? "bg-black" : "bg-zinc-900"
                    )}>
                      {isComputerOn ? (
                        <AnimatePresence mode="wait">
                          <motion.div 
                            key="login-screen"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full bg-[#0a0a0a] flex items-center justify-center p-8 relative"
                          >
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
                            
                            <div className="w-full max-w-sm relative z-20">
                              <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-4">
                                  <Terminal className="text-black w-8 h-8" />
                                </div>
                                <h1 className="text-2xl font-black mb-1 tracking-tight">System Access</h1>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Authentication Required</p>
                              </div>

                              <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
                                  <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="relative"
                                  >
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                      type="text"
                                      required
                                      value={usernameInput}
                                      onChange={(e) => setUsernameInput(e.target.value)}
                                      placeholder="Enter username"
                                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all"
                                    />
                                  </motion.div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">CAPTCHA</label>
                                  <div className="flex gap-2">
                                    <div className="flex-1 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center font-mono text-lg tracking-[0.3em] text-blue-400 select-none italic line-through decoration-white/20 h-12">
                                      {currentCaptcha}
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={generateCaptcha}
                                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-colors h-12 w-12 flex items-center justify-center"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <motion.input 
                                    whileHover={{ scale: 1.02 }}
                                    whileFocus={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    type="text"
                                    required
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    placeholder="Enter code"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all uppercase"
                                  />
                                </div>

                                {authError && (
                                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-2">
                                    <Info className="w-3 h-3" />
                                    {authError}
                                  </div>
                                )}

                                <button 
                                  type="submit"
                                  className="w-full py-3 bg-blue-500 text-black rounded-xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                >
                                  Initialize Session
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </form>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 animate-pulse" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 h-16 bg-zinc-700" />
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-6 bg-zinc-600 rounded-full shadow-2xl" />
                  </div>

                  <div className="w-full h-12 bg-zinc-800 mt-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-8 border-zinc-900" />

                  <div className="absolute bottom-0 right-20 w-40 h-64 bg-zinc-800 rounded-t-[32px] border-x-[12px] border-t-[12px] border-zinc-700 p-6 flex flex-col items-center gap-6 shadow-2xl">
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full" />
                    <button 
                      onClick={() => setIsComputerOn(!isComputerOn)}
                      className={cn(
                        "w-16 h-16 rounded-full border-8 flex items-center justify-center transition-all mt-auto mb-4 group",
                        isComputerOn ? "bg-blue-500 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]" : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                      )}
                    >
                      <Power className={cn("w-8 h-8 transition-colors", isComputerOn ? "text-black" : "text-zinc-600 group-hover:text-zinc-500")} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto px-6 py-24"
            >
              <button 
                onClick={() => setActiveTab('landing')}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </button>

              <div className="text-center mb-20">
                <h1 className="text-6xl font-black mb-6 tracking-tight">Explore Our <span className="text-blue-500">Features</span></h1>
                <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                  AI Vidyapeettham is a comprehensive platform designed to revolutionize how you learn and practice computer science.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                  {
                    title: "Roadmap Learning System",
                    desc: "Our AI generates personalized, step-by-step learning paths for any CS topic. From Data Structures to Machine Learning, get a clear visual roadmap with curated resources.",
                    icon: BookOpen,
                    color: "bg-blue-500/20 text-blue-400"
                  },
                  {
                    title: "Problem Searching & Practice",
                    desc: "Search for specific coding problems or concepts. Our system fetches relevant challenges from top platforms like LeetCode and GeeksforGeeks for you to practice.",
                    icon: Search,
                    color: "bg-emerald-500/20 text-emerald-400"
                  },
                  {
                    title: "Leaderboard & Gamification",
                    desc: "Stay motivated with our global ranking system. Earn points by completing topics and solving problems. Compete with peers and climb the leaderboard.",
                    icon: Trophy,
                    color: "bg-yellow-500/20 text-yellow-400"
                  },
                  {
                    title: "Games Section",
                    desc: "Learn while having fun! Our games section includes logic puzzles and coding-themed games like 2048 to keep your mind sharp.",
                    icon: Zap,
                    color: "bg-purple-500/20 text-purple-400"
                  },
                  {
                    title: "Dummy Seminar Environment",
                    desc: "Experience a virtual classroom with AI-simulated students. Practice teaching or presenting concepts in an interactive environment that reacts to your input.",
                    icon: Video,
                    color: "bg-red-500/20 text-red-400"
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 glass rounded-[40px] border border-white/10 flex flex-col items-start gap-6"
                  >
                    <div className={cn("p-4 rounded-2xl", feature.color)}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                      <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'search' && isAuthenticated && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto px-6 py-12"
            >
              {/* Search Section */}
              <div className="max-w-4xl mx-auto mb-20">
                <div className="text-center mb-12">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    AI-Powered Global Learning
                  </motion.div>
                  <h1 className="text-6xl font-black mb-4 tracking-tight leading-tight">
                    Master Any <span className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">CS Concept</span>
                  </h1>
                  <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Fetch the best resources from across the globe. 
                    Get the most efficient path to expertise, instantly.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="relative mb-12 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter a concept (e.g., Dynamic Programming, Kubernetes, Rust Ownership...)"
                      className="w-full h-16 bg-zinc-900 border border-white/10 rounded-2xl px-6 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-blue-500 text-black rounded-xl font-bold flex items-center gap-2 hover:bg-blue-400 transition-all active:scale-95 disabled:opacity-50"
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
                        <Globe className="w-32 h-32 text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Globe className="w-5 h-5" />
                          <span className="text-sm font-bold uppercase tracking-widest">Global Insights</span>
                        </div>
                        <button
                          onClick={handleAddSearchTopicToRoadmap}
                          disabled={isAddingTopic}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
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
                            className="group p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-blue-500/30"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-blue-400 group-hover:underline truncate flex-1">
                                {source.title}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
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
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 hover:border-blue-500/30 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Concept Dependency Graph */}
              <div className="mb-20 pt-20 border-t border-white/5">
                <ConceptGraph completedTopics={progress.completedTopics} />
              </div>

              {/* Roadmap Section */}
              <div className="pt-20 border-t border-white/5">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-4xl font-black mb-2">My Learning Roadmap</h2>
                    <p className="text-zinc-400">Your personalized path to mastery.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-blue-400">{currentProgress}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Complete</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <div className="lg:col-span-2 glass rounded-3xl p-8 relative overflow-hidden">
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-8">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${currentProgress}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      />
                    </div>

                    <div className="space-y-6">
                      {progress.customTopics.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No topics in your roadmap yet. Search for concepts to add them!</p>
                        </div>
                      ) : (
                        progress.customTopics.map((topic, i) => (
                          <div key={topic.id} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-lg">{topic.title}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  {topic.problems.filter(p => p.completed).length} / {topic.problems.length} Problems
                                </span>
                                {topic.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {topic.problems.map(prob => (
                                <div key={prob.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => {
                                        const newProgress = progressService.toggleProblemCompletion(topic.id, prob.id);
                                        setProgress(newProgress);
                                      }}
                                      className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                        prob.completed ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-blue-500"
                                      )}
                                    >
                                      {prob.completed && <CheckCircle2 className="w-3 h-3 text-black" />}
                                    </button>
                                    <span className={cn("text-sm", prob.completed ? "text-zinc-500 line-through" : "text-zinc-300")}>
                                      {prob.title}
                                    </span>
                                  </div>
                                  <a href={prob.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass rounded-3xl p-8 border-blue-500/20">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Learning Activity</h3>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={Array.from({ length: 7 }).map((_, i) => {
                            const date = subDays(new Date(), 6 - i);
                            const count = progress.completionHistory.filter(h => isSameDay(new Date(h.timestamp), date)).length;
                            return { name: format(date, 'EEE'), count };
                          })}>
                            <defs>
                              <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProgress)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-8 border-yellow-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Achievement</span>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <p className="text-xs text-zinc-400 italic leading-relaxed">
                        Complete your roadmap to unlock a verified professional certificate and showcase your expertise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}





                                        <div className="h-px bg-white/5 w-full" />
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Globe className="w-3 h-3" />
                                            Comprehensive Problem List ({relatedProblems.length})
                                          </h4>
                                          {relatedProblems.length > 10 && (
                                            <button 
                                              onClick={() => setShowMoreProblems(prev => ({ ...prev, [topic.id]: !showAll }))}
                                              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                                            >
                                              {showAll ? 'Show Less' : `Show All (${relatedProblems.length})`}
                                            </button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {visibleRelated.map((prob: any) => (
                                            <div 
                                              key={prob.id}
                                              className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                prob.completed ? "bg-blue-500/10 border-blue-500/20" : "bg-white/5 border-white/5 hover:border-white/10"
                                              )}
                                            >
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                <button 
                                                  onClick={() => {
                                                    const newProgress = progressService.toggleProblemCompletion(topic.id, prob.id);
                                                    setProgress(newProgress);
                                                    const topicAfter = newProgress.customTopics.find(t => t.id === topic.id);
                                                    if (topicAfter?.completed && !topic.completed) {
                                                      triggerConfetti();
                                                    }
                                                  }}
                                                  className="shrink-0"
                                                >
                                                  {prob.completed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                                  ) : (
                                                    <Circle className="w-5 h-5 text-zinc-700" />
                                                  )}
                                                </button>
                                                <div className="flex flex-col overflow-hidden">
                                                  <span className={cn(
                                                    "text-sm font-medium truncate",
                                                    prob.completed ? "text-zinc-500 line-through" : "text-zinc-300"
                                                  )}>
                                                    {prob.title}
                                                  </span>
                                                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">{prob.platform}</span>
                                                </div>
                                              </div>
                                              <a 
                                                href={prob.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-zinc-600 hover:text-blue-400 transition-colors shrink-0"
                                              >
                                                <ExternalLink className="w-4 h-4" />
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
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
                  className="mt-12 p-8 glass rounded-3xl border-blue-500/50 bg-blue-500/5 text-center relative overflow-hidden"
                >
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
                  
                  <Award className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-3xl font-black mb-2">Congratulations, {progress.userName || 'Scholar'}!</h2>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    You have successfully completed your custom roadmap. You are now officially a Master of your selected CS concepts.
                  </p>
                  
                  <button 
                    onClick={downloadCertificate}
                    className="px-8 py-4 bg-blue-500 text-black rounded-2xl font-bold flex items-center gap-2 mx-auto hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Download Certificate
                  </button>

                  {/* Hidden Certificate for Generation */}
                  <div className="fixed left-[-9999px] top-0">
                    <div 
                      ref={certificateRef}
                      style={{ backgroundColor: '#0a0a0a', borderColor: '#3b82f6' }}
                      className="w-[1000px] h-[700px] border-[20px] pt-20 px-20 pb-28 flex flex-col items-center justify-between text-white font-sans relative"
                    >
                      <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div style={{ background: 'radial-gradient(circle at center, #3b82f6, transparent, transparent)' }} className="w-full h-full" />
                      </div>
                      
                      <div className="text-center w-full">
                        <div style={{ backgroundColor: '#3b82f6' }} className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
                          <Terminal style={{ color: '#000000' }} className="w-12 h-12" />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4 w-full text-center">CERTIFICATE OF EXCELLENCE</h1>
                        <div className="flex justify-center w-full mb-8">
                          <div style={{ backgroundColor: '#3b82f6' }} className="h-1 w-64" />
                        </div>
                        <p style={{ color: '#a1a1aa' }} className="text-xl uppercase tracking-[0.3em] font-bold">This is to certify that</p>
                      </div>

                      <div className="text-center">
                        <h2 style={{ color: '#60a5fa' }} className="text-8xl font-black mb-4">{progress.userName || 'Student'}</h2>
                        <p style={{ color: '#d4d4d8' }} className="text-2xl max-w-2xl mx-auto leading-relaxed">
                          has successfully completed the global computer science roadmap and demonstrated mastery over advanced technical concepts at Shanmukh AI VidyaPeettham.
                        </p>
                      </div>

                      <div className="w-full flex justify-between items-end px-4">
                        <div className="text-left">
                          <div style={{ backgroundColor: '#3f3f46' }} className="h-px w-48 mb-4" />
                          <p style={{ color: '#71717a' }} className="text-sm font-bold uppercase tracking-widest">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-center mb-[-10px]">
                          <Award style={{ color: '#3b82f6' }} className="w-20 h-20 mb-2" />
                          <p style={{ color: '#3b82f6' }} className="text-xs font-bold uppercase tracking-widest">Official Seal</p>
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

          {activeTab === 'dashboard' && isAuthenticated && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto p-8"
            >
              {/* Dashboard Header */}
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[32px] bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                    <User className="w-12 h-12 text-black" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black mb-1 tracking-tighter">{progress.userName || 'Scholar'}</h1>
                    <p className="text-zinc-500 font-medium">{userEmail}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Rank #{Math.max(1, 150 - (progress.completionHistory.length * 2))}</span>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                        <Star className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          {progress.completionHistory.filter(h => h.type === 'problem').length * 10 + 
                           progress.completionHistory.filter(h => h.type === 'topic').length * 50} Points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="glass p-6 rounded-[32px] border-orange-500/20 bg-orange-500/5 text-center min-w-[140px]">
                    <div className="text-3xl font-black text-orange-500 flex items-center justify-center gap-2">
                      <Flame className="w-6 h-6" />
                      {progress.streak.current}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Day Streak</div>
                  </div>
                  <div className="glass p-6 rounded-[32px] border-purple-500/20 bg-purple-500/5 text-center min-w-[140px]">
                    <div className="text-3xl font-black text-purple-500">
                      {progress.completionHistory.filter(h => h.type === 'problem').length >= 1 ? 
                        [
                          progress.completionHistory.filter(h => h.type === 'problem').length >= 1,
                          progress.completionHistory.filter(h => h.type === 'topic').length >= 1,
                          progress.completionHistory.filter(h => h.type === 'problem').length >= 10,
                          progress.streak.current >= 3,
                          progress.completionHistory.filter(h => h.type === 'topic').length >= 5,
                          calculateProgress() === 100
                        ].filter(Boolean).length : 0}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Achievements</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Analytics & Visuals */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Heatmap Section */}
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <Activity className="w-6 h-6 text-emerald-500" />
                        Coding Consistency
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Intensity</span>
                        <div className="flex gap-1">
                          {[0.1, 0.3, 0.6, 1].map(op => (
                            <div key={op} className="w-2 h-2 rounded-sm bg-emerald-500" style={{ opacity: op }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <CodingHeatmap data={(() => {
                      const data: { [key: string]: number } = {};
                      progress.completionHistory.forEach(h => {
                        const date = format(new Date(h.timestamp), 'yyyy-MM-dd');
                        data[date] = (data[date] || 0) + 1;
                      });
                      return data;
                    })()} />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Activity Trend */}
                    <div className="glass p-8 rounded-[40px] border border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          Activity Trend
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">7D</span>
                      </div>
                      <div className="h-[200px] w-full">
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
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                              itemStyle={{ color: '#3b82f6' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Learning Distribution */}
                    <div className="glass p-8 rounded-[40px] border border-white/5">
                      <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-purple-500" />
                        Focus Areas
                      </h3>
                      <div className="h-[200px] w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Problems', value: progress.completionHistory.filter(h => h.type === 'problem').length },
                                { name: 'Topics', value: progress.completionHistory.filter(h => h.type === 'topic').length },
                              ].filter(d => d.value > 0).length > 0 ? [
                                { name: 'Problems', value: progress.completionHistory.filter(h => h.type === 'problem').length },
                                { name: 'Topics', value: progress.completionHistory.filter(h => h.type === 'topic').length },
                              ] : [{ name: 'No Data', value: 1 }]}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"
                            >
                              <Cell fill="#3b82f6" />
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#27272a" />
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Problems</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Topics</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topic Mastery */}
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Code2 className="w-6 h-6 text-blue-500" />
                      Topic Mastery
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {progress.customTopics.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-zinc-500 text-sm">Start learning to see topic-wise progress.</div>
                      ) : (
                        progress.customTopics.slice(0, 4).map((topic, i) => {
                          const completed = topic.problems.filter(p => p.completed).length;
                          const total = topic.problems.length;
                          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <div className="flex justify-between text-xs font-bold mb-3">
                                <span>{topic.title}</span>
                                <span className="text-blue-400">{pct}%</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400" 
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Achievements Section */}
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Award className="w-6 h-6 text-yellow-500" />
                      Milestones & Badges
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {[
                        { id: 'first', icon: Zap, label: 'First Step', desc: '1 Problem', achieved: progress.completionHistory.filter(h => h.type === 'problem').length >= 1 },
                        { id: 'topic', icon: BookOpen, label: 'Topic Master', desc: '1 Topic', achieved: progress.completionHistory.filter(h => h.type === 'topic').length >= 1 },
                        { id: 'scholar', icon: Award, label: 'Scholar', desc: '10 Problems', achieved: progress.completionHistory.filter(h => h.type === 'problem').length >= 10 },
                        { id: 'streak', icon: Flame, label: 'On Fire', desc: '3 Day Streak', achieved: progress.streak.current >= 3 },
                        { id: 'expert', icon: Star, label: 'Expert', desc: '5 Topics', achieved: progress.completionHistory.filter(h => h.type === 'topic').length >= 5 },
                        { id: 'perfect', icon: CheckCircle2, label: 'Perfect', desc: '100% Roadmap', achieved: calculateProgress() === 100 && progress.customTopics.length > 0 },
                      ].map((badge) => (
                        <div 
                          key={badge.id}
                          className={cn(
                            "p-4 rounded-2xl border flex flex-col items-center text-center transition-all group relative",
                            badge.achieved 
                              ? "glass border-yellow-500/30 bg-yellow-500/5" 
                              : "bg-white/5 border-white/5 opacity-40 grayscale"
                          )}
                        >
                          <badge.icon className={cn("w-8 h-8 mb-3 transition-transform group-hover:scale-110", badge.achieved ? "text-yellow-400" : "text-zinc-600")} />
                          <div className="text-[10px] font-bold mb-1">{badge.label}</div>
                          <div className="text-[8px] text-zinc-500 uppercase tracking-tighter">{badge.desc}</div>
                          {badge.achieved && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="w-2.5 h-2.5 text-black" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Social & Leaderboard */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Social Card */}
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-500" />
                        Social
                      </h3>
                      <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Friends List (Truncated) */}
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Friends Online</div>
                        <div className="space-y-3">
                          {friends.slice(0, 3).map(friend => (
                            <div key={friend.email} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                    {friend.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className={cn(
                                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a]",
                                    friend.status === 'online' ? "bg-emerald-500" : "bg-zinc-600"
                                  )} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold">{friend.name}</div>
                                  <div className="text-[10px] text-zinc-500">{friend.status}</div>
                                </div>
                              </div>
                              <button className="p-2 text-zinc-500 hover:text-blue-400 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {friends.length > 3 && (
                            <button className="w-full py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                              View All {friends.length} Friends
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Referral Code */}
                      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Your Referral Code</div>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono font-bold">SHANMUKH-{userEmail?.split('@')[0].toUpperCase()}</code>
                          <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-all">
                            <Share2 className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Preview */}
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      Top Scholars
                    </h3>
                    <div className="space-y-4">
                      {globalLeaderboard.slice(0, 5).map((user, i) => (
                        <div 
                          key={user.email} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-2xl transition-all",
                            user.email === userEmail ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                              i === 0 ? "bg-yellow-500 text-black" : 
                              i === 1 ? "bg-zinc-300 text-black" : 
                              i === 2 ? "bg-orange-500 text-black" : 
                              "bg-zinc-800 text-zinc-400"
                            )}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold">{user.name}</div>
                              <div className="text-[10px] text-zinc-500">{user.points} pts</div>
                            </div>
                          </div>
                          {i < 3 && <Award className={cn("w-4 h-4", i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-orange-500")} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Revision */}
                  <div className="glass p-8 rounded-[40px] border border-white/5 bg-red-500/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-red-400" />
                      Priority Revision
                    </h3>
                    <div className="space-y-3">
                      {progress.customTopics.filter(t => t.problems.some(p => !p.completed)).slice(0, 2).map((topic, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="text-xs font-bold mb-1">{topic.title}</div>
                          <div className="text-[10px] text-zinc-500">
                            {topic.problems.filter(p => !p.completed).length} pending problems
                          </div>
                        </div>
                      ))}
                      {progress.customTopics.length === 0 && (
                        <div className="text-xs text-zinc-500 italic">No pending topics found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed (Full Width) */}
              <div className="mt-8 glass p-8 rounded-[40px] border border-white/5">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-500" />
                  Recent Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.completionHistory.slice(-9).reverse().map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        item.type === 'problem' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                      )}>
                        {item.type === 'problem' ? <Code2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{item.title}</div>
                        <div className="text-[10px] text-zinc-500">{format(new Date(item.timestamp), 'MMM dd, HH:mm')}</div>
                      </div>
                    </div>
                  ))}
                  {progress.completionHistory.length === 0 && (
                    <div className="col-span-full text-center py-8 text-zinc-500 text-sm">No recent activity recorded.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}




          {activeTab === 'visualizer' && isAuthenticated && (
            <motion.div 
              key="visualizer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <ConceptVisualizer />
            </motion.div>
          )}

          {activeTab === 'speed-coding' && isAuthenticated && (
            <motion.div 
              key="speed-coding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <SpeedCoding onComplete={handleSpeedCodingComplete} />
            </motion.div>
          )}



          {activeTab === 'games' && isAuthenticated && (
            <motion.div 
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                    <Zap className="w-10 h-10 text-yellow-500" />
                    Brain Games
                  </h1>
                  <p className="text-zinc-400">Take a mental break and sharpen your logic.</p>
                </div>
                
                <div className="flex gap-4">
                  <div className="glass px-6 py-3 rounded-2xl border-blue-500/20 bg-blue-500/5">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Daily Attempts</div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-3 h-3 rounded-full",
                            i <= gameAttempts ? "bg-blue-500" : "bg-white/10"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  {lockoutUntil > Date.now() && (
                    <div className="glass px-6 py-3 rounded-2xl border-red-500/20 bg-red-500/5">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Reset In</div>
                      <div className="text-sm font-black text-red-400">
                        {(() => {
                          const diff = lockoutUntil - Date.now();
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          const secs = Math.floor((diff % (1000 * 60)) / 1000);
                          return `${hours}h ${mins}m ${secs}s`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-8 rounded-[40px] border border-white/5 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-8">
                    <div>
                      <h3 className="text-2xl font-black">2048</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Merge tiles to win</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="glass px-4 py-2 rounded-xl text-center">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Score</div>
                        <div className="text-lg font-black text-blue-500">{gameScore}</div>
                      </div>
                      <div className="glass px-4 py-2 rounded-xl text-center">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Best</div>
                        <div className="text-lg font-black text-yellow-500">{gameHighScore}</div>
                      </div>
                    </div>
                  </div>

                  <div className="aspect-square w-full max-w-[400px] bg-zinc-900 rounded-2xl p-4 grid grid-cols-4 gap-4 relative">
                    {grid.flat().map((val, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded-lg flex items-center justify-center text-2xl font-black transition-all duration-100",
                          val === 0 ? "bg-white/5 text-transparent" : 
                          val === 2 ? "bg-zinc-200 text-zinc-900" :
                          val === 4 ? "bg-zinc-100 text-zinc-900" :
                          val === 8 ? "bg-orange-200 text-zinc-900" :
                          val === 16 ? "bg-orange-300 text-zinc-900" :
                          val === 32 ? "bg-orange-400 text-white" :
                          val === 64 ? "bg-orange-500 text-white" :
                          val === 128 ? "bg-yellow-200 text-zinc-900 shadow-[0_0_10px_rgba(254,240,138,0.5)]" :
                          val === 256 ? "bg-yellow-300 text-zinc-900 shadow-[0_0_15px_rgba(253,224,71,0.6)]" :
                          val === 512 ? "bg-yellow-400 text-zinc-900 shadow-[0_0_20px_rgba(250,204,21,0.7)]" :
                          val === 1024 ? "bg-yellow-500 text-white shadow-[0_0_25px_rgba(234,179,8,0.8)]" :
                          "bg-yellow-600 text-white shadow-[0_0_30px_rgba(202,138,4,0.9)]"
                        )}
                      >
                        {val !== 0 ? val : ''}
                      </div>
                    ))}
                    
                    {lockoutUntil > Date.now() && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                          <Clock className="w-10 h-10 text-red-500" />
                        </div>
                        <h4 className="text-2xl font-black mb-4">Daily Limit Reached</h4>
                        <p className="text-zinc-400 mb-8 max-w-xs">
                          You've completed your 3 daily sessions. Take a break and focus on your learning goals!
                        </p>
                        <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Next Session Available In</div>
                        <div className="text-3xl font-black text-white">
                          {(() => {
                            const diff = lockoutUntil - Date.now();
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const secs = Math.floor((diff % (1000 * 60)) / 1000);
                            return `${hours}h ${mins}m ${secs}s`;
                          })()}
                        </div>
                      </div>
                    )}

                    {grid.flat().every(v => v !== 0) && lockoutUntil <= Date.now() && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center p-6">
                        <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Game Over!</h4>
                        <p className="text-sm text-zinc-400 mb-6">Final Score: {gameScore}</p>
                        <button 
                          onClick={initGame}
                          className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl hover:bg-blue-400 transition-all active:scale-95"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {lockoutUntil <= Date.now() && (
                    <div className="mt-8 flex gap-4">
                      <button 
                        onClick={initGame}
                        className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl hover:bg-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        {gameAttempts === 0 ? 'Start First Game' : 'New Session'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-400" />
                      How to Play
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Controls</div>
                        <div className="grid grid-cols-3 gap-2 max-w-[120px]">
                          <div />
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <ChevronUp className="w-4 h-4" />
                          </div>
                          <div />
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <ChevronLeft className="w-4 h-4" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2">Use Arrow Keys to move tiles</p>
                      </div>

                      <div className="space-y-4">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Instructions</div>
                        <ol className="space-y-3 text-sm text-zinc-400">
                          <li className="flex gap-3">
                            <span className="text-blue-500 font-bold">01.</span>
                            <span>When two tiles with the same number touch, they <b>merge into one</b>!</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="text-blue-500 font-bold">02.</span>
                            <span>Every move spawns a new tile (2 or 4) in an empty spot.</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="text-blue-500 font-bold">03.</span>
                            <span>Plan your moves to keep the largest tiles in a corner.</span>
                          </li>
                        </ol>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Winning Rule</div>
                        <p className="text-sm text-zinc-400">
                          Create a tile with the number <span className="text-yellow-500 font-bold">2048</span> to win the game!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[40px] border border-white/5 bg-blue-500/5">
                    <h3 className="text-lg font-bold mb-2">Daily Play Policy</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      To ensure a balanced learning experience, we limit gaming to 3 sessions per day. Use these breaks to recharge your mind!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && isAuthenticated && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <div className="glass rounded-[40px] overflow-hidden border border-white/5 mb-12">
                <div className="h-64 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 relative">
                  <div className="absolute -bottom-16 left-12">
                    <div className="w-40 h-40 rounded-3xl bg-zinc-900 border-4 border-[#0a0a0a] flex items-center justify-center shadow-2xl overflow-hidden">
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                        <User className="w-20 h-20 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-24 pb-12 px-12">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
                    <div>
                      <h1 className="text-5xl font-black mb-2 tracking-tighter">Pavan Shanmukh Kakarla</h1>
                      <p className="text-blue-400 font-bold text-xl">3rd Year B.Tech CSIT Undergraduate</p>
                      <p className="text-zinc-500">KL University • India</p>
                    </div>
                    <div className="flex gap-3">
                      <a href="https://github.com/PavanShanmukh" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                        <Github className="w-6 h-6" />
                      </a>
                      <button className="px-6 py-4 bg-blue-500 text-black font-bold rounded-2xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20">
                        Contact Me
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="text-blue-400 mb-2"><Award className="w-6 h-6" /></div>
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
                      <div className="text-sm font-bold mb-1">Interests</div>
                      <div className="text-xs text-zinc-500">AI, Blockchain, CyberSec</div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <section>
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Info className="w-6 h-6 text-blue-500" />
                        Professional Summary
                      </h3>
                      <p className="text-zinc-400 leading-relaxed text-lg">
                        I am a passionate Computer Science and Information Technology student at KL University, currently in my 3rd year. 
                        My academic focus is on Distributed Ledger Analytics, where I explore the intersection of blockchain technology and data science.
                        I specialize in building secure, scalable full-stack applications with a focus on proactive security measures.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-blue-500" />
                        Featured Projects
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          {
                            title: "Ransomware Pre-Encryption Detection System",
                            description: "Built a proactive ransomware detection system using behavioral anomaly monitoring. Designed real-time file system tracking with Watchdog, implemented threshold-based mass rename detection, secure event ingestion via Flask API, MySQL logging, email alerting, and automated analytical report generation.",
                            tags: ["Python", "Flask", "MySQL", "Cybersecurity"],
                            repo: "https://github.com/PavanShanmukh/ransomware-detection"
                          },
                          {
                            title: "Word Count using AVL Tree",
                            description: "Analyzed text documents and counted unique words and frequencies using self-balancing AVL trees for optimal performance.",
                            tags: ["C++", "Data Structures", "Algorithms"],
                            repo: "https://github.com/PavanShanmukh/word-count-avl"
                          },
                          {
                            title: "Distributed Ledger Analytics Tool",
                            description: "A research project exploring data patterns in distributed ledgers to identify anomalies and trends.",
                            tags: ["Blockchain", "Analytics", "Research"],
                            repo: "https://github.com/PavanShanmukh/ledger-analytics"
                          }
                        ].map((project, i) => (
                          <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
                            <h4 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{project.title}</h4>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mb-8">
                              {project.tags.map((tag, j) => (
                                <span key={j} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 rounded-md text-zinc-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <a 
                              href={project.repo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:underline"
                            >
                              <Github className="w-4 h-4" />
                              View Repository
                            </a>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Meet Tab - Persistent if active */}
          {(activeTab === 'meet' || isMeetActive) && isAuthenticated && (
            <motion.div 
              key="meet"
              initial={activeTab === 'meet' ? { opacity: 0, scale: 0.95 } : false}
              animate={activeTab === 'meet' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, pointerEvents: 'none' }}
              className={cn(
                "h-[calc(100vh-64px)] p-6 flex flex-col",
                activeTab !== 'meet' && "hidden"
              )}
            >
              {!isMeetActive ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="max-w-md w-full glass rounded-3xl p-8 text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Video className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Teaching Room</h2>
                    <p className="text-zinc-400 mb-8">
                      Practice teaching to AI students. They'll listen, ask questions, and respond based on your instructions.
                      <br /><span className="text-[10px] text-blue-500/60 mt-2 block">Tip: Use the monitor icon to share your screen and present your concepts.</span>
                    </p>
                    
                    <div className="text-left mb-8">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Student Persona</label>
                      <select 
                        value={studentInstruction}
                        onChange={(e) => setStudentInstruction(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                      >
                        <option value="A curious beginner who asks deep questions">Curious Beginner</option>
                        <option value="A skeptical student who needs proof for everything">Skeptical Expert</option>
                        <option value="A distracted student who needs engagement">Distracted Peer</option>
                        <option value="A supportive friend who encourages you">Supportive Friend</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => setIsMeetActive(true)}
                      className="w-full py-4 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
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

                      {(isCamOn || isScreenSharing) ? (
                        <div className="absolute inset-0 flex items-center justify-center p-12 z-20">
                          <div className="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-2xl bg-black">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              muted 
                              playsInline 
                              className={cn(
                                "w-full h-full",
                                isScreenSharing ? "object-contain" : "object-cover mirror"
                              )}
                            />
                            {/* Podium Overlay */}
                            {!isScreenSharing && (
                              <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t-4 border-zinc-800 flex items-center justify-center">
                                <div className="w-32 h-4 bg-blue-500/20 rounded-full" />
                              </div>
                            )}
                            {isScreenSharing && (
                              <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg">
                                <Monitor className="w-3 h-3" />
                                Sharing Screen
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 z-20">
                          <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <VideoOff className="w-12 h-12 text-blue-500/50" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 glass rounded-full z-30">
                        <button 
                          onClick={() => setIsPresenting(!isPresenting)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            isPresenting ? "bg-blue-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
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
                          title={isMicOn ? "Mute" : "Unmute"}
                        >
                          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setIsCamOn(!isCamOn)}
                          className={cn(
                            "p-3 rounded-full transition-all",
                            isCamOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"
                          )}
                          title={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
                        >
                          {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={handleScreenShare}
                          className={cn(
                            "p-3 rounded-full transition-all",
                            isScreenSharing ? "bg-blue-500 text-black" : "bg-white/10 hover:bg-white/20"
                          )}
                          title="Share Screen"
                        >
                          <Monitor className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleYoutubeStream}
                          className={cn(
                            "p-3 rounded-full transition-all",
                            isYoutubeStreaming ? "bg-red-500 text-white animate-pulse" : "bg-white/10 hover:bg-white/20"
                          )}
                          title="YouTube Live"
                        >
                          <Youtube className="w-5 h-5" />
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
                          isPresenting ? "bg-blue-500" : "bg-red-500"
                        )} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {isPresenting ? 'Mode: Seminar Presentation' : 'Mode: Teaching Room'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 h-32">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-2xl flex items-center justify-center relative overflow-hidden group">
                          <Users className="w-8 h-8 text-zinc-800 group-hover:text-blue-500/20 transition-colors" />
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
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-sm">Participants</span>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full font-bold">4 Online</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {[
                          { name: progress.userName || 'You', role: 'Teacher', status: 'Host', color: 'bg-blue-500' },
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
                                <div className="w-1 h-1 rounded-full bg-blue-500" />
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
                        <MessageSquare className="w-4 h-4 text-blue-400" />
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
                                ? "bg-blue-500 text-black rounded-tr-none" 
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
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
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
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                          <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 transition-colors"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube Streaming Modal */}
              <AnimatePresence>
                {showYoutubeModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowYoutubeModal(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                          <Youtube className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black">YouTube Live</h3>
                          <p className="text-xs text-zinc-500">Stream your session directly to YouTube</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Stream Key</label>
                          <div className="relative">
                            <input 
                              type="password"
                              value={youtubeStreamKey}
                              onChange={(e) => setYoutubeStreamKey(e.target.value)}
                              placeholder="Paste your YouTube stream key here..."
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            />
                            <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                            Find your stream key in the <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">YouTube Studio</a>. Similar to OBS setup.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => setShowYoutubeModal(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={startYoutubeStream}
                            disabled={!youtubeStreamKey.trim()}
                            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95"
                          >
                            Go Live
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        {/* Floating Back to Meeting Button */}
        <AnimatePresence>
          {isMeetActive && activeTab !== 'meet' && (
            <motion.button
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.8 }}
              onClick={() => setActiveTab('meet')}
              className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 bg-blue-500 text-black rounded-2xl font-black shadow-2xl shadow-blue-500/40 hover:bg-blue-400 transition-all active:scale-95 group"
            >
              <div className="relative">
                <Video className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-blue-500 rounded-full animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest opacity-70 leading-none mb-1">Live Session</div>
                <div className="text-sm">Back to Meeting</div>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
        </AnimatePresence>
      </main>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        .prose h1, .prose h2, .prose h3 {
          @apply text-blue-400 font-bold mt-6 mb-4;
        }
        .prose p {
          @apply text-zinc-300 mb-4 leading-relaxed;
        }
        .prose ul {
          @apply list-disc list-inside space-y-2 mb-4 text-zinc-300;
        }
        .prose a {
          @apply text-blue-400 hover:underline;
        }
        .prose code {
          @apply bg-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm;
        }
      `}</style>

      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-black rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center hover:scale-110 transition-all active:scale-95 z-[100]"
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Sidebar Chat */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-20 right-6 bottom-24 w-80 sm:w-96 glass rounded-3xl border border-white/10 shadow-2xl z-[90] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">AI Tutor</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <Terminal className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-bold mb-2">How can I help you?</h4>
                  <p className="text-xs text-zinc-500">Ask me anything about coding, your roadmap, or technical concepts.</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-blue-500 text-black rounded-tr-none" 
                      : "bg-white/5 border border-white/10 rounded-tl-none"
                  )}>
                    <Markdown>{msg.parts[0].text}</Markdown>
                  </div>
                </div>
              ))}
              {isChatTyping && (
                <div className="flex flex-col items-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-white/5 border-t border-white/10">
              <div className="relative">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask something..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button 
                  type="submit"
                  disabled={isChatTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
        <AnimatePresence>
          {showSilentStudy && (
            <SilentStudy onClose={() => setShowSilentStudy(false)} />
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
