const express = require('express');
const router = express.Router();
const Athlete = require('../models/Athlete');

// Get all athletes
router.get('/', async (req, res) => {
  try {
    const athletes = await Athlete.findAll();
    res.json({ success: true, data: athletes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top athletes
router.get('/top/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const athletes = await Athlete.findTopAthletes(limit);
    res.json({ success: true, data: athletes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get athletes by sport
router.get('/sport/:sport', async (req, res) => {
  try {
    const athletes = await Athlete.findBySport(req.params.sport);
    res.json({ success: true, data: athletes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get athlete by ID
router.get('/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) {
      return res.status(404).json({ success: false, error: 'Athlete not found' });
    }
    res.json({ success: true, data: athlete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get athlete by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const athlete = await Athlete.findByUserId(req.params.userId);
    if (!athlete) {
      return res.status(404).json({ success: false, error: 'Athlete not found' });
    }
    res.json({ success: true, data: athlete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new athlete
router.post('/', async (req, res) => {
  try {
    const athlete = await Athlete.create(req.body);
    res.status(201).json({ success: true, data: athlete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update athlete
router.put('/:id', async (req, res) => {
  try {
    const updated = await Athlete.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Athlete not found' });
    }
    const athlete = await Athlete.findById(req.params.id);
    res.json({ success: true, data: athlete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update athlete profile
router.put('/user/:userId/profile', async (req, res) => {
  try {
    const updated = await Athlete.updateProfile(req.params.userId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Athlete not found' });
    }
    const athlete = await Athlete.findByUserId(req.params.userId);
    res.json({ success: true, data: athlete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
