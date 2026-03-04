require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const LoginLog = require("./models/LoginLog");
const { requireLogin, requireRole } = require("./middleware/sessionAuth");
const Candidate = require("./models/Candidate");
const { calculateFitScore } = require("./services/fitService");
const { sendApplicationConfirmation, sendHRNotification } = require('./services/emailService');
const Job = require("./models/Job");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const Application = require("./models/Application");
const User = require("./models/User");
const mongoose = require("mongoose");
const { error } = require("console");
const path = require("path");
const extractResumeText = require("./utils/resumeParser");
const { extractSkillsFromResume } = require("./utils/resumeParser");

// --------
//------------
// CONNECT DATABASE
// --------------------
connectDB();

// --------------------
// SECURITY MIDDLEWARE
// --------------------
// HELMET CONFIG - Allow CDN and inline scripts
// SECURITY MIDDLEWARE - Updated CSP
app.use(helmet({
    contentSecurityPolicy: false,
}));

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

app.use('/', authRoutes);

// --------------------
// ROOT ROUTE (AUTO REDIRECT)
// --------------------
// ROOT ROUTE (AUTO REDIRECT)
// ROOT ROUTE (AUTO REDIRECT)
app.get("/", (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === "hr") {
      return res.redirect("/hr/dashboard");
    }
    if (req.session.user.role === "candidate") {
      return res.redirect("/candidate/dashboard");
    }
  }

  // Get tab from query parameter
  const tab = req.query.tab || 'login';

  res.render("login", {
    layout: false,
    title: "Login",
    tab: tab  // Pass tab to template
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
      .sort({ createdAt: -1 })
      .limit(50);

    res.render("login-logs", {
      title: "Login Logs",
      logs
    });
});

// HR DASHBOARD with analytics
// HR DASHBOARD with charts data
app.get("/hr/dashboard",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {
      // Get all jobs
      const jobs = await Job.find({});
      
      // Get total candidates
      const totalCandidates = await Candidate.countDocuments();
      
      // Get total applications
      const totalApplications = await Application.countDocuments();
      
      // Get jobs with application counts
      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          const count = await Application.countDocuments({ job: job._id });
          return {
            ...job.toObject(),
            applicationCount: count
          };
        })
      );
      
      // ===== HIRING TRENDS DATA (Last 12 months) =====
      const now = new Date();
      const months = [];
      const applicationCounts = [];
      
      // Month names
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Get last 12 months data
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        // Count applications in this month
        const count = await Application.countDocuments({
          createdAt: { $gte: month, $lt: nextMonth }
        });
        
        months.push(monthNames[month.getMonth()]);
        applicationCounts.push(count);
      }
      
      // ===== TOP JOBS DATA =====
      const topJobs = jobsWithCounts
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5)
        .map(job => ({
          title: job.title,
          count: job.applicationCount
        }));
      
      // Get query parameter
      const created = req.query.created || null;

      console.log("Months:", months);
      console.log("Application Counts:", applicationCounts);
      console.log("Top Jobs:", topJobs);

      res.render("hr-dashboard", {
        title: "HR Dashboard",
        jobs: jobsWithCounts,
        totalJobs: jobs.length,
        totalCandidates,
        totalApplications,
        activeJobs: jobs.filter(j => j.status !== 'closed').length,
        months: JSON.stringify(months),
        applicationCounts: JSON.stringify(applicationCounts),
        topJobs: JSON.stringify(topJobs),
        created
      });
      
    } catch (error) {
      console.error("Dashboard error:", error);
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

      res.redirect("/hr/dashboard?created=success");  // 👈 YEH CHANGE KARO

    } catch (error) {
      res.status(500).send("Error creating job");
    }
  }
);

// COMPARE ROUTE - POST
// COMPARE ROUTE - POST (for form submission)
// COMPARE ROUTE - POST

app.post("/hr/compare/:jobId",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {

    try {

      // 🔥 Always normalize to array
      const selected = [].concat(req.body.applications || []);

      console.log("Raw body:", req.body);
      console.log("Selected after normalize:", selected);

      // ❌ No selection
      if (selected.length === 0) {
        return res.send("No candidates selected");
      }

      // ❌ Not exactly 2
      if (selected.length !== 2) {
        return res.send("Please select exactly 2 candidates");
      }

      // ✅ Validate ObjectIds
      const validIds = selected.filter(id =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (validIds.length !== 2) {
        return res.send("Invalid candidate IDs");
      }

      const objectIds = validIds.map(id =>
        new mongoose.Types.ObjectId(id)
      );

      // ✅ Fetch Applications
      const applications = await Application.find({
        _id: { $in: objectIds }
      }).populate("candidate");

      console.log("Found Applications:", applications.length);

      if (applications.length !== 2) {
        return res.send("Applications not found");
      }

      const [c1, c2] = applications;

      const score1 = c1.evaluation?.finalScore || 0;
      const score2 = c2.evaluation?.finalScore || 0;

      const winner = score1 >= score2 ? c1 : c2;

      res.render("compare", {
        title: "Compare Candidates",
        c1,
        c2,
        winner
      });

    } catch (error) {
      console.error("Compare error:", error);
      res.status(500).send("Error: " + error.message);
    }
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

// HR JOB DETAILS PAGE - Applicants sorted by score
app.get("/hr/job/:id/applicants",
  requireLogin,
  requireRole("hr"),
  async (req, res) => {
    try {

      const jobId = req.params.id;

      const job = await Job.findById(jobId);
      if (!job) {
        return res.redirect("/hr/dashboard");
      }

      // ✅ Fetch only valid applications
      const applications = await Application.find({
        job: jobId,
        candidateName: { $exists: true, $ne: null }
      })
      .populate("candidate")
      .sort({ "evaluation.finalScore": -1 });

      res.render("job-detail", {
        title: "Applicants",
        job,
        applications
      });

    } catch (error) {
      console.error("Applicants Route Error:", error);
      res.status(500).send("Something went wrong while loading applicants.");
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
// CANDIDATE DASHBOARD
app.get("/candidate/dashboard", requireLogin, requireRole("candidate"), async (req, res) => {

  const jobs = await Job.find({ status: { $regex: /^open$/i } });

  // 👇 IMPORTANT: candidate find karo
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

  // Get query parameters
  const applied = req.query.applied || null;

  const error = req.query.error || null;

  console.log("Candidate data:", candidate); // Debug

  res.render("candidate-dashboard", {
    jobs,
    appliedJobs,
    applied,
    candidate: candidate || { name: 'Candidate', skills: [], experience: 0, personalityScore: 50 }, // 👈 FIX: candidate pass karo
    user: req.session.user,
    error
  });

});

// APPLY FOR JOB - with better error handling
app.post("/candidate/apply/:jobId",
  requireLogin,
  requireRole("candidate"),
  async (req, res) => {

    try {

      const jobId = req.params.jobId;
      console.log("🚀 Apply route hit for job:", jobId);

      // Find candidate with error handling
      const candidate = await Candidate.findOne({
        userId: new mongoose.Types.ObjectId(req.session.user.id)
      });

      if (!candidate) {
        console.log("Candidate not found");
        req.session.message = "Please complete your profile first";
        return res.redirect("/candidate/profile");
      }

      if (!candidate.resume) {
        return res.redirect("/candidate/dashboard?error=noresume");
      }

      // Find job
      const job = await Job.findById(jobId);
      if (!job) {
        console.log("Job not found");
        req.session.message = "Job not found";
        return res.redirect("/candidate/dashboard");
      }

      // Find user
      const user = await User.findById(req.session.user.id);
      if (!user) {
        console.log("User not found");
        return res.redirect("/logout");
      }

      console.log("Candidate found:", candidate.name);
      console.log("Job found:", job.title);

      // Check duplicate application
      const existing = await Application.findOne({
        candidate: candidate._id,
        job: jobId  
      });

      if (existing) {
        console.log("Already applied");
        return res.redirect("/candidate/dashboard?applied=already");
      }

      // Calculate fit score
      console.log("Calculating fit score...");

      // Extract resume text
      const resumePath = path.join(__dirname, "uploads", candidate.resume);

      // Resume text extract
      const resumeText = await extractResumeText(resumePath);

      console.log("Resume Path:", resumePath);
      console.log("Resume Text Sample:", resumeText.substring(0,200));


      // ---------- AI SKILL DETECTION ----------
      const detectedSkills = extractSkillsFromResume(resumeText);

      console.log("Detected Resume Skills:", detectedSkills);


      // Merge candidate skills + resume skills
      candidate.skills = [
        ...(candidate.skills || []),
        ...detectedSkills
      ];

      // Remove duplicates
      candidate.skills = [...new Set(candidate.skills)];

      console.log("Final Candidate Skills:", candidate.skills);


      // Calculate fit score
      const evaluation = calculateFitScore(candidate, job, resumeText);

      console.log("Fit score calculated:", evaluation);

      const applicationData = {
        candidate: candidate._id,
        job: jobId,
        candidateName: candidate.name,
        candidateEmail: user.email,
        candidateSkills: candidate.skills,
        candidateExperience: candidate.experience,
        candidatePersonality: candidate.personalityScore,
        jobTitle: job.title,
        evaluation: evaluation
      };

      await Application.create(applicationData);

      console.log("Creating application with data:", applicationData);
      
      console.log("Application created successfully!");

      // Send emails (async - don't await)
      try {
        if (user.email) {
          sendApplicationConfirmation(user.email, candidate.name, job.title)
            .catch(err => console.log("Email send error:", err.message));
        }

        // Notify HR
        User.find({ role: "hr" }).then(hrUsers => {
          hrUsers.forEach(hr => {
            if (hr.email) {
              sendHRNotification(hr.email, candidate.name, job.title)
                .catch(err => console.log("HR email error:", err.message));
            }
          });
        });
      } catch (emailErr) {
        console.log("Email error (non-blocking):", emailErr.message);
      }

      console.log("Redirecting with success");
      res.redirect("/candidate/dashboard?applied=success");

    } catch (error) {
      console.error("Apply Route Error:", error);
      console.error("Error stack:", error.stack);
      
      // Store error message in session
      req.session.message = "Something went wrong: " + error.message;
      res.redirect("/candidate/dashboard");
    }
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

// Update candidate profile
app.post("/candidate/profile/update",
  requireLogin,
  requireRole("candidate"),
  async (req, res) => {

    try {

      const { name, email, mobile, experience } = req.body;
      const userId = req.session.user.id;

      await User.findByIdAndUpdate(userId, {
        name,
        email
      });

      await Candidate.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          name,
          mobile,
          experience
        },
        { upsert: true, new: true }
        );

      // 🔥 UPDATE SESSION ALSO
      req.session.user.name = name;
      req.session.user.email = email;

      res.redirect("/candidate/profile");

    } catch (error) {
      console.error("Profile Update Error:", error);
      res.status(500).send("Profile update failed");
    }
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