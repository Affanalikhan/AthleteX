const express = require('express');
const router = express.Router();
const SAIData = require('../models/SAIData');

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await SAIData.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get athlete rankings
router.get('/athletes/rankings/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 50;
    const rankings = await SAIData.getAthleteRankings(limit);
    res.json({ success: true, data: rankings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trainer verification queue
router.get('/trainers/verification-queue', async (req, res) => {
  try {
    const queue = await SAIData.getTrainerVerificationQueue();
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent assessments
router.get('/assessments/recent/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 20;
    const assessments = await SAIData.getRecentAssessments(limit);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance trends
router.get('/analytics/performance-trends/:days?', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const trends = await SAIData.getPerformanceTrends(days);
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sport distribution
router.get('/analytics/sport-distribution', async (req, res) => {
  try {
    const distribution = await SAIData.getSportDistribution();
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create SAI data entry
router.post('/', async (req, res) => {
  try {
    const data = await SAIData.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update SAI data
router.put('/:id', async (req, res) => {
  try {
    const updated = await SAIData.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    const data = await SAIData.findById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
