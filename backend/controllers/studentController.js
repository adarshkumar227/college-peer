const Student = require("../models/Student");
const Peer = require("../models/Peer");
const Match = require("../models/Match");

// 📩 Add new student + try to auto-match
exports.addStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);

    // --- Matching Algorithm ---
    // Filter peers with same domain (subject)
    const peers = await Peer.find({ domain: student.subject });

    // If peers found, sort by rating + experience
    if (peers.length > 0) {
      const sortedPeers = peers.sort((a, b) => {
        const scoreA = a.rating * 2 + a.experience;
        const scoreB = b.rating * 2 + b.experience;
        return scoreB - scoreA; // higher score = better match
      });

      const bestPeer = sortedPeers[0];
      await Match.create({
        student: student._id,
        peer: bestPeer._id,
        subject: student.subject,
      });
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🧾 Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ _id: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
