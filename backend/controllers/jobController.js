const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { calculateFitScore } = require("../services/fitService");


// 🔥 APPLY JOB
exports.applyJob = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id });
    const job = await Job.findById(req.params.jobId);

    if (!candidate || !job) {
      return res.status(404).json({ message: "Data not found" });
    }

    const scoreDetails = calculateFitScore(candidate, job);

    await Application.create({
      candidate: candidate._id,
      job: job._id,
      fitScore: scoreDetails.finalScore
    });

    res.json({
      message: "Applied Successfully",
      scoreBreakdown: scoreDetails
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔥 RANK CANDIDATES
exports.rankCandidates = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate({
        path: "candidate",
        select: "skills experience personalityScore resume"
      })
      .sort({ fitScore: -1 });

    const result = applications.map(app => ({
        fitScore: app.fitScore,
        candidate: {
            skills: app.candidate.skills,
            experience: app.candidate.experience,
            personalityScore: app.candidate.personalityScore
        },
        resumeLink: app.candidate?.resume
            ? `http://localhost:5000/uploads/${app.candidate.resume}`
            : null
    }));

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔥 JOB STATS
exports.jobStats = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate("candidate");

    const validApplications = applications.filter(app => app.candidate);

    if (!validApplications.length) {
      return res.json({ message: "No valid applications yet" });
    }

    const totalApplications = validApplications.length;
    const fitScores = validApplications.map(app => app.fitScore);

    const averageFitScore =
      fitScores.reduce((a, b) => a + b, 0) / totalApplications;

    const highestFitScore = Math.max(...fitScores);
    const lowestFitScore = Math.min(...fitScores);

    const topCandidate = validApplications.find(
      app => app.fitScore === highestFitScore
    );

    const skillFrequency = {};

    validApplications.forEach(app => {
      app.candidate.skills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    res.json({
      totalApplications,
      averageFitScore: Math.round(averageFitScore),
      highestFitScore,
      lowestFitScore,
      topCandidate: {
        fitScore: topCandidate.fitScore,
        skills: topCandidate.candidate.skills
      },
      skillFrequency
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};