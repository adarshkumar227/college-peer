const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  peer: { type: mongoose.Schema.Types.ObjectId, ref: "Peer" },
  subject: String,
  sessionCreatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Match", matchSchema);
