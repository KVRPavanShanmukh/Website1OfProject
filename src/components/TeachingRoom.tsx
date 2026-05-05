import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Hand, LogOut, 
  Users, MessageSquare, Send, X, Shield, Crown, UserMinus, 
  VolumeX, Video as VideoIcon, Sparkles, Clock, Target, Trash2, Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

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
  role: 'teacher' | 'student';
}

interface TeachingRoomProps {
  socket: Socket;
  user: { email: string; name: string };
  isDarkMode: boolean;
  mode?: 'teaching' | 'seminar';
  onLeave: (sessionData?: any) => void;
}

export const TeachingRoom: React.FC<TeachingRoomProps> = ({ socket, user, isDarkMode, mode = 'teaching', onLeave }) => {
  const [roomId] = useState('demo-room'); // In a real app, this would be dynamic
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState('');
  const [isPresenting, setIsPresenting] = useState(false);
  const [isQAMode, setIsQAMode] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [remotePeers, setRemotePeers] = useState<{ peerID: string; peer: Peer.Instance; stream?: MediaStream }[]>([]);
  const [audienceMood, setAudienceMood] = useState<'happy' | 'bored' | 'confused'>('happy');
  const [engagement, setEngagement] = useState(100);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    // Initial media setup
    const initializeMedia = async () => {
      try {
        console.log("Requesting media access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Media access granted");
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsMicOn(true);
        setIsCamOn(true);
      } catch (err) {
        console.error("Media access denied or not available:", err);
        setIsMicOn(false);
        setIsCamOn(false);
        // We can still join room without media
      }
      
      socket.emit("join_room", { roomId, user, type: mode });

      socket.on("all_users", (userIds: string[]) => {
        console.log("Received existing users:", userIds);
        const peers: { peerID: string; peer: Peer.Instance }[] = [];
        userIds.forEach(userID => {
          if (streamRef.current) {
            const peer = createPeer(userID, socket.id, streamRef.current);
            peers.push({
              peerID: userID,
              peer,
            });
          }
        });
        setRemotePeers(peers);
      });

      socket.on("user_joined", (payload: any) => {
        console.log("User joined, adding peer:", payload.callerID);
        if (streamRef.current) {
          const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
          setRemotePeers(users => [...users, { peerID: payload.callerID, peer }]);
        }
      });

      socket.on("receiving_returned_signal", (payload: any) => {
        console.log("Receiving returned signal from:", payload.id);
        setRemotePeers(prev => {
          const item = prev.find(p => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
          return [...prev];
        });
      });

      socket.on("room_update", (room: any) => {
        setParticipants(room.participants);
        setIsHost(room.hostId === socket.id);
        setHostId(room.hostId);
        if (room.startTime) setStartTime(room.startTime);
        if (room.isQAMode !== undefined) setIsQAMode(room.isQAMode);
        
        // Cleanup peers for left users
        setRemotePeers(currentPeers => {
          const activeIds = room.participants.map((p: any) => p.id);
          return currentPeers.filter(p => {
             const isActive = activeIds.includes(p.peerID);
             if (!isActive) {
               console.log("Cleaning up peer for disconnected user:", p.peerID);
               p.peer.destroy();
             }
             return isActive;
          });
        });
      });

      socket.on("new_meet_message", (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });

      socket.on("force_media_off", (data: { type: 'mic' | 'cam' }) => {
        if (data.type === 'mic') {
          setIsMicOn(false);
          if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = false;
          }
        } else {
          setIsCamOn(false);
          if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = false;
          }
        }
      });

      socket.on("force_leave", () => {
        leaveRoom();
      });

      socket.on("hand_raised_notify", (data: { name: string }) => {
        if (isHost) {
          console.log(`${data.name} raised their hand`);
        }
      });

      socket.on("hand_approved", () => {
        setHasRaisedHand(false);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      });

      socket.on("presentation_started", (data: { startTime: number }) => {
        setStartTime(data.startTime);
        setIsPresenting(true);
      });

      socket.on("session_ended", (sessionData: any) => {
        onLeave(sessionData);
      });
    };

    initializeMedia();

    return () => {
      leaveRoom();
      socket.off("room_update");
      socket.off("user_joined");
      socket.off("receiving_returned_signal");
      socket.off("new_meet_message");
      socket.off("force_media_off");
      socket.off("force_leave");
      socket.off("hand_raised_notify");
      socket.off("hand_approved");
      socket.off("presentation_started");
      socket.off("session_ended");
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
        
        // Randomly adjust engagement and mood during presentation
        if (isPresenting) {
          setEngagement(prev => Math.max(20, Math.min(100, prev + (Math.random() * 10 - 5.5))));
          
          if (Math.random() > 0.95) {
            const moods: ('happy' | 'bored' | 'confused')[] = ['happy', 'bored', 'confused'];
            setAudienceMood(moods[Math.floor(Math.random() * moods.length)]);
          }

          if (Math.random() > 0.98) {
            const botFeedback = [
              "Wow, this is a very interesting point!",
              "Could you clarify the last slide?",
              "I'm a bit confused about the technical details.",
              "Great energy!",
              "I lost you for a second there.",
            ];
            const msg = botFeedback[Math.floor(Math.random() * botFeedback.length)];
            setMessages(prev => [...prev, {
              id: 'bot-' + Date.now(),
              sender: 'bot',
              text: msg,
              role: 'student'
            }]);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isPresenting]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: ICE_CONFIG
    });

    peer.on("signal", signal => {
      socket.emit("sending_signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", stream => {
      console.log("Received stream from peer:", userToSignal);
      setRemotePeers(prev => prev.map(p => p.peerID === userToSignal ? { ...p, stream } : p));
    });

    peer.on("error", err => {
      console.error("Peer error:", err);
    });

    return peer;
  }

  function addPeer(incomingSignal: Peer.SignalData, callerID: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: ICE_CONFIG
    });

    peer.on("signal", signal => {
      socket.emit("returning_signal", { signal, callerID });
    });

    peer.on("stream", stream => {
      console.log("Received stream from peer:", callerID);
      setRemotePeers(prev => prev.map(p => p.peerID === callerID ? { ...p, stream } : p));
    });

    peer.on("error", err => {
      console.error("Peer error (added):", err);
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleMic = () => {
    if (mode === 'seminar' && !isHost && !isQAMode) return;
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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsScreenSharing(false);
      if (localVideoRef.current && streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  };

  const toggleRaiseHand = () => {
    const status = !hasRaisedHand;
    setHasRaisedHand(status);
    socket.emit("raise_hand", { roomId, status });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    socket.emit("send_meet_message", { roomId, text: inputMessage, role: isHost ? 'teacher' : 'student' });
    setInputMessage('');
  };

  const toggleQA = () => {
    socket.emit("toggle_qa_mode", { roomId, status: !isQAMode });
  };

  const leaveRoom = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    remotePeers.forEach(p => p.peer.destroy());
    onLeave();
  };

  const startPresentation = () => {
    socket.emit("start_presentation", { roomId });
  };

  const endSession = () => {
    socket.emit("end_session", { roomId });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50" />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">{mode === 'seminar' ? 'Seminar Room' : 'Teaching Room'}: {roomId}</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
               <span className="flex items-center gap-1">
                 <Users className="w-3 h-3" /> {participants.length} Active
               </span>
               <span className="w-1 h-1 bg-zinc-700 rounded-full" />
               <span className="flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {isPresenting ? formatTime(duration) : 'Ready'}
               </span>
               {isPresenting && (
                 <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">LIVE</span>
               )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {mode === 'seminar' && isHost && (
            <button 
              onClick={toggleQA}
              className={cn(
                "px-6 py-3 font-black rounded-2xl transition-all shadow-lg flex items-center gap-2",
                isQAMode ? "bg-purple-500 text-white shadow-purple-500/20" : "bg-white/5 text-zinc-500 border border-white/5"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              {isQAMode ? 'CLOSE Q&A' : 'OPEN Q&A'}
            </button>
          )}
          {isHost && !isPresenting && (
            <button 
              onClick={startPresentation}
              className="px-6 py-3 bg-blue-500 text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {mode === 'seminar' ? 'START SEMINAR' : 'START MISSION'}
            </button>
          )}
          {isHost && isPresenting && (
             <button 
              onClick={endSession}
              className="px-6 py-3 bg-red-500 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              END SESSION
            </button>
          )}
          <button 
            onClick={leaveRoom}
            className="p-3 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-2xl transition-all border border-white/5"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar Left: Presentation Metrics (Only when presenting) */}
        {isPresenting && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            className="flex flex-col gap-6"
          >
            <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-col gap-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10" />
               <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                 <Sparkles className="w-3 h-3 text-yellow-500" />
                 Live Audience AI
               </h3>
               
               <div className="space-y-6">
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Engagement</span>
                        <span className="text-xs font-black text-blue-400">{Math.round(engagement)}%</span>
                     </div>
                     <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          animate={{ width: `${engagement}%` }}
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Current Mood</span>
                        <span className="text-sm font-black capitalize">{audienceMood}</span>
                     </div>
                     <div className="text-2xl">
                        {audienceMood === 'happy' && '😊'}
                        {audienceMood === 'bored' && '🥱'}
                        {audienceMood === 'confused' && '🤔'}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase">Virtual Students (12)</span>
                     <div className="grid grid-cols-4 gap-2">
                        {[...Array(12)].map((_, i) => (
                           <motion.div 
                              key={i}
                              animate={{ 
                                scale: audienceMood === 'happy' ? [1, 1.1, 1] : 1,
                                opacity: i / 12 > engagement / 100 ? 0.3 : 1
                              }}
                              transition={{ delay: i * 0.1, repeat: Infinity, duration: 2 }}
                              className="aspect-square rounded-lg bg-white/5 flex items-center justify-center text-[10px]"
                           >
                              👤
                           </motion.div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-col gap-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pro Tips</h3>
               <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                 "Try changing your tone or asking a rhetorical question to boost engagement!"
               </p>
            </div>
          </motion.div>
        )}

        {/* Main Stage - Grid based representation */}
        <div className="flex-1 glass rounded-[3rem] p-6 border border-white/5 relative overflow-hidden flex flex-col bg-black/40">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_100%)]" />
           
           <div className="flex-1 grid gap-4 relative z-10" style={{
             gridTemplateColumns: participants.length <= 1 ? '1fr' : 
                                 participants.length <= 2 ? '1fr 1fr' : 
                                 participants.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr',
             gridTemplateRows: participants.length <= 2 ? '1fr' : 
                               participants.length <= 6 ? '1fr 1fr' : '1fr 1fr 1fr'
           }}>
              {/* Local Participant */}
              <div className="relative group">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted={true}
                  playsInline
                  className={cn(
                    "w-full h-full object-cover rounded-[2rem] border-2 border-white/10 shadow-2xl transition-all",
                    isCamOn ? "opacity-100" : "opacity-0"
                  )}
                />
                {!isCamOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center glass rounded-[2rem]">
                     <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border-2 border-blue-500/20">
                       <User className="w-10 h-10 text-blue-500" />
                     </div>
                     <h3 className="text-lg font-bold">{user.name}</h3>
                     <p className="text-zinc-500 uppercase tracking-widest text-[8px] font-black">You (Cam Off)</p>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">
                  You {isHost && "• Host"}
                </div>
              </div>

              {/* Remote Participants */}
              {participants.filter(p => p.id !== socket.id).map(p => {
                const peerData = remotePeers.find(rp => rp.peerID === p.id);
                return (
                  <RemoteParticipant 
                    key={p.id} 
                    participant={p} 
                    stream={peerData?.stream}
                    isHost={hostId === p.id}
                  />
                );
              })}
           </div>

           {/* Controls Bar */}
           <div className="flex items-center justify-center mt-6 relative z-20">
              <div className="flex items-center gap-3 glass p-3 rounded-3xl border border-white/10 backdrop-blur-2xl">
                <button 
                  onClick={toggleMic}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-90",
                    isMicOn ? "bg-white/5 text-white hover:bg-white/10" : "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  )}
                  title={isMicOn ? "Mute" : "Unmute"}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                <button 
                  onClick={toggleCam}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-90",
                    isCamOn ? "bg-white/5 text-white hover:bg-white/10" : "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  )}
                  title={isCamOn ? "Stop Cam" : "Start Cam"}
                >
                  {isCamOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
                <button 
                  onClick={toggleScreenShare}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-90",
                    isScreenSharing ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20" : "bg-white/5 text-white hover:bg-white/10"
                  )}
                  title="Present"
                >
                  <Monitor className="w-6 h-6" />
                </button>
                <button 
                  onClick={toggleRaiseHand}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-90",
                    hasRaisedHand ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/40" : "bg-white/5 text-white hover:bg-white/10"
                  )}
                  title="Raise Hand"
                >
                  <Hand className="w-6 h-6" />
                </button>
              </div>
           </div>
        </div>

        {/* Sidebar */}
        <div className="w-[400px] flex flex-col gap-6">
          {/* Dashboard Stats / Participants Toggle */}
          <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-col gap-6">
            <div className="flex p-1 bg-black/20 rounded-2xl border border-white/5">
              <button 
                onClick={() => setSidebarTab('chat')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  sidebarTab === 'chat' ? "bg-blue-500 text-black shadow-lg" : "text-zinc-500 hover:text-white"
                )}
              >
                Chat
              </button>
              <button 
                onClick={() => setSidebarTab('participants')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  sidebarTab === 'participants' ? "bg-blue-500 text-black shadow-lg" : "text-zinc-500 hover:text-white"
                )}
              >
                Crew ({participants.length})
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
               <AnimatePresence mode="wait">
                  {sidebarTab === 'chat' ? (
                    <motion.div 
                      key="chat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-[500px]"
                    >
                       <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                          {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                               <MessageSquare className="w-12 h-12 mb-4" />
                               <p className="text-xs font-bold uppercase tracking-widest">No signals yet</p>
                            </div>
                          )}
                          {messages.map((msg) => (
                            <div key={msg.id} className={cn(
                              "flex flex-col",
                              msg.sender === socket.id ? "items-end" : "items-start"
                            )}>
                              <span className="text-[10px] text-zinc-500 mb-1 font-black uppercase tracking-widest flex items-center gap-1">
                                {msg.sender === 'bot' ? (
                                  <>
                                    <Sparkles className="w-2 h-2 text-yellow-500" />
                                    AI Student
                                  </>
                                ) : (
                                  participants.find(p => p.id === msg.sender)?.name || 'Unknown'
                                )}
                              </span>
                              <div className={cn(
                                "max-w-[90%] p-3 rounded-2xl text-sm shadow-sm",
                                msg.sender === socket.id 
                                  ? "bg-blue-500 text-black rounded-tr-none font-medium" 
                                  : msg.sender === 'bot'
                                    ? "bg-yellow-500/10 text-yellow-200 border border-yellow-500/20 rounded-tl-none italic"
                                    : "glass border border-white/10 rounded-tl-none"
                              )}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                       </div>
                       <form onSubmit={handleSendMessage} className="mt-6 flex gap-2">
                          <input 
                            type="text" 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={mode === 'seminar' && !isHost && !isQAMode}
                            placeholder={mode === 'seminar' && !isHost && !isQAMode ? "Chat disabled during seminar" : "Type a message..."}
                            className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button 
                            type="submit"
                            disabled={mode === 'seminar' && !isHost && !isQAMode}
                            className="p-4 bg-blue-500 text-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                       </form>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="participants"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3 max-h-[570px] overflow-y-auto pr-2 custom-scrollbar"
                    >
                      {participants.map((p) => (
                        <div key={p.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center relative">
                               <User className="w-5 h-5 text-blue-400" />
                               {p.hasRaisedHand && (
                                 <motion.div 
                                   animate={{ scale: [1, 1.2, 1] }}
                                   transition={{ repeat: Infinity, duration: 1 }}
                                   className="absolute -top-1 -right-1"
                                 >
                                   <Hand className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                 </motion.div>
                               )}
                             </div>
                             <div>
                                <p className="text-sm font-bold flex items-center gap-2">
                                  {p.name}
                                  {p.id === hostId && <Crown className="w-3 h-3 text-blue-500" />}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                  {p.id === socket.id ? '(You)' : ''}
                                </p>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {isHost && p.id !== socket.id && (
                               <>
                                 {p.hasRaisedHand && (
                                   <button 
                                     onClick={() => socket.emit("host_control", { roomId, targetId: p.id, action: 'approve_hand' })}
                                     className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                                     title="Approve Hand"
                                   >
                                     <Sparkles className="w-4 h-4" />
                                   </button>
                                 )}
                                 <button 
                                   onClick={() => socket.emit("host_control", { roomId, targetId: p.id, action: 'mute' })}
                                   className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                   title="Mute Call"
                                 >
                                   <VolumeX className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => socket.emit("host_control", { roomId, targetId: p.id, action: 'stop_video' })}
                                   className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                   title="Stop Video"
                                 >
                                   <VideoOff className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => socket.emit("host_control", { roomId, targetId: p.id, action: 'remove' })}
                                   className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                   title="Remove from Room"
                                 >
                                   <UserMinus className="w-4 h-4" />
                                 </button>
                               </>
                             )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
          
          <div className="glass rounded-[2rem] p-6 border border-white/5 flex items-center justify-around gap-4">
             <div className="text-center">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Health</div>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/20">Stable</div>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Encrypted</div>
                <Shield className="w-4 h-4 text-blue-500 mx-auto" />
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</div>
                <div className="flex gap-0.5">
                   {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-blue-500 rounded-full" />)}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const User = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const RemoteParticipant = ({ participant, stream, isHost }: { participant: Participant; stream?: MediaStream; isHost: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative group overflow-hidden bg-zinc-900 rounded-[2rem] border border-white/10">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={cn(
          "w-full h-full object-cover transition-all",
          participant.isCamOn && stream ? "opacity-100" : "opacity-0"
        )}
      />
      
      {(!participant.isCamOn || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center glass rounded-[2rem]">
           <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border-2 border-blue-500/20">
             <User className="w-10 h-10 text-blue-500" />
           </div>
           <h3 className="text-lg font-bold">{participant.name}</h3>
           <p className="text-zinc-500 uppercase tracking-widest text-[8px] font-black">
             {!stream ? 'Connecting...' : 'Camera Disabled'}
           </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-widest flex items-center gap-2">
        {participant.name} {isHost && "• Host"}
        {!participant.isMicOn && <MicOff className="w-2.5 h-2.5 text-red-400" />}
        {participant.hasRaisedHand && <Hand className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />}
      </div>
    </div>
  );
};
