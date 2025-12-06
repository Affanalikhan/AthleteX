const express = require('express');
const router = express.Router();
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const User = require('../models/User');
const Athlete = require('../models/Athlete');
const Trainer = require('../models/Trainer');

// Register Athlete
router.post('/register/athlete', authLimiter, async (req, res) => {
  try {
    const { email, password, displayName, profile } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
      role: 'athlete'
    });

    // Create athlete profile
    const athlete = await Athlete.create({
      userId: user._id.toString(),
      email,
      profile: profile || {}
    });

    // Generate token
    const token = generateToken(user._id.toString(), email, 'athlete');

    res.status(201).json({
      success: true,
      message: 'Athlete registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        athlete: {
          id: athlete._id,
          userId: athlete.userId
        },
        token
      }
    });
  } catch (error) {
    console.error('Register athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Register Trainer
router.post('/register/trainer', authLimiter, async (req, res) => {
  try {
    const { email, password, personalDetails, experience, qualifications } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if trainer exists
    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create trainer
    const trainer = await Trainer.create({
      email,
      password: hashedPassword,
      role: 'trainer',
      personalDetails: personalDetails || {},
      experience: experience || {},
      qualifications: qualifications || {},
      verification: {
        status: 'pending'
      }
    });

    // Generate token
    const token = generateToken(trainer._id.toString(), email, 'trainer');

    res.status(201).json({
      success: true,
      message: 'Trainer registered successfully',
      data: {
        trainer: {
          id: trainer._id,
          email: trainer.email,
          role: trainer.role,
          verificationStatus: trainer.verification.status
        },
        token
      }
    });
  } catch (error) {
    console.error('Register trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;
    let userRole;

    if (role === 'trainer') {
      // Login as trainer
      user = await Trainer.findOne({ email });
      userRole = 'trainer';
    } else {
      // Login as athlete/admin
      user = await User.findOne({ email });
      userRole = user?.role || 'athlete';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), email, userRole);

    // Get additional profile data
    let profileData = null;
    if (userRole === 'athlete') {
      profileData = await Athlete.findOne({ userId: user._id.toString() });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName || user.personalDetails?.name,
          role: userRole
        },
        profile: profileData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Verify Token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      data: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Find user
    let user = await User.findOne({ email });
    if (!user) {
      user = await Trainer.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

module.exports = router;
