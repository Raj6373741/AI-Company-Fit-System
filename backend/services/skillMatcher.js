const skillMap = {
  "reactjs": "react",
  "react native": "react",
  "node.js": "node",
  "javascript": "js",
  "js": "js",
  "html5": "html",
  "css3": "css",
  "mongo": "mongodb"
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return skillMap[lower] || lower;
}

function partialMatch(skillA, skillB) {
  return skillA.includes(skillB) || skillB.includes(skillA);
}

function calculateSkillSimilarity(candidateSkills, jobSkills) {

  const normalizedCandidate = candidateSkills.map(normalizeSkill);
  const normalizedJob = jobSkills.map(normalizeSkill);

  let matchCount = 0;

  normalizedJob.forEach(jobSkill => {
    normalizedCandidate.forEach(candidateSkill => {
      if (partialMatch(candidateSkill, jobSkill)) {
        matchCount++;
      }
    });
  });

  const matchRatio = matchCount / normalizedJob.length;

  return {
    matchCount,
    matchRatio
  };
}

module.exports = {
  calculateSkillSimilarity
};