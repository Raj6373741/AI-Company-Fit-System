const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        return null;
    }
}

async function extractResumeData(filePath) {
    try {
        // Extract text from file
        const text = await extractTextFromFile(filePath);
        if (!text) return null;

        // Use Gemini to parse resume
        const prompt = `
        You are a resume parser. Extract skills and years of experience from this resume.
        
        Resume text:
        ${text.substring(0, 3000)}
        
        Return ONLY valid JSON in this format:
        {
            "skills": ["skill1", "skill2", "skill3"],
            "experience": 5
        }
        
        Rules:
        - skills: array of technical skills (programming languages, tools, technologies)
        - experience: total years of professional experience (number only)
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return null;
    } catch (error) {
        console.error('Resume parsing error:', error);
        return null;
    }
}

module.exports = { extractResumeData };