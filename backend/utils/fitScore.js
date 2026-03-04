exports.calculateFitScore = (candidate, job, resumeText) => {

  // 🔹 Required Skills lowercase
  const requiredSkills = job.requiredSkills.map(skill =>
    skill.toLowerCase()
  );

  let matchedSkills = 0;

  requiredSkills.forEach(skill => {
    if (resumeText.includes(skill)) {
      matchedSkills++;
    }
  });

  // Skill Score (Max 40)
  const skillPercent =
    requiredSkills.length > 0
      ? matchedSkills / requiredSkills.length
      : 0;

  const skillScore = skillPercent * 40;

  // Experience Score (Max 30)
  const experienceRatio =
    job.minExperience > 0
      ? Math.min(candidate.experience / job.minExperience, 1)
      : 1;

  const experienceScore = experienceRatio * 30;

  // Personality Score (Max 30)
  const personalityScore =
    (candidate.personalityScore / 100) * 30;

  const finalScore =
    skillScore + experienceScore + personalityScore;

  return {
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(experienceScore),
    personalityScore: Math.round(personalityScore),
    finalScore: Math.round(Math.min(finalScore, 100)),
    confidenceIndex: Math.round(finalScore * 0.9)
  };
};