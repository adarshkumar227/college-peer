const mongoose = require("mongoose");

const peerSchema = new mongoose.Schema({
  name: String,
  domain: String,
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  charges: { type: Number, default: 3000 },
}, { timestamps: true });

module.exports = mongoose.model("Peer", peerSchema);
