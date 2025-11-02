// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  rangeBudget: { type: Number, required: true },
  rating: { type: Number, default: 1 },
  experience: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
