// routes/studentRoutes.js
const express = require("express");
const Student = require("../models/Student");
const router = express.Router();

// Create student
router.post("/", async (req, res) => {
  try {
    console.log("📥 Incoming Student Data:", req.body);
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    console.log("✅ Saved Student:", savedStudent);
    res.status(201).json(savedStudent);
  } catch (err) {
    console.error("❌ Error saving student:", err);
    res.status(400).json({ message: err.message });
  }
});

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get single student
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Student.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
