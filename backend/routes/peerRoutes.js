const express = require("express");
const Peer = require("../models/Peer");
const router = express.Router();

// ✅ Create peer
router.post("/", async (req, res) => {
  try {
    const newPeer = new Peer(req.body);
    await newPeer.save();
    res.status(201).json(newPeer);
  } catch (err) {
    console.error("Error saving peer:", err);
    res.status(400).json({ message: err.message });
  }
});

// ✅ Read all peers
router.get("/", async (req, res) => {
  try {
    const peers = await Peer.find().sort({ createdAt: -1 }).limit(500);
    res.json(peers);
  } catch (err) {
    console.error("Error fetching peers:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Read single peer (🔥 required for editing)
router.get("/:id", async (req, res) => {
  try {
    const peer = await Peer.findById(req.params.id);
    if (!peer) return res.status(404).json({ message: "Peer not found" });
    res.json(peer);
  } catch (err) {
    console.error("Error fetching single peer:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update peer by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Peer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Peer not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating peer:", err);
    res.status(400).json({ message: err.message });
  }
});

// ✅ Delete peer by id
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Peer.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Peer not found" });
    res.json({ message: "Peer deleted", id: req.params.id });
  } catch (err) {
    console.error("Error deleting peer:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
