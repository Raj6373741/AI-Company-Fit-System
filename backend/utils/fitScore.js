exports.calculateFitScore = (candidate, job) => {

  const totalRequiredSkills = job.requiredSkills.length;

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

  const totalScore = skillScore + experienceScore + personalityScore;

  return Math.round(totalScore);
};