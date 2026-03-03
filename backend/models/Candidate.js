const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  skills: [String],
  experience: Number,
  personalityScore: Number,
  resume: String
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);