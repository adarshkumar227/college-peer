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

// Optional: Index for fast retrieval by recent updates
sessionSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
