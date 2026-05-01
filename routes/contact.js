const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Message = require('../models/message');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET /contact - Display contact for
router.get('/', (req, res) => {
    res.render('contact', {
        user: req.user || null,
        cart: req.session?.cart || []
    });
});

// POST /contact - Handle form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Email validation
        if (!email || !email.includes('@')) {
            req.session.error = 'Please provide a valid email address.';
            return res.redirect('/contact');
        }

        // Construct email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER, // Where you want to receive contact form submissions
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `,
            html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // Persist message to database (so admins can view it)
        try {
            await Message.create({ name, email, subject, message });
        } catch (dbErr) {
            console.error('Failed to save contact message to DB:', dbErr);
            // continue — we still attempt to send emails
        }

        // Respond immediately so the user doesn't wait for email delivery
        req.session.success = 'Thank you for your message. We will get back to you soon!';
        res.redirect('/contact');

        // Send emails asynchronously (fire-and-forget) to avoid blocking the request
        (async () => {
            try {
                // Send email to admin/owner
                await transporter.sendMail(mailOptions);

                // Send auto-reply to user
                const autoReplyOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Thank you for contacting us',
                    text: `\nDear ${name},\n\nThank you for contacting us. We have received your message and will get back to you as soon as possible.\n\nBest regards,\nThe E-COM Store Team\n`,
                    html: `\n<h2>Thank you for contacting us</h2>\n<p>Dear ${name},</p>\n<p>Thank you for contacting us. We have received your message and will get back to you as soon as possible.</p>\n<p>Best regards,<br>The E-COM Store Team</p>\n`
                };

                await transporter.sendMail(autoReplyOptions);
            } catch (err) {
                console.error('Error sending contact emails (async):', err);
            }
        })();
    } catch (error) {
        console.error('Contact form error:', error);
        req.session.error = 'Sorry, there was an error sending your message. Please try again.';
        res.redirect('/contact');
    }
});

module.exports = router;