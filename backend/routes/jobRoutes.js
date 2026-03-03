const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  applyJob,
  rankCandidates,
  jobStats
} = require("../controllers/jobController");


// 🔥 APPLY TO JOB (Candidate Only)
router.post(
  "/apply/:jobId",
  protect,
  authorize("candidate"),
  applyJob
);


// 🔥 RANK CANDIDATES (HR Only)
router.get(
  "/rank/:jobId",
  protect,
  authorize("hr"),
  rankCandidates
);


// 🔥 JOB STATS (HR Only)
router.get(
  "/stats/:jobId",
  protect,
  authorize("hr"),
  jobStats
);


module.exports = router;