const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({

  // 🔹 References
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
    index: true
  },

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
    index: true
  },

  // 🔥 SNAPSHOT DATA (Very Important)
  // Ye data apply time pe freeze ho jayega

  candidateName: {
    type: String,
    required: true,
  },

  candidateEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  candidateSkills: {
    type: [String],
    default: []
  },

  candidateExperience: {
    type: Number,
    default: 0
  },

  candidatePersonality: {
    type: Number,
    default: 0
  },

  jobTitle: {
    type: String,
    required: true
  },

  // 🔹 Evaluation Block
  evaluation: {
    skillMatchCount: { type: Number, default: 0 },
    skillMatchPercent: { type: Number, default: 0 },
    skillScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    personalityScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
    confidenceIndex: { type: Number, default: 0 },
    explanation: { type: String, default: "" }
  }

}, {
  timestamps: true   // ✅ createdAt + updatedAt auto add
});

module.exports = mongoose.model("Application", applicationSchema);