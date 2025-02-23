const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust if frontend runs on another port
    methods: ["GET", "POST"],
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
    io.emit("playSong", currentSong); // Broadcast to all users
  });

  // Handle play/pause sync
  socket.on("togglePlayPause", (status) => {
    isPlaying = status;
    io.emit("togglePlayPause", isPlaying); // Sync for all users
  });

  // Handle chat messages
  socket.on("sendMessage", (message) => {
    io.emit("receiveMessage", message); // Broadcast message to all users
  });

  // Handle typing indicator
  socket.on("userTyping", (isTyping) => {
    socket.broadcast.emit("userTyping", isTyping);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
