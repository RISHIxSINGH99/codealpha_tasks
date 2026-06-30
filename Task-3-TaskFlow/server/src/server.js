import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();


import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/socket.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB before accepting traffic
connectDB();

// Wrap the Express app in a raw http server so Socket.io can attach to it
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

initSocket(io);

httpServer.listen(PORT, () => {
  console.log(`TaskFlow server running on port ${PORT}`);
});
