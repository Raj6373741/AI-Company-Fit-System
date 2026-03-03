require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const LoginLog = require("./models/LoginLog");
const { requireLogin, requireRole } = require("./middleware/sessionAuth");
const Candidate = require("./models/Candidate");
const { calculateFitScore } = require("./services/fitService");
const Job = require("./models/Job");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const Application = require("./models/Application");
const User = require("./models/User");
const mongoose = require("mongoose");

// --------
//------------
// CONNECT DATABASE
// --------------------
connectDB();

// --------------------
// SECURITY MIDDLEWARE
// --------------------
app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// --------------------
// ENGINE SETUP
// --------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // default layout file

// --------------------
// STATIC FILES
// --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------
// BODY PARSER
// --------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --------------------
// SESSION CONFIG
// --------------------
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60
  }
}));

// --------------------
// GLOBAL USER FOR EJS
// --------------------
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --------------------
// ROOT ROUTE (AUTO REDIRECT)
// --------------------
app.get("/", (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === "hr") {
      return res.redirect("/hr/dashboard");
    }
    if (req.session.user.role === "candidate") {
      return res.redirect("/candidate/dashboard");
    }
  }

  res.render("login", {
    layout: false,
    title: "Login"
  });
});

// --------------------
// LOGOUT ROUTE (FIXED)
// --------------------
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// --------------------
// HR DASHBOARD
// --------------------

app.get("/hr/logins",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    const logs = await LoginLog.find({})
      .sort({ loginTime: -1 })
      .limit(50);

    res.render("login-logs", {
      title: "Login Logs",
      logs
    });
});

app.get("/hr/dashboard",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      const jobs = await Job.find({});
      res.render("hr-dashboard", {
        title: "HR Dashboard",
        jobs
      });
    } catch (error) {
      res.status(500).send("Error loading dashboard");
    }
  }
);

app.get("/hr/compare/:jobId/:c1/:c2",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    const { jobId, c1, c2 } = req.params;

    const job = await Job.findById(jobId);
    const candidate1 = await Candidate.findById(c1);
    const candidate2 = await Candidate.findById(c2);

    if (!job || !candidate1 || !candidate2) {
      return res.redirect("/hr/dashboard");
    }

    const score1 = calculateFitScore(candidate1, job);
    const score2 = calculateFitScore(candidate2, job);

    let recommended = null;

    if (score1.finalScore > score2.finalScore) {
      recommended = candidate1.name || "Candidate 1";
    } else {
      recommended = candidate2.name || "Candidate 2";
    }

    res.render("compare", {
      title: "Candidate Comparison",
      candidate1,
      candidate2,
      score1,
      score2,
      recommended
    });
});
// --------------------
// CREATE JOB
// --------------------
app.post("/hr/job/create",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      const { title, minExperience, skills } = req.body;

      await Job.create({
        title,
        minExperience,
        requiredSkills: skills.split(",").map(s => s.trim()),
        status: "open"
      });

      res.redirect("/hr/dashboard");

    } catch (error) {
      res.status(500).send("Error creating job");
    }
  }
);

app.get("/hr/job/:id/view", requireLogin, requireRole("hr"), async (req, res) => {

  const job = await Job.findById(req.params.id);

  const applications = await Application.find({
    job: req.params.id
  }).sort({ "evaluation.finalScore": -1 });

  res.render("job-detail", {
    title: "Applicants",
    job,
    applications
  });
});

app.post("/hr/compare/:jobId", requireLogin, requireRole("hr"), async (req, res) => {

  const selected = req.body.candidates;

  if (!selected || selected.length !== 2) {
    return res.send("Please select exactly 2 candidates.");
  }

  const applications = await Application.find({
    job: req.params.jobId,
    candidate: { $in: selected }
  });

  if (applications.length !== 2) {
    return res.send("Comparison data not found.");
  }

  const c1 = applications[0];
  const c2 = applications[1];

  const winner =
    c1.evaluation.finalScore >= c2.evaluation.finalScore ? c1 : c2;

  res.render("compare", {
    title: "Compare",
    c1,
    c2,
    winner
  });
});

app.get("/hr/job/:id",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.redirect("/hr/dashboard");
      }

      res.render("job-view", {
        title: "Job Details",
        job
      });

    } catch (error) {
      console.log(error);
      res.redirect("/hr/dashboard");
    }
});

app.get("/hr/job/:id/applicants",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.redirect("/hr/dashboard");
      }

      const applications = await Application.find({
        job: req.params.id
      }).populate("candidate");

      // REMOVE BROKEN REFERENCES HERE
      const validApplications = applications.filter(
        app => app.candidate !== null
      );

      res.render("job-detail", {
        title: "Applicants",
        job,
        applications: validApplications
      });

    } catch (error) {
      console.log(error);
      res.redirect("/hr/dashboard");
    }
});


// --------------------
// CLOSE JOB
// --------------------
app.get("/hr/job/:id/close",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      await Job.findByIdAndUpdate(req.params.id, { status: "closed" });
      res.redirect("/hr/dashboard");
    } catch (error) {
      res.status(500).send("Error closing job");
    }
  }
);

// --------------------
// CANDIDATE DASHBOARD
// --------------------
app.get("/candidate/dashboard", requireLogin, requireRole("candidate"), async (req, res) => {

  const jobs = await Job.find({ status: { $regex: /^open$/i } });

  const candidate = await Candidate.findOne({
    userId: new mongoose.Types.ObjectId(req.session.user.id)
  });

  let appliedJobs = [];

  if (candidate) {
    const applications = await Application.find({
      candidate: candidate._id
    });

    appliedJobs = applications.map(app => app.job.toString());
  }

  res.render("candidate-dashboard", {
    jobs,
    appliedJobs
  });

});

app.post("/candidate/apply/:jobId", requireLogin, requireRole("candidate"), async (req, res) => {

  const jobId = req.params.jobId;

  const candidate = await Candidate.findOne({
    userId: new mongoose.Types.ObjectId(req.session.user.id)
  });

  const job = await Job.findById(jobId);

  if (!candidate || !job) {
    return res.redirect("/candidate/dashboard");
  }

  //  Prevent duplicate apply
  const existing = await Application.findOne({
    candidate: candidate._id,
    job: jobId
  });

  if (existing) {
    return res.redirect("/candidate/dashboard?applied=already");
  }

  const evaluation = calculateFitScore(candidate, job);

  await Application.create({
  candidate: candidate._id,
  job: jobId,

  // 🔥 Snapshot stored
  candidateName: candidate.name,
  candidateSkills: candidate.skills,
  candidateExperience: candidate.experience,
  candidatePersonality: candidate.personalityScore,

  evaluation
});

  res.redirect("/candidate/dashboard?applied=success");
});

app.get("/candidate/profile",
  requireLogin,
  requireRole("candidate"),
  async (req, res) => {

  const candidate = await Candidate.findOne({
    userId: new mongoose.Types.ObjectId(req.session.user.id)
  });

  const message = req.session.message;
  req.session.message = null;

  res.render("candidate-profile", {
    title: "My Profile",
    candidate,
    user: req.session.user,
    message
  });
});

app.post("/candidate/profile/update", requireLogin, requireRole("candidate"), async (req, res) => {

  const { name, email, mobile, experience, personalityScore } = req.body;

  await Candidate.findOneAndUpdate(
    { userId: req.session.user.id },
    { name, mobile, experience, personalityScore }
  );

  await User.findByIdAndUpdate(
    req.session.user.id,
    { email }
  );

  req.session.user.email = email;

  res.redirect("/candidate/profile");
});

// --------------------
// API ROUTES
// --------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/candidates", require("./routes/candidateRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));


// --------------------
// TEST ROUTE
// --------------------
app.get("/test", (req, res) => {
  res.send("Server Working");
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});