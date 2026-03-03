const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  requiredSkills: [String],
  minExperience: Number,
  companyCultureScore: Number,

  // 🔥 New Dynamic Weights
  skillWeight: { type: Number, default: 50 },
  experienceWeight: { type: Number, default: 30 },
  personalityWeight: { type: Number, default: 20 },
  status: { type: String, default: "open" },

}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);