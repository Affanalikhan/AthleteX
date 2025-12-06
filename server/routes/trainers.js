const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const KYCVerification = require('../models/KYCVerification');

// Get all trainers
router.get('/', async (req, res) => {
  try {
    const trainers = await Trainer.findAll();
    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get verified trainers
router.get('/verified', async (req, res) => {
  try {
    const trainers = await Trainer.findVerified();
    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trainers by sport
router.get('/sport/:sport', async (req, res) => {
  try {
    const trainers = await Trainer.findBySport(req.params.sport);
    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trainer by ID
router.get('/:id', async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new trainer
router.post('/', async (req, res) => {
  try {
    const trainer = await Trainer.create(req.body);
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update trainer
router.put('/:id', async (req, res) => {
  try {
    const updated = await Trainer.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    const trainer = await Trainer.findById(req.params.id);
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update trainer KYC
router.put('/:id/kyc', async (req, res) => {
  try {
    const updated = await Trainer.updateKYC(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    
    // Also update KYC verification collection
    await KYCVerification.create({
      trainerId: req.params.id,
      ...req.body
    });
    
    const trainer = await Trainer.findById(req.params.id);
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trainer KYC status
router.get('/:id/kyc', async (req, res) => {
  try {
    const kyc = await KYCVerification.findByTrainerId(req.params.id);
    if (!kyc) {
      return res.status(404).json({ success: false, error: 'KYC data not found' });
    }
    res.json({ success: true, data: kyc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Aadhar
router.post('/:id/kyc/aadhar/verify', async (req, res) => {
  try {
    await KYCVerification.verifyAadhar(req.params.id);
    res.json({ success: true, message: 'Aadhar verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify PAN
router.post('/:id/kyc/pan/verify', async (req, res) => {
  try {
    await KYCVerification.verifyPAN(req.params.id);
    res.json({ success: true, message: 'PAN verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Email
router.post('/:id/kyc/email/verify', async (req, res) => {
  try {
    await KYCVerification.verifyEmail(req.params.id);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Phone
router.post('/:id/kyc/phone/verify', async (req, res) => {
  try {
    await KYCVerification.verifyPhone(req.params.id);
    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
