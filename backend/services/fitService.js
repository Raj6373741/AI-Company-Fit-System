const { calculateSkillSimilarity } = require("./skillMatcher");

exports.calculateFitScore = (candidate, job, resumeText = "") => {

  console.log("Calculating fit score for:", {
    candidateName: candidate.name,
    candidateSkills: candidate.skills,
    candidateExp: candidate.experience,
    jobSkills: job.requiredSkills
  });

  // ---------- SAFE VALUES ----------
  let candidateSkills = candidate.skills || [];
  let jobSkills = job.requiredSkills || [];

  const candidateExp = candidate.experience || 0;
  const jobMinExp = job.minExperience || 0;
  const candidatePersonality = candidate.personalityScore || 50;

  // Convert skills to lowercase
  candidateSkills = candidateSkills.map(s => s.toLowerCase());
  jobSkills = jobSkills.map(s => s.toLowerCase());

  // ---------- RESUME SKILL DETECTION ----------
  const resumeSkills = jobSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill)
  );

  // Merge candidate + resume skills
  const combinedSkills = [...new Set([...candidateSkills, ...resumeSkills])];

  console.log("Candidate Skills:", candidateSkills);
  console.log("Resume Skills:", resumeSkills);
  console.log("Combined Skills:", combinedSkills);
  console.log("Job Skills:", jobSkills);

  // ---------- SKILL MATCH ----------
  const skillResult = calculateSkillSimilarity(
    combinedSkills,
    jobSkills
  );

  // Weight configuration (fixed)
  const skillWeight = 0.5;
  const experienceWeight = 0.3;
  const personalityWeight = 0.2;

  // Skill score (0–50)
  const skillScore = (skillResult.matchRatio || 0) * 100 * skillWeight;

  // Experience score (0–30)
  const experienceRatio = candidateExp >= jobMinExp
    ? 1
    : candidateExp / (jobMinExp || 1);

  const experienceScore = experienceRatio * 100 * experienceWeight;

  // Personality score (0–20)
  const personalityScore = (candidatePersonality / 100) * 100 * personalityWeight;

  // Final Score (0–100)
  const finalScore = skillScore + experienceScore + personalityScore;

  // ---------- CONFIDENCE INDEX ----------
  const confidenceIndex = Math.round(
    ((skillResult.matchRatio || 0) * 0.6 +
    (experienceRatio * 0.3) +
    (candidatePersonality / 100) * 0.1) * 100
  );

  // ---------- EXPLANATION ----------
  let explanation = "";

  if (finalScore > 80) {
    explanation = "Excellent match for this role!";
  } else if (finalScore > 60) {
    explanation = "Good fit with minor gaps.";
  } else if (finalScore > 40) {
    explanation = "Needs improvement in required skills.";
  } else {
    explanation = "Significant skill gap identified.";
  }

  const result = {
    skillMatchCount: skillResult.matchCount || 0,
    skillMatchPercent: Math.round((skillResult.matchRatio || 0) * 100),
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(experienceScore),
    personalityScore: Math.round(personalityScore),
    finalScore: Math.round(finalScore),
    confidenceIndex: confidenceIndex,
    explanation
  };

  console.log("Fit score result:", result);

  return result;
};