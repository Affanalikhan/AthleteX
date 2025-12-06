const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');

// Get all assessments
router.get('/', async (req, res) => {
  try {
    const assessments = await Assessment.findAll();
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent assessments
router.get('/recent/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const assessments = await Assessment.findRecent(limit);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get assessment by ID
router.get('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get assessments by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const assessments = await Assessment.findByUserId(req.params.userId);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get assessments by athlete ID
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const assessments = await Assessment.findByAthleteId(req.params.athleteId);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get assessment stats by user ID
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const stats = await Assessment.getStatsByUserId(req.params.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new assessment
router.post('/', async (req, res) => {
  try {
    const assessment = await Assessment.create(req.body);
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update assessment
router.put('/:id', async (req, res) => {
  try {
    const updated = await Assessment.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }
    const assessment = await Assessment.findById(req.params.id);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
