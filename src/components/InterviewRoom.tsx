import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import { 
  Mic, MicOff, Video, VideoOff, LogOut, 
  Users, MessageSquare, Send, X, Shield, Crown, User, 
  Video as VideoIcon, Clock, Code, Terminal, Play, Save, ChevronRight, Monitor,
  Sparkles, ListChecks, Lock, Unlock, Database, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';
import { Progress, CustomTopic, Problem } from '../services/progress';
import { GoogleGenAI } from '@google/genai';

interface Participant {
  id: string;
  email: string;
  name: string;
  isMicOn: boolean;
  isCamOn: boolean;
  hasRaisedHand: boolean;
  stream?: MediaStream;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  role: 'interviewer' | 'interviewee';
}

interface InterviewRoomProps {
  socket: Socket;
  user: { email: string; name: string };
  isDarkMode: boolean;
  progress: Progress;
  onLeave: (sessionData?: any) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({ socket, user, isDarkMode, progress, onLeave }) => {
  const [roomId] = useState('interview-room');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState('');
  const [startTime, setStartTime] = useState<number | null>(Date.now());
  const [duration, setDuration] = useState(0);
  const [remotePeers, setRemotePeers] = useState<{ peerID: string; peer: Peer.Instance; stream?: MediaStream }[]>([]);
  
  const [code, setCode] = useState('// Write your solution here...');
  const [language, setLanguage] = useState('python');
  const [problem, setProblem] = useState({
    title: 'Welcome to the Interview',
    statement: 'Waiting for the interviewer to select a problem from your roadmap...',
    constraints: 'Standard constraints apply.'
  });

  const [isRoadmapShared, setIsRoadmapShared] = useState(false);
  const [sharedRoadmap, setSharedRoadmap] = useState<Progress | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('Greetings! I am your AI Interview Assistant. I will provide hints and analysis during the session.');
  const [showRoadmapPanel, setShowRoadmapPanel] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Media access denied:", err);
      }
      
      socket.emit("join_room", { roomId, user, type: 'interview' });

      socket.on("all_users", (userIds: string[]) => {
        const peers: { peerID: string; peer: Peer.Instance }[] = [];
        userIds.forEach(userID => {
          if (streamRef.current) {
            const peer = createPeer(userID, socket.id, streamRef.current);
            peers.push({ peerID: userID, peer });
          }
        });
        setRemotePeers(peers);
      });

      socket.on("user_joined", (payload: any) => {
        if (streamRef.current) {
          const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
          setRemotePeers(users => [...users, { peerID: payload.callerID, peer }]);
        }
      });

      socket.on("receiving_returned_signal", (payload: any) => {
        setRemotePeers(prev => {
          const item = prev.find(p => p.peerID === payload.id);
          if (item) item.peer.signal(payload.signal);
          return [...prev];
        });
      });

      socket.on("room_update", (room: any) => {
        setParticipants(room.participants);
        setIsHost(room.hostId === socket.id);
        setHostId(room.hostId);
        if (room.code !== undefined && room.id !== socket.id) setCode(room.code);
        if (room.language !== undefined) setLanguage(room.language);
        if (room.problem !== undefined) setProblem(room.problem);
        if (room.isRoadmapShared !== undefined) setIsRoadmapShared(room.isRoadmapShared);
        if (room.sharedRoadmap !== undefined) setSharedRoadmap(room.sharedRoadmap);
        
        setRemotePeers(currentPeers => {
          const activeIds = room.participants.map((p: any) => p.id);
          return currentPeers.filter(p => {
             const isActive = activeIds.includes(p.peerID);
             if (!isActive) p.peer.destroy();
             return isActive;
          });
        });
      });

      socket.on("code_updated", (data: { code: string; language: string }) => {
        setCode(data.code);
        setLanguage(data.language);
      });

      socket.on("problem_updated", (newProblem: any) => {
        setProblem(newProblem);
        setAiFeedback(`Interviewer has selected: ${newProblem.title}. Let's get started!`);
      });

      socket.on("roadmap_received", (data: any) => {
        setSharedRoadmap(data);
        setIsRoadmapShared(true);
      });

      socket.on("ai_feedback_received", (text: string) => {
        setAiFeedback(text);
      });

      socket.on("new_meet_message", (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });

      socket.on("force_media_off", (data: { type: 'mic' | 'cam' }) => {
        if (data.type === 'mic') {
          setIsMicOn(false);
          if (streamRef.current) {
            const track = streamRef.current.getAudioTracks()[0];
            if (track) track.enabled = false;
          }
        } else {
          setIsCamOn(false);
          if (streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            if (track) track.enabled = false;
          }
        }
      });
    };

    initializeMedia();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      remotePeers.forEach(p => p.peer.destroy());
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new Peer({ initiator: true, trickle: false, stream, config: ICE_CONFIG });
    peer.on("signal", signal => socket.emit("sending_signal", { userToSignal, callerID, signal }));
    peer.on("stream", stream => {
      setRemotePeers(prev => prev.map(p => p.peerID === userToSignal ? { ...p, stream } : p));
    });
    return peer;
  }

  function addPeer(incomingSignal: Peer.SignalData, callerID: string, stream: MediaStream) {
    const peer = new Peer({ initiator: false, trickle: false, stream, config: ICE_CONFIG });
    peer.on("signal", signal => socket.emit("returning_signal", { signal, callerID }));
    peer.on("stream", stream => {
      setRemotePeers(prev => prev.map(p => p.peerID === callerID ? { ...p, stream } : p));
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    socket.emit("sync_code", { roomId, code: newCode });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    socket.emit("sync_code", { roomId, code, language: newLang });
  };

  const toggleMic = () => {
    const status = !isMicOn;
    setIsMicOn(status);
    if (streamRef.current) streamRef.current.getAudioTracks()[0].enabled = status;
    socket.emit("toggle_media", { roomId, type: 'mic', status });
  };

  const toggleCam = () => {
    const status = !isCamOn;
    setIsCamOn(status);
    if (streamRef.current) streamRef.current.getVideoTracks()[0].enabled = status;
    socket.emit("toggle_media", { roomId, type: 'cam', status });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    socket.emit("send_meet_message", { roomId, text: inputMessage, role: isHost ? 'interviewer' : 'interviewee' });
    setInputMessage('');
  };

  const shareRoadmap = () => {
    socket.emit("share_roadmap", { roomId, roadmap: progress });
    setIsRoadmapShared(true);
  };

  const selectProblem = (topic: CustomTopic, prob: Problem) => {
    const newProblem = {
      title: prob.title,
      statement: `From Topic: ${topic.title}. Solve the problem: ${prob.title}. Goal: Implementation and analysis.`,
      constraints: `Platform: ${prob.platform}\nReason for selection: ${prob.reason || 'None provided'}\nStatus in roadmap: ${prob.completed ? 'Completed' : 'Not Started'}`
    };
    setProblem(newProblem);
    socket.emit("update_problem", { roomId, problem: newProblem });
    setShowRoadmapPanel(false);
  };

  const askAI = async () => {
    if (isAIGenerating) return;
    setIsAIGenerating(true);
    try {
      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an expert technical interviewer. The interviewee is solving: ${problem.title}. Current code: \n${code}\n Language: ${language}. Provide a very short, encouraging hint or technical observation in 2 sentences max.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setAiFeedback(text);
      socket.emit("sync_ai_feedback", { roomId, text });
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between glass px-6 py-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              Interview Suite
              {isHost && <Crown className="w-3 h-3 text-yellow-500" />}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(duration)}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {participants.length} Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isHost && !isRoadmapShared && (
            <button 
              onClick={shareRoadmap}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all"
            >
              <Lock className="w-3 h-3" /> Grant Roadmap Access
            </button>
          )}

          {isHost && isRoadmapShared && (
            <button 
              onClick={() => setShowRoadmapPanel(!showRoadmapPanel)}
              className="flex items-center gap-2 px-4 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-purple-400 transition-all animate-pulse"
            >
              <Database className="w-3 h-3" /> Roadmap Explorer
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button 
              onClick={() => onLeave()}
              className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative">
        {/* Roadmap Access Panel (Interviewer Overlay) */}
        <AnimatePresence>
          {showRoadmapPanel && isHost && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute right-0 top-0 bottom-0 w-80 glass z-50 border-1 border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 bg-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Roadmap Select</span>
                </div>
                <button onClick={() => setShowRoadmapPanel(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {sharedRoadmap?.customTopics.map(topic => (
                  <div key={topic.id} className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> {topic.title}
                    </span>
                    <div className="space-y-1 pl-2">
                      {topic.problems.map(prob => (
                        <button 
                          key={prob.id}
                          onClick={() => selectProblem(topic, prob)}
                          className="w-full text-left p-2 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                        >
                          <div className="text-xs font-bold text-zinc-300 group-hover:text-purple-300 truncate">{prob.title}</div>
                          <div className="text-[9px] text-zinc-500 flex items-center gap-1">
                            {prob.platform} • {prob.completed ? 'Solved' : 'Pending'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {(!sharedRoadmap?.customTopics || sharedRoadmap.customTopics.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-center">
                    <Database className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No custom roadmap found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Problem & Editor */}
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          {/* Problem Panel */}
          <div className="glass rounded-2xl p-6 border border-white/5 overflow-y-auto max-h-56 relative bg-gradient-to-br from-black/40 to-transparent">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Problem Statement</h3>
              </div>
              {!isHost && !isRoadmapShared && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[9px] font-bold uppercase animate-pulse">
                   Roadmap Locked
                </div>
              )}
            </div>
            <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
              {problem.title}
              {isHost && (
                <span className="text-[9px] font-normal px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20">Active Task</span>
              )}
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed mb-4 whitespace-pre-wrap">{problem.statement}</p>
            {problem.constraints && (
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block border-l-2 border-blue-500 pl-2">Constraints & Notes</span>
                <code className="text-xs text-blue-300/80 font-mono whitespace-pre-wrap">{problem.constraints}</code>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 glass rounded-2xl border border-white/5 overflow-hidden flex flex-col relative">
             <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Code className="w-4 h-4 text-zinc-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : 'c'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white">
                      <Save className="w-3.5 h-3.5" />
                   </button>
                   <button className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-black rounded-lg text-[10px] font-black hover:bg-emerald-400 transition-all uppercase tracking-widest">
                      <Play className="w-3 h-3 fill-current" /> Run
                   </button>
                </div>
             </div>
             <div className="flex-1 overflow-auto p-4 bg-[#0d0d0d] custom-scrollbar">
                <Editor
                  value={code}
                  onValueChange={handleCodeChange}
                  highlight={code => highlight(code, languages[language] || languages.javascript, language)}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '100%',
                    backgroundColor: 'transparent'
                  }}
                  className="focus:outline-none"
                />
             </div>
          </div>
        </div>

          {/* AI Interviewer & Media Grid */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 min-w-80 max-w-sm overflow-hidden">
            {/* AI Personality Panel */}
            <div className="glass p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">AI Interviewer</span>
                </div>
                <button 
                  onClick={askAI}
                  disabled={isAIGenerating}
                  className="p-1.5 bg-blue-500 text-black rounded-lg hover:bg-blue-400 disabled:opacity-50 transition-all"
                >
                  {isAIGenerating ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed min-h-[4rem] bg-black/20 p-3 rounded-xl border border-white/5 italic">
                "{aiFeedback}"
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-rows-2 gap-4 h-[300px]">
             {/* Local Video */}
             <div className="relative glass rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                <video 
                   ref={localVideoRef} 
                   autoPlay 
                   muted 
                   playsInline 
                   className={cn("w-full h-full object-cover transition-opacity", isCamOn ? "opacity-100" : "opacity-0")} 
                />
                {!isCamOn && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">Camera Off</span>
                   </div>
                )}
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-white border border-white/5">
                   You {isHost ? "• Interviewer" : "• Interviewee"}
                </div>
                <div className="absolute top-3 left-3 flex gap-1">
                   {!isMicOn && <div className="p-1.5 bg-red-500/80 rounded-lg text-white"><MicOff className="w-3 h-3" /></div>}
                </div>
             </div>

             {/* Remote Video */}
             <div className="relative glass rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                {remotePeers[0] ? (
                  <RemoteVideo stream={remotePeers[0].stream} participant={participants.find(p => p.id === remotePeers[0].peerID)} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                     <Users className="w-8 h-8 mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Waiting for peer...</p>
                  </div>
                )}
             </div>
          </div>

          {/* Media Controls */}
          <div className="glass p-3 rounded-2xl border border-white/10 flex items-center justify-center gap-3">
             <button 
                onClick={toggleMic}
                className={cn("p-3 rounded-xl transition-all", isMicOn ? "bg-white/5 text-zinc-400 hover:text-white" : "bg-red-500 text-white")}
             >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
             </button>
             <button 
                onClick={toggleCam}
                className={cn("p-3 rounded-xl transition-all", isCamOn ? "bg-white/5 text-zinc-400 hover:text-white" : "bg-red-500 text-white")}
             >
                {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
             </button>
             <button className="p-3 bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all">
                <Monitor className="w-5 h-5" />
             </button>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 glass rounded-2xl border border-white/5 flex flex-col min-h-0">
             <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Signals</span>
                <MessageSquare className="w-4 h-4 text-zinc-500" />
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex flex-col", msg.sender === socket.id ? "items-end" : "items-start")}>
                     <div className={cn("max-w-[85%] p-2.5 rounded-xl text-xs", msg.sender === socket.id ? "bg-blue-500 text-black font-medium" : "bg-white/5 border border-white/10 text-zinc-300")}>
                        {msg.text}
                     </div>
                  </div>
                ))}
             </div>
             <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
                <input 
                   type="text" 
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   placeholder="Signal msg..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50"
                />
                <button type="submit" className="p-2.5 bg-blue-500 text-black rounded-xl"><Send className="w-4 h-4" /></button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, participant }: { stream?: MediaStream; participant?: Participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="w-full h-full relative">
       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
       {!participant?.isCamOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
             <User className="w-6 h-6 text-zinc-700" />
          </div>
       )}
       <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-white border border-white/5">
          {participant?.name || 'Partner'}
       </div>
    </div>
  );
};

const RotateCcw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
