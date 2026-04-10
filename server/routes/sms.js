const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/send-sms
router.post('/send-sms', optionalAuth, async (req, res) => {
  let { numbers, message } = req.body;

  // Some callers send stringified body
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      numbers = parsed.numbers;
      message = parsed.message;
    } catch { /* ignore */ }
  }

  if (!numbers || !message) {
    return res.status(400).json({ success: false, error: 'Missing numbers or message' });
  }

  const API_KEY = process.env.SMSOFFICE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ success: false, error: 'SMSOFFICE_API_KEY not configured' });
  }

  try {
    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('destination', Array.isArray(numbers) ? numbers.join(',') : numbers);
    params.append('sender', process.env.SMSOFFICE_SENDER || 'SmarketerGE');
    params.append('content', message);
    params.append('urgent', 'true');

    const response = await fetch('https://smsoffice.ge/api/v2/send/', {
      method: 'POST',
      body: params,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { Success: false, Message: responseText };
    }

    const isSuccess =
      data.Success === true ||
      String(data.Success).toLowerCase() === 'true' ||
      data.ErrorCode === 0;

    res.json({
      success: isSuccess,
      data,
      details: data.Message || (isSuccess ? 'Sent' : 'Failed'),
    });
  } catch (err) {
    console.error('SMS send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/create-admin-user
router.post('/create-admin-user', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const email = req.body.email || process.env.ADMIN_EMAIL || 'admin@invoiso.ge';
    const password = req.body.password || process.env.ADMIN_PASSWORD;

    if (!password) {
      return res.status(400).json({ success: false, error: 'ADMIN_PASSWORD not set' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ success: false, error: error.message });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
