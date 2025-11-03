const mongoose = require("mongoose");

// ✅ Session Schema with timestamps for permanent DB tracking
const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    peerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Peer",
      required: true
    },
    topic: {
      type: String,
      default: "General"
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["pending", "matched", "active", "completed", "cancelled"],
      default: "pending"
    },
    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true // ✅ Adds createdAt and updatedAt automatically
  }
);

// ✅ Automatically ensure `updatedAt` changes when status is modified
sessionSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.updatedAt = new Date();
  }
  next();
});

// ✅ Static method to update session status permanently in DB
sessionSchema.statics.updateSessionStatus = async function (sessionId, newStatus) {
  try {
    const updatedSession = await this.findByIdAndUpdate(
      sessionId,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    );
    return updatedSession;
  } catch (error) {
    console.error("❌ Error updating session status:", error);
    throw error;
  }
};

// Optional: Index for fast retrieval by recent updates
sessionSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
