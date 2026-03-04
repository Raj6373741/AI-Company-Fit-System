// Skill matching utility
exports.calculateSkillSimilarity = (candidateSkills, jobSkills) => {
  try {
    // Handle empty arrays
    if (!candidateSkills || !jobSkills || jobSkills.length === 0) {
      return { matchCount: 0, matchRatio: 0 };
    }

    // Normalize skills (lowercase, trim)
    const normalizedCandidate = candidateSkills.map(s => 
      String(s).toLowerCase().trim()
    );
    
    const normalizedJob = jobSkills.map(s => 
      String(s).toLowerCase().trim()
    );

    // Count matches
    let matchCount = 0;
    normalizedCandidate.forEach(cSkill => {
      normalizedJob.forEach(jSkill => {
        if (cSkill.includes(jSkill) || jSkill.includes(cSkill)) {
          matchCount++;
        }
      });
    });

    // Calculate ratio (avoid duplicates)
    const uniqueMatches = new Set();
    normalizedCandidate.forEach(cSkill => {
      normalizedJob.forEach(jSkill => {
        if (cSkill.includes(jSkill) || jSkill.includes(cSkill)) {
          uniqueMatches.add(jSkill);
        }
      });
    });

    const matchRatio = uniqueMatches.size / normalizedJob.length;

    return {
      matchCount: uniqueMatches.size,
      matchRatio: matchRatio || 0
    };

  } catch (error) {
    console.error("Skill matcher error:", error);
    return { matchCount: 0, matchRatio: 0 };
  }
};