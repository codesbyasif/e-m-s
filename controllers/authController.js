const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  city: user.city,
  bio: user.bio,
});

let emailTransporter = null;

const getEmailTransporter = () => {
  if (emailTransporter) return emailTransporter;
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return emailTransporter;
};

const sendPasswordResetEmail = async (to, code) => {
  const transport = getEmailTransporter();
  if (!transport) {
    console.log(`[password-reset] Email to ${to}: ${code}`);
    return { fallback: true };
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'EventHub <no-reply@eventhub.com>',
    to,
    subject: 'EventHub password reset code',
    html: `<p>Your EventHub password reset code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  });
  return { fallback: false };
};

// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirm, adminCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (confirm !== undefined && password !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    let role = 'user';
    if (adminCode) {
      if (!process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(500).json({ success: false, message: 'Admin registration is not configured.' });
      }
      if (adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(403).json({ success: false, message: 'Invalid admin registration code.' });
      }
      role = 'admin';
    }

    const user = await User.create({ name, email, phone, password, role });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user: sendUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended.' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: sendUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a verification code has been sent to that email.' });
    }

    const code = String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.resetCode = hashedCode;
    user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, code);

    res.json({ success: true, message: 'A 6-digit verification code has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/verify-reset-code
exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetCode +resetCodeExpiry');
    if (!user || !user.resetCode || !user.resetCodeExpiry || user.resetCodeExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or has expired.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetCode) {
      return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
    }

    res.json({ success: true, message: 'Code verified. Please set your new password.' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password, confirm } = req.body;
    if (!email || !code || !password || !confirm) {
      return res.status(400).json({ success: false, message: 'Email, code, and both password fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (password !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetCode +resetCodeExpiry');
    if (!user || !user.resetCode || !user.resetCodeExpiry || user.resetCodeExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or has expired.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetCode) {
      return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
    }

    user.password = password;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. You can sign in with your new password.' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: sendUser(req.user) });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone, city, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, phone, city, bio } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: sendUser(user) });
  } catch (err) {
    next(err);
  }
};
