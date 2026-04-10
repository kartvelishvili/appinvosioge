const express = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/send-email
router.post('/send-email', authMiddleware, async (req, res) => {
  const { recipients, subject, html } = req.body;
  if (!recipients || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Missing required fields: recipients, subject, html' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured on server' });
  }

  try {
    const results = [];
    for (const to of (Array.isArray(recipients) ? recipients : [recipients])) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Invoiso <noreply@invoiso.ge>',
          to,
          subject,
          html,
        }),
      });

      const data = await response.json();
      results.push({ to, success: response.ok, data });

      if (!response.ok) {
        console.error(`Email to ${to} failed:`, data);
      }
    }

    const allOk = results.every(r => r.success);
    res.json({ success: allOk, results });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/send-demo-email (no auth required — public form)
router.post('/send-demo-email', optionalAuth, async (req, res) => {
  const formData = req.body;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured on server' });
  }

  try {
    const html = `
      <h2>ახალი დემო მოთხოვნა</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>სახელი</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formData.first_name || ''} ${formData.last_name || ''}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>ელ.ფოსტა</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formData.email || ''}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>ტელეფონი</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formData.phone || '-'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>საიდენტიფიკაციო</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formData.company_id || '-'}</td></tr>
      </table>
      <p style="color: #666; margin-top: 16px;">დრო: ${formData.created_at || new Date().toISOString()}</p>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Invoiso <noreply@invoiso.ge>',
        to: process.env.DEMO_EMAIL_TO || 'info@invoiso.ge',
        subject: `ახალი დემო მოთხოვნა — ${formData.first_name || ''} ${formData.last_name || ''}`,
        html,
      }),
    });

    const data = await response.json();
    res.json({ success: response.ok, data });
  } catch (err) {
    console.error('Demo email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
