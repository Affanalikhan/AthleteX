const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');

// Get performance metrics by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const metrics = await Performance.findByUserId(req.params.userId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance metrics by date range
router.get('/user/:userId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'startDate and endDate are required' 
      });
    }
    const metrics = await Performance.findByUserIdAndDateRange(
      req.params.userId, 
      startDate, 
      endDate
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest performance by user ID
router.get('/user/:userId/latest', async (req, res) => {
  try {
    const metric = await Performance.getLatestByUserId(req.params.userId);
    if (!metric) {
      return res.status(404).json({ success: false, error: 'No performance data found' });
    }
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get average performance by user ID
router.get('/user/:userId/averages', async (req, res) => {
  try {
    const averages = await Performance.getAveragesByUserId(req.params.userId);
    res.json({ success: true, data: averages[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance by ID
router.get('/:id', async (req, res) => {
  try {
    const metric = await Performance.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({ success: false, error: 'Performance data not found' });
    }
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new performance metric
router.post('/', async (req, res) => {
  try {
    const metric = await Performance.create(req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update performance metric
router.put('/:id', async (req, res) => {
  try {
    const updated = await Performance.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Performance data not found' });
    }
    const metric = await Performance.findById(req.params.id);
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
