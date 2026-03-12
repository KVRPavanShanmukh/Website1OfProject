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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send initial leaderboard
    socket.emit("leaderboard_update", leaderboard);

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
