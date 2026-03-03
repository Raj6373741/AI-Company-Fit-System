const express = require("express");
const router = express.Router();

const Candidate = require("../models/Candidate");
const upload = require("../middleware/uploadMiddleware");
const fs = require("fs");

// 🔥 GET ALL CANDIDATES (Optional Admin Use)
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔥 RESUME UPLOAD (SESSION BASED)
router.post(
  "/upload-resume",
  upload.single("resume"),
  async (req, res) => {
    try {

      // 🔒 Session Check
      if (!req.session.user || req.session.user.role !== "candidate") {
        return res.redirect("/");
      }

      if (!req.file) {
        return res.redirect("/candidate/dashboard");
      }

      const candidate = await Candidate.findOne({
        userId: req.session.user.id
      });

      if (!candidate) {
        return res.redirect("/candidate/dashboard");
      }

      const filePath = `uploads/${req.file.filename}`;

      // 🔥 Read resume text (best for .txt files)
      let resumeText = "";

      try {
        resumeText = fs.readFileSync(filePath, "utf8").toLowerCase();
      } catch {
        resumeText = "";
      }

      // 🔥 Simulated AI Skill Extraction
      const skillDictionary = [
        "javascript",
        "react",
        "node",
        "html",
        "css",
        "mongodb",
        "python",
        "java",
        "c++"
      ];

      const extractedSkills = skillDictionary.filter(skill =>
        resumeText.includes(skill)
      );

      candidate.resume = req.file.filename;
      candidate.skills = extractedSkills;

      await candidate.save();

      // 🔁 Redirect back to dashboard
      req.session.message = "Resume uploaded successfully!";
      res.redirect("/candidate/profile");

    } catch (error) {
      console.error("Upload Error:", error);
      res.redirect("/candidate/profile");
    }
  }
);

module.exports = router;