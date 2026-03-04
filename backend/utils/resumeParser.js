const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractResumeText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.toLowerCase();
  } catch (error) {
    console.error("Resume Parse Error:", error);
    return "";
  }
}

module.exports = extractResumeText;


// ---------- AI Skill Extraction ----------
function extractSkillsFromResume(text) {

const skillDatabase = [
"html","css","javascript","react","node","express","mongodb",
"python","java","c","c++","sql","mysql","git","github",
"bootstrap","tailwind","angular","php","django"
]

const detectedSkills = []

skillDatabase.forEach(skill => {

if(text.includes(skill)){
detectedSkills.push(skill)
}

})

return detectedSkills

}

module.exports.extractSkillsFromResume = extractSkillsFromResume