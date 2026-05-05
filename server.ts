import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // In-memory leaderboard state
  // In a real app, this would be in a database
  let leaderboard: { email: string; name: string; points: number; lastUpdate: number }[] = [
    { email: 'alex@gmail.com', name: 'Alex Rivera', points: 2450, lastUpdate: Date.now() },
    { email: 'sarah@gmail.com', name: 'Sarah Chen', points: 2100, lastUpdate: Date.now() },
    { email: 'jordan@gmail.com', name: 'Jordan Smith', points: 1950, lastUpdate: Date.now() },
    { email: 'mika@gmail.com', name: 'Mika Tanaka', points: 1800, lastUpdate: Date.now() },
    { email: 'liam@gmail.com', name: 'Liam Wilson', points: 1650, lastUpdate: Date.now() },
  ];

  // Real-time meeting state
  const rooms: Record<string, { 
    id: string; 
    hostId: string; 
    type: 'teaching' | 'seminar' | 'interview';
    isQAMode?: boolean;
    participants: { id: string; email: string; name: string; isMicOn: boolean; isCamOn: boolean; hasRaisedHand: boolean }[];
    startTime?: number;
    messages: { id: string; sender: string; text: string; role: 'teacher' | 'student' | 'interviewer' | 'interviewee' | 'bot' }[];
    code?: string;
    language?: string;
    problem?: { title: string; statement: string; constraints?: string };
  }> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Leaderboard logic ...
    socket.emit("leaderboard_update", leaderboard);

    socket.on("join_room", (data: { roomId: string; user: { email: string; name: string }; type?: 'teaching' | 'seminar' | 'interview' }) => {
      const { roomId, user, type = 'teaching' } = data;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          hostId: socket.id,
          type,
          isQAMode: false,
          participants: [],
          messages: [],
          code: '// Start coding here...',
          language: 'python'
        };
      }

      const participant = {
        id: socket.id,
        email: user.email,
        name: user.name,
        isMicOn: true,
        isCamOn: true,
        hasRaisedHand: false
      };

      rooms[roomId].participants.push(participant);
      
      // Send existing participants to the new user so they can initiate peers
      const existingParticipants = rooms[roomId].participants
        .filter(p => p.id !== socket.id)
        .map(p => p.id);
      socket.emit("all_users", existingParticipants);

      // Notify everyone in room about new participant
      io.to(roomId).emit("room_update", rooms[roomId]);
      
      // Handle signaling for WebRTC
      socket.on("sending_signal", (payload) => {
        io.to(payload.userToSignal).emit('user_joined', { signal: payload.signal, callerID: payload.callerID });
      });

      socket.on("returning_signal", (payload) => {
        io.to(payload.callerID).emit('receiving_returned_signal', { signal: payload.signal, id: socket.id });
      });
    });

    socket.on("toggle_qa_mode", (data: { roomId: string; status: boolean }) => {
      const room = rooms[data.roomId];
      if (room && room.hostId === socket.id && room.type === 'seminar') {
        room.isQAMode = data.status;
        io.to(data.roomId).emit("room_update", room);
      }
    });

    socket.on("sync_code", (data: { roomId: string; code: string; language?: string }) => {
      const room = rooms[data.roomId];
      if (room && room.type === 'interview') {
        room.code = data.code;
        if (data.language) room.language = data.language;
        socket.to(data.roomId).emit("code_updated", { code: room.code, language: room.language });
      }
    });

    socket.on("update_problem", (data: { roomId: string; problem: { title: string; statement: string; constraints?: string } }) => {
      const room = rooms[data.roomId];
      if (room && room.hostId === socket.id && room.type === 'interview') {
        room.problem = data.problem;
        io.to(data.roomId).emit("room_update", room);
      }
    });

    socket.on("toggle_media", (data: { roomId: string; type: 'mic' | 'cam'; status: boolean }) => {
      const room = rooms[data.roomId];
      if (room) {
        const participant = room.participants.find(p => p.id === socket.id);
        if (participant) {
          if (data.type === 'mic') participant.isMicOn = data.status;
          else participant.isCamOn = data.status;
          io.to(data.roomId).emit("room_update", room);
        }
      }
    });

    socket.on("raise_hand", (data: { roomId: string; status: boolean }) => {
      const room = rooms[data.roomId];
      if (room) {
        const participant = room.participants.find(p => p.id === socket.id);
        if (participant) {
          participant.hasRaisedHand = data.status;
          io.to(data.roomId).emit("room_update", room);
          if (data.status) {
            io.to(room.hostId).emit("hand_raised_notify", { id: participant.id, name: participant.name });
          }
        }
      }
    });

    socket.on("host_control", (data: { roomId: string; targetId: string; action: 'mute' | 'stop_video' | 'remove' | 'approve_hand' }) => {
      const room = rooms[data.roomId];
      if (room && room.hostId === socket.id) {
        const target = room.participants.find(p => p.id === data.targetId);
        if (target) {
          switch (data.action) {
            case 'mute':
              io.to(data.targetId).emit("force_media_off", { type: 'mic' });
              target.isMicOn = false;
              break;
            case 'stop_video':
              io.to(data.targetId).emit("force_media_off", { type: 'cam' });
              target.isCamOn = false;
              break;
            case 'remove':
              io.to(data.targetId).emit("force_leave");
              room.participants = room.participants.filter(p => p.id !== data.targetId);
              break;
            case 'approve_hand':
              target.hasRaisedHand = false;
              io.to(data.targetId).emit("hand_approved");
              break;
          }
          io.to(data.roomId).emit("room_update", room);
        }
      }
    });

    socket.on("send_meet_message", (data: { roomId: string; text: string; role: 'teacher' | 'student' }) => {
      const room = rooms[data.roomId];
      if (room) {
        const newMessage = { id: Math.random().toString(36).substr(2, 9), sender: socket.id, text: data.text, role: data.role };
        room.messages.push(newMessage);
        io.to(data.roomId).emit("new_meet_message", newMessage);
      }
    });

    socket.on("start_presentation", (data: { roomId: string }) => {
      const room = rooms[data.roomId];
      if (room && room.hostId === socket.id) {
        room.startTime = Date.now();
        io.to(data.roomId).emit("presentation_started", { startTime: room.startTime });
      }
    });

    socket.on("end_session", (data: { roomId: string }) => {
      const room = rooms[data.roomId];
      if (room && room.hostId === socket.id) {
        const duration = Date.now() - (room.startTime || Date.now());
        const sessionData = {
          participants: room.participants.map(p => ({ email: p.email, name: p.name })),
          duration,
          messages: room.messages,
          endTime: Date.now()
        };
        io.to(data.roomId).emit("session_ended", sessionData);
        delete rooms[data.roomId];
      }
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach(roomId => {
        if (rooms[roomId]) {
          rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== socket.id);
          if (rooms[roomId].participants.length === 0) {
            delete rooms[roomId];
          } else {
            if (rooms[roomId].hostId === socket.id) {
              rooms[roomId].hostId = rooms[roomId].participants[0].id;
            }
            io.to(roomId).emit("room_update", rooms[roomId]);
          }
        }
      });
    });

    socket.on("update_points", (data: { email: string; name: string; points: number }) => {
      const index = leaderboard.findIndex((u) => u.email === data.email);
      if (index !== -1) {
        leaderboard[index] = { ...data, lastUpdate: Date.now() };
      } else {
        leaderboard.push({ ...data, lastUpdate: Date.now() });
      }

      // Sort leaderboard
      leaderboard.sort((a, b) => b.points - a.points);
      
      // Keep top 50
      leaderboard = leaderboard.slice(0, 50);

      // Broadcast to all
      io.emit("leaderboard_update", leaderboard);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
