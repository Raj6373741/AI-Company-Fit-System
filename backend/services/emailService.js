const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email function
async function sendEmail(to, subject, html) {
    try {
        const mailOptions = {
            from: `"AI Fit Index" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

// Application confirmation email
async function sendApplicationConfirmation(candidateEmail, candidateName, jobTitle) {
    const subject = `Application Received - ${jobTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">AI Fit Index</h2>
            <p>Dear ${candidateName},</p>
            <p>Thank you for applying for the position of <strong>${jobTitle}</strong>.</p>
            <p>Your application has been received and is being reviewed by our HR team.</p>
            <p>You will be notified about the next steps soon.</p>
            <br>
            <p>Best regards,<br>AI Fit Index Team</p>
        </div>
    `;
    
    return await sendEmail(candidateEmail, subject, html);
}

// New application notification to HR
async function sendHRNotification(hrEmail, candidateName, jobTitle) {
    const subject = `New Application - ${jobTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">AI Fit Index</h2>
            <p>Dear HR,</p>
            <p>A new application has been received:</p>
            <ul>
                <li><strong>Candidate:</strong> ${candidateName}</li>
                <li><strong>Position:</strong> ${jobTitle}</li>
            </ul>
            <p>Login to the dashboard to view complete details.</p>
            <br>
            <p>Best regards,<br>AI Fit Index System</p>
        </div>
    `;
    
    return await sendEmail(hrEmail, subject, html);
}

// Interview invitation email
async function sendInterviewInvitation(candidateEmail, candidateName, jobTitle, interviewDate, interviewLink) {
    const subject = `Interview Invitation - ${jobTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">AI Fit Index</h2>
            <p>Dear ${candidateName},</p>
            <p>Congratulations! You have been shortlisted for the position of <strong>${jobTitle}</strong>.</p>
            <p>We would like to invite you for an interview:</p>
            <ul>
                <li><strong>Date:</strong> ${interviewDate}</li>
                <li><strong>Link:</strong> <a href="${interviewLink}">${interviewLink}</a></li>
            </ul>
            <p>Please confirm your availability.</p>
            <br>
            <p>Best regards,<br>AI Fit Index Team</p>
        </div>
    `;
    
    return await sendEmail(candidateEmail, subject, html);
}

module.exports = {
    sendApplicationConfirmation,
    sendHRNotification,
    sendInterviewInvitation
};