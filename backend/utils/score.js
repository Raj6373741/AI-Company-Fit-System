exports.calculateFitScore = (candidate, job) => {

  console.log("Candidate skills:", candidate.skills);
  console.log("Job required skills:", job.requiredSkills);

  const totalRequiredSkills = job.requiredSkills.length || 1;

  const matchedSkills = candidate.skills.filter(skill =>
    job.requiredSkills.includes(skill)
  );

  const skillMatchRatio = matchedSkills.length / totalRequiredSkills;
  const skillScore = skillMatchRatio * job.skillWeight;

  const experienceRatio =
    candidate.experience >= job.minExperience
      ? 1
      : candidate.experience / job.minExperience;

  const experienceScore = experienceRatio * job.experienceWeight;

  const personalityRatio = candidate.personalityScore / 100;
  const personalityScore = personalityRatio * job.personalityWeight;

  const finalScore = Math.round(skillScore + experienceScore + personalityScore);

  const result = {
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(experienceScore),
    personalityScore: Math.round(personalityScore),
    finalScore: finalScore,
    confidenceIndex: Math.round(finalScore * 0.7)
  };

  console.log("Evaluation Result:", result);

  return result;
};