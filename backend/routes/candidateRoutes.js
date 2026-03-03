const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Candidate = require('../models/Candidate');
const { extractResumeData } = require('../services/resumeService');
const { requireLogin, requireRole } = require('../middleware/sessionAuth');

// Multer config for resume upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOC files allowed'));
        }
    }
});

// Upload and parse resume
router.post('/upload-resume', 
    requireLogin, 
    requireRole('candidate'),
    upload.single('resume'),
    async (req, res) => {
        try {
            if (!req.file) {
                req.session.message = 'Please select a file';
                return res.redirect('/candidate/profile');
            }

            // Find candidate
            const candidate = await Candidate.findOne({ userId: req.session.user.id });
            if (!candidate) {
                req.session.message = 'Candidate not found';
                return res.redirect('/candidate/profile');
            }

            // Update resume path
            candidate.resume = req.file.filename;
            await candidate.save();

            // Show parsing message
            req.session.message = 'Resume uploaded successfully! Parsing in background...';
            
            // Parse in background (don't await - let it run async)
            extractResumeData(req.file.path).then(extractedData => {
                if (extractedData) {
                    // Update candidate with extracted data
                    if (extractedData.skills && extractedData.skills.length > 0) {
                        candidate.skills = [...new Set([...candidate.skills, ...extractedData.skills])];
                    }
                    if (extractedData.experience) {
                        candidate.experience = extractedData.experience;
                    }
                    candidate.save();
                    console.log('Resume parsed successfully:', extractedData);
                }
            }).catch(err => {
                console.error('Background parsing error:', err);
            });

            res.redirect('/candidate/profile');
        } catch (error) {
            console.error('Resume upload error:', error);
            req.session.message = 'Error uploading resume';
            res.redirect('/candidate/profile');
        }
    }
);

module.exports = router;