const Peer = require("../models/Peer");

// Add new peer
exports.addPeer = async (req, res) => {
  try {
    const peer = await Peer.create(req.body);
    res.status(201).json(peer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all peers
exports.getPeers = async (req, res) => {
  try {
    const peers = await Peer.find().sort({ _id: -1 });
    res.json(peers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
