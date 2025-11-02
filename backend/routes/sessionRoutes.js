const express = require("express");
const Student = require("../models/Student");
const Peer = require("../models/Peer");
const Session = require("../models/Session");
const router = express.Router();

/**
 * Compute compatibility score (0..1) and breakdown
 */
function computeScore(student, peer) {
  const sBudget = Number(student.rangeBudget || 0);
  const pCharges = Number(peer.charges || 0);
  const sRating = Number(student.rating || 0);
  const pRating = Number(peer.rating || 0);
  const sExp = Number(student.experience || 0);
  const pExp = Number(peer.experience || 0);

  const domainScore =
    String(student.subject || "").toLowerCase() ===
    String(peer.domain || "").toLowerCase()
      ? 1
      : 0;

  let budgetScore = 0;
  if (sBudget <= 0 && pCharges <= 0) budgetScore = 0.5;
  else if (pCharges <= sBudget)
    budgetScore = 1 - Math.abs(sBudget - pCharges) / Math.max(1, sBudget);
  else
    budgetScore = Math.max(
      0,
      1 - ((pCharges - sBudget) / (sBudget + 1)) * 1.5
    );
  budgetScore = Math.max(0, Math.min(1, budgetScore));

  const ratingScore = Math.max(0, Math.min(1, pRating / 5));

  let expScore = 0;
  if (sExp <= 0) expScore = Math.min(1, pExp / 5);
  else expScore = Math.min(1, pExp / (sExp || 1));

  const wDomain = 0.5;
  const wBudget = 0.2;
  const wRating = 0.2;
  const wExp = 0.1;

  const total =
    domainScore * wDomain +
    budgetScore * wBudget +
    ratingScore * wRating +
    expScore * wExp;

  return {
    total: Math.round(total * 1000) / 1000,
    breakdown: {
      domainScore,
      budgetScore: Math.round(budgetScore * 1000) / 1000,
      ratingScore: Math.round(ratingScore * 1000) / 1000,
      expScore: Math.round(expScore * 1000) / 1000,
    },
  };
}

/**
 * POST /api/sessions/match
 * - { studentId } => returns top 3 candidates (no DB write)
 * - { action: "create", studentId, peerId, scheduledAt?, topic? } => creates session
 */
router.post("/match", async (req, res) => {
  try {
    const { studentId, action, peerId, scheduledAt, topic, remarks } = req.body;
    if (!studentId)
      return res.status(400).json({ message: "studentId required" });

    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    const peers = await Peer.find().lean();
    if (!peers || peers.length === 0)
      return res.status(404).json({ message: "No peers available" });

    const scored = peers.map((p) => {
      const { total, breakdown } = computeScore(student, p);
      return { peer: p, score: total, breakdown };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.peer.charges !== b.peer.charges)
        return a.peer.charges - b.peer.charges;
      if (b.peer.rating !== a.peer.rating)
        return b.peer.rating - a.peer.rating;
      return b.peer.experience - a.peer.experience;
    });

    if (!action) {
      const top = scored.slice(0, 3).map((s) => ({
        peer: s.peer,
        score: s.score,
        breakdown: s.breakdown,
      }));
      // prevent caching of the response
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return res.json({ candidates: top });
    }

    if (action === "create") {
      if (!peerId)
        return res.status(400).json({ message: "peerId required for create" });
      const chosen = peers.find((p) => String(p._id) === String(peerId));
      if (!chosen)
        return res.status(404).json({ message: "Chosen peer not found" });

      const matchInfo = computeScore(student, chosen);

      const sessionDoc = new Session({
        studentId: student._id,
        peerId: chosen._id,
        topic: topic || student.subject || "General",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        status: "pending",
        remarks: remarks || "",
      });

      await sessionDoc.save();

      const populated = await Session.findById(sessionDoc._id)
        .populate("studentId", "name subject rangeBudget rating experience")
        .populate("peerId", "name domain charges rating experience");

      // prevent caching
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return res.status(201).json({ session: populated, score: matchInfo });
    }

    return res.status(400).json({ message: "Unknown action" });
  } catch (err) {
    console.error("Error in /match:", err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/sessions/match/bulk
 * Greedy bipartite matching, creates sessions (saved)
 */
router.post("/match/bulk", async (req, res) => {
  try {
    const { studentIds, peerIds } = req.body || {};

    const students = studentIds?.length
      ? await Student.find({ _id: { $in: studentIds } }).lean()
      : await Student.find().lean();

    const peers = peerIds?.length
      ? await Peer.find({ _id: { $in: peerIds } }).lean()
      : await Peer.find().lean();

    if (!students.length || !peers.length)
      return res
        .status(400)
        .json({ message: "Need students and peers to run bulk match" });

    const edges = [];
    for (const s of students) {
      for (const p of peers) {
        const { total, breakdown } = computeScore(s, p);
        edges.push({
          studentId: String(s._id),
          peerId: String(p._id),
          score: total,
          breakdown,
        });
      }
    }

    edges.sort((a, b) => b.score - a.score);

    const matchedStudents = new Set();
    const matchedPeers = new Set();
    const createdSessions = [];

    for (const edge of edges) {
      if (matchedStudents.has(edge.studentId)) continue;
      if (matchedPeers.has(edge.peerId)) continue;

      const newSession = await Session.create({
        studentId: edge.studentId,
        peerId: edge.peerId,
        topic: undefined,
        scheduledAt: new Date(),
        status: "matched",
        remarks: `auto-match (score ${edge.score})`,
      });

      matchedStudents.add(edge.studentId);
      matchedPeers.add(edge.peerId);

      const populated = await Session.findById(newSession._id)
        .populate("studentId", "name subject rangeBudget rating experience")
        .populate("peerId", "name domain charges rating experience");

      createdSessions.push({
        session: populated,
        score: edge.score,
        breakdown: edge.breakdown,
      });
    }

    // prevent caching
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({
      created: createdSessions,
      summary: { totalCreated: createdSessions.length },
    });
  } catch (err) {
    console.error("Error in /match/bulk:", err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/sessions/:id
 * Update session fields (status, scheduledAt, remarks, topic)
 */
router.patch("/:id", async (req, res) => {
  try {
    const { status, scheduledAt, remarks, topic } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (typeof remarks !== "undefined") updates.remarks = remarks;
    if (typeof topic !== "undefined") updates.topic = topic;

    // ensure DB write persistence
    updates.updatedAt = new Date();

    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("studentId", "name subject")
      .populate("peerId", "name domain");

    if (!updated) return res.status(404).json({ message: "Session not found" });

    // prevent caching
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    // ✅ return updated session explicitly
    return res.json({
      success: true,
      message: "Session updated and saved to database",
      session: updated,
    });
  } catch (err) {
    console.error("Error updating session:", err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/sessions
 * List sessions (populated), most recent first
 */
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("studentId", "name subject rangeBudget rating experience")
      .populate("peerId", "name domain charges rating experience")
      .sort({ updatedAt: -1 }) // ✅ use updatedAt instead of createdAt
      .limit(1000);

    // prevent caching so frontend always gets latest DB state
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
