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
  Share2
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
import { progressService, Progress } from './services/progress';
import { cn } from './lib/utils';

type Tab = 'search' | 'progress' | 'meet' | 'leaderboard' | 'games' | 'about';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
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
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<{ email: string; name: string; points: number; lastUpdate: number }[]>([]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!emailInput.toLowerCase().endsWith('@gmail.com')) {
      setAuthError('Only @gmail.com accounts are accepted.');
      return;
    }

    setIsSendingOtp(true);
    // Simulate network delay for "sending" OTP
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setLoginStep('otp');
      setIsSendingOtp(false);
      // In a real frontend-only demo, we'll show the OTP in a toast or console
      console.log(`[AUTH DEBUG] OTP for ${emailInput}: ${code}`);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpInput.join('');
    
    if (enteredOtp === generatedOtp) {
      setIsAuthenticated(true);
      setUserEmail(emailInput);
      localStorage.setItem('auth_token', 'true');
      localStorage.setItem('user_email', emailInput);
      triggerConfetti();
    } else {
      setAuthError('Invalid OTP. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setLoginStep('email');
    setEmailInput('');
    setOtpInput(['', '', '', '', '', '']);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass rounded-[40px] p-10 border border-white/10 relative z-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-6">
              <Terminal className="text-black w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-zinc-500 text-sm">Sign in to your Gmail account to continue</p>
          </div>

          <AnimatePresence mode="wait">
            {loginStep === 'email' ? (
              <motion.form 
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {authError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-4 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send One-Time Password
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="text-xs text-zinc-400 mb-6">
                    We've sent a 6-digit code to <br/>
                    <span className="text-blue-400 font-bold">{emailInput}</span>
                  </p>
                  
                  <div className="flex justify-between gap-2">
                    {otpInput.map((digit, i) => (
                      <input 
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    ))}
                  </div>
                  
                  {/* Debug Info for Demo */}
                  <div className="mt-6 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-400 font-mono">
                    DEBUG: Your OTP is {generatedOtp}
                  </div>
                </div>

                {authError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {authError}
                  </div>
                )}

                <div className="space-y-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Verify & Sign In
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginStep('email')}
                    className="w-full py-2 text-zinc-500 text-xs font-bold hover:text-zinc-300 transition-colors"
                  >
                    Change Email Address
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
              Secure Frontend Authentication
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <AnimatePresence>
        {isAddingTopic && <BootingLoader />}
      </AnimatePresence>
      {/* Navigation */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Terminal className="text-black w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Shanmukh AI VidyaPeettham
          </span>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10">
          {[
            { id: 'search', icon: Search, label: 'Global Search' },
            { id: 'progress', icon: BookOpen, label: 'My Roadmap' },
            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
            { id: 'games', icon: Zap, label: 'Games' },
            { id: 'meet', icon: Video, label: 'Dummy Meet' },
            { id: 'about', icon: User, label: 'Portfolio' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden group",
                activeTab === tab.id 
                  ? "bg-blue-500 text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
            <span className="text-xs font-mono text-blue-400 font-bold">{masteredCount} Mastered</span>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative">
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
                      <div className="text-5xl font-black text-blue-400">{currentProgress}%</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Complete</div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-8">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentProgress}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>

                  <div className="h-[120px] w-full mb-8 opacity-50 hover:opacity-100 transition-opacity">
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

                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search & add topics (e.g., DP, LeetCode, Graphs)..."
                        disabled={isSearching}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="p-3 bg-blue-500 text-black rounded-xl hover:bg-blue-400 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                <div className="glass rounded-3xl p-8 flex flex-col justify-between border-blue-500/20">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
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
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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

              <div className="space-y-8">
                {searchResults && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl p-8 relative overflow-hidden border border-blue-500/20"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Globe className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Global Insights</span>
                      </div>
                      <button
                        onClick={handleAddSearchTopicToRoadmap}
                        disabled={isAddingTopic}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-black rounded-xl text-xs font-bold hover:bg-blue-400 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAddingTopic ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Add to Roadmap
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none relative z-10 text-sm">
                      <Markdown>{searchResults.text}</Markdown>
                    </div>
                  </motion.div>
                )}

                {progress.customTopics.length === 0 ? (
                  <div className="p-12 text-center glass rounded-3xl border-dashed border-2 border-white/10">
                    <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">Add topics you want to study to start your roadmap.</p>
                  </div>
                ) : (
                  progress.customTopics.map((topic, i) => {
                    const isExpanded = expandedTopics.includes(topic.id);
                    const showAll = showMoreProblems[topic.id] || false;
                    const bestResource = topic.problems.find(p => p.category === 'best');
                    const interviewQuestions = topic.problems.filter(p => p.category === 'interview');
                    const relatedProblems = topic.problems.filter(p => p.category === 'related');
                    const visibleRelated = showAll ? relatedProblems : relatedProblems.slice(0, 10);

                    return (
                      <motion.div 
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "glass rounded-2xl border transition-all overflow-hidden",
                          topic.completed ? "border-blue-500/30 bg-blue-500/5" : "border-white/5"
                        )}
                      >
                        <div className="flex items-center justify-between p-6 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setProgress(progressService.toggleCustomTopic(topic.id))}
                              className="transition-transform active:scale-90"
                            >
                              {topic.completed ? (
                                <CheckCircle2 className="w-8 h-8 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              ) : (
                                <Circle className="w-8 h-8 text-zinc-700 hover:text-zinc-500" />
                              )}
                            </button>
                            <button 
                              onClick={() => toggleTopicExpansion(topic.id)}
                              className="flex items-center gap-3 text-left"
                            >
                              {isExpanded ? (
                                <FolderOpen className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Folder className="w-5 h-5 text-zinc-500" />
                              )}
                                <div>
                                  <h3 className={cn(
                                    "text-lg font-bold transition-all",
                                    topic.completed ? "text-blue-400" : "text-white"
                                  )}>
                                    {topic.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                      {topic.problems.length} Problems • {topic.problems.filter(p => p.completed).length} Done
                                    </p>
                                    {!topic.completed && topic.problems.length > 0 && (
                                      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-blue-500 transition-all duration-500"
                                          style={{ width: `${(topic.problems.filter(p => p.completed).length / topic.problems.length) * 100}%` }}
                                        />
                                      </div>
                                    )}
                                    {topic.completed && (
                                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Mastered</span>
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
                              <div className="p-6 space-y-8">
                                {topic.problems.length > 0 ?
                                  <>
                                    {/* Best Resource */}
                                    {bestResource && (
                                      <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                                          <Star className="w-3 h-3 fill-current" />
                                          Best Recommended Resource
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Trophy className="w-16 h-16 text-yellow-500" />
                                          </div>
                                          <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                              <h5 className="font-bold text-lg text-yellow-500">{bestResource.title}</h5>
                                              <a 
                                                href={bestResource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all active:scale-95"
                                              >
                                                <ExternalLink className="w-4 h-4" />
                                              </a>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-3">
                                              {bestResource.reason || "This is the top-rated resource for mastering this topic."}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                                                {bestResource.platform}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Top 20 Interview Questions */}
                                    {interviewQuestions.length > 0 && (
                                      <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                          <Trophy className="w-3 h-3" />
                                          Top 20 Interview Questions
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {interviewQuestions.map((prob: any) => (
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

                                    {/* Comprehensive Problem List */}
                                    {relatedProblems.length > 0 && (
                                      <div className="space-y-4">
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

          {activeTab === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto p-8"
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-12">
                <div>
                  <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    Leaderboard & Stats
                  </h1>
                  <p className="text-zinc-400">Track your rank, earn badges, and analyze your performance.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="glass p-6 rounded-3xl text-center min-w-[140px] border-yellow-500/20 bg-yellow-500/5">
                    <div className="text-3xl font-black text-yellow-500">
                      {progress.completionHistory.filter(h => h.type === 'problem').length * 10 + 
                       progress.completionHistory.filter(h => h.type === 'topic').length * 50}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Points</div>
                  </div>
                  <div className="glass p-6 rounded-3xl text-center min-w-[140px] border-blue-500/20 bg-blue-500/5">
                    <div className="text-3xl font-black text-blue-500">
                      #{Math.max(1, 150 - (progress.completionHistory.length * 2))}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Rank</div>
                  </div>
                </div>
              </div>

              {/* Gamification: Badges */}
              <div className="mb-12">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  Your Achievements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { id: 'first', icon: Zap, label: 'First Step', desc: 'Complete 1 problem', achieved: progress.completionHistory.filter(h => h.type === 'problem').length >= 1 },
                    { id: 'topic', icon: BookOpen, label: 'Topic Master', desc: 'Complete 1 topic', achieved: progress.completionHistory.filter(h => h.type === 'topic').length >= 1 },
                    { id: 'scholar', icon: Award, label: 'Scholar', desc: 'Complete 10 problems', achieved: progress.completionHistory.filter(h => h.type === 'problem').length >= 10 },
                    { id: 'streak', icon: Flame, label: 'On Fire', desc: '3 day streak', achieved: progress.completionHistory.length >= 5 },
                    { id: 'expert', icon: Star, label: 'Expert', desc: 'Master 5 topics', achieved: progress.completionHistory.filter(h => h.type === 'topic').length >= 5 },
                    { id: 'perfect', icon: CheckCircle2, label: 'Perfect Score', desc: '100% Roadmap', achieved: calculateProgress() === 100 && progress.customTopics.length > 0 },
                  ].map((badge) => (
                    <div 
                      key={badge.id}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center text-center transition-all",
                        badge.achieved 
                          ? "glass border-purple-500/30 bg-purple-500/5" 
                          : "bg-white/5 border-white/5 opacity-40 grayscale"
                      )}
                    >
                      <badge.icon className={cn("w-8 h-8 mb-3", badge.achieved ? "text-purple-400" : "text-zinc-600")} />
                      <div className="text-xs font-bold mb-1">{badge.label}</div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-tighter">{badge.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Global Leaderboard */}
                <div className="lg:col-span-1 glass p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Top Scholars
                  </h3>
                  <div className="space-y-4">
                    {globalLeaderboard.map((user, i) => (
                      <div 
                        key={user.email} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl transition-all",
                          user.email === userEmail ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{user.name}</div>
                            <div className="text-[10px] text-zinc-500">{user.points} pts</div>
                          </div>
                        </div>
                        <div className={cn(
                          "text-xs font-black",
                          i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-500" : "text-zinc-600"
                        )}>
                          #{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytics: Completion Over Time */}
                <div className="lg:col-span-2 glass p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Activity Trend
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
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#3b82f6' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution */}
                <div className="glass p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-blue-500" />
                    Learning Distribution
                  </h3>
                  <div className="h-[250px] w-full flex items-center">
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
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#27272a" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-4 pr-8">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <div>
                          <div className="text-xs font-bold">Problems</div>
                          <div className="text-[10px] text-zinc-500">{progress.completionHistory.filter(h => h.type === 'problem').length}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <div>
                          <div className="text-xs font-bold">Topics</div>
                          <div className="text-[10px] text-zinc-500">{progress.completionHistory.filter(h => h.type === 'topic').length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mastery Breakdown */}
                <div className="glass p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Topic-wise Progress
                  </h3>
                  <div className="space-y-6">
                    {progress.customTopics.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-sm">Add topics to see breakdown.</div>
                    ) : (
                      progress.customTopics.slice(0, 4).map((topic, i) => {
                        const completed = topic.problems.filter(p => p.completed).length;
                        const total = topic.problems.length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs font-bold mb-2">
                              <span>{topic.title}</span>
                              <span className="text-blue-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'games' && (
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

          {activeTab === 'about' && (
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
          {(activeTab === 'meet' || isMeetActive) && (
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
      </AnimatePresence>
    </div>
  );
}
