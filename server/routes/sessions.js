const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.findAll();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sessions by trainer ID
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    const sessions = await Session.findByTrainerId(req.params.trainerId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sessions by athlete ID
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const sessions = await Session.findByAthleteId(req.params.athleteId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get upcoming sessions for trainer
router.get('/trainer/:trainerId/upcoming', async (req, res) => {
  try {
    const sessions = await Session.findUpcoming(req.params.trainerId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const updated = await Session.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const session = await Session.findById(req.params.id);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const updated = await Session.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const session = await Session.findById(req.params.id);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
