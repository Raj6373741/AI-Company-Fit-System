const { calculateSkillSimilarity } = require("./skillMatcher");

exports.calculateFitScore = (candidate, job) => {

  const skillResult = calculateSkillSimilarity(
    candidate.skills,
    job.requiredSkills
  );

  const skillScore = skillResult.matchRatio * job.skillWeight;

  const experienceRatio =
    candidate.experience >= job.minExperience
      ? 1
      : candidate.experience / job.minExperience;

  const experienceScore =
    experienceRatio * job.experienceWeight;

  const personalityScore =
    (candidate.personalityScore / 100) * job.personalityWeight;

  const finalScore =
    skillScore + experienceScore + personalityScore;

  // 🔥 Confidence Index
  const confidenceIndex =
    (skillResult.matchRatio * 0.6) +
    (experienceRatio * 0.3) +
    ((candidate.personalityScore / 100) * 0.1);

  let explanation = "";

  if (finalScore > 80) {
    explanation = "Excellent match for this role.";
  } else if (finalScore > 60) {
    explanation = "Good fit with minor gaps.";
  } else {
    explanation = "Needs improvement in required skills.";
  }

  return {
    skillMatchCount: skillResult.matchCount,
    skillMatchPercent: Math.round(skillResult.matchRatio * 100),
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(experienceScore),
    personalityScore: Math.round(personalityScore),
    finalScore: Math.round(finalScore),
    confidenceIndex: Math.round(confidenceIndex * 100),
    explanation
  };
};