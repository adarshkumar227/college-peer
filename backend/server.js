// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ MongoDB Atlas Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
const studentRoutes = require("./routes/studentRoutes");
const peerRoutes = require("./routes/peerRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

app.use("/api/students", studentRoutes);
app.use("/api/peers", peerRoutes);
app.use("/api/sessions", sessionRoutes);

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
