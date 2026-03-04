const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractResumeText(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.toLowerCase();
  } catch (err) {
    console.error("Resume parsing error:", err);
    return "";
  }
}

module.exports = extractResumeText;