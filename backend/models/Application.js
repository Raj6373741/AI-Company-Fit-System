const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  // 🔥 Snapshot Data (IMPORTANT FIX)
  candidateName: String,
  candidateSkills: [String],
  candidateExperience: Number,
  candidatePersonality: Number,

  evaluation: {
    skillMatchCount: Number,
    skillMatchPercent: Number,
    skillScore: Number,
    experienceScore: Number,
    personalityScore: Number,
    finalScore: Number,
    confidenceIndex: Number,
    explanation: String
  },

  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Application", applicationSchema);