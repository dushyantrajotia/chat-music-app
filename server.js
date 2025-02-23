const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Fix CORS issue: Allow requests from your Vercel frontend
app.use(
  cors({
    origin: "https://chat-music-app.vercel.app", // Allow frontend on Vercel
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://chat-music-app.vercel.app", // Allow frontend
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"], // Ensure stable connection
  },
});

// Global state for synchronization
let currentSong = { id: "", title: "" };
let isPlaying = false;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current song and play status to new user
  socket.emit("playSong", currentSong);
  socket.emit("togglePlayPause", isPlaying);

  // Handle song play request
  socket.on("playSong", ({ id, title }) => {
    currentSong = { id, title };
    isPlaying = true;
    io.emit("playSong", currentSong); // Broadcast song to all users
  });

  // Handle play/pause sync
  socket.on("togglePlayPause", (status) => {
    isPlaying = status;
    io.emit("togglePlayPause", isPlaying); // Sync for all users
  });

  // Handle chat messages
  socket.on("sendMessage", ({ username, text }) => {
    io.emit("receiveMessage", { username, text }); // Broadcast message to all users
  });

  // Handle typing indicator
  socket.on("userTyping", (isTyping) => {
    socket.broadcast.emit("userTyping", isTyping);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server on port 5000 (Render may auto-assign a port)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
