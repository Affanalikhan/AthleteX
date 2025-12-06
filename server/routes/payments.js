const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/security');
const {
  createStripePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyStripePayment,
  createRefund
} = require('../services/paymentService');
const { getDatabase } = require('../config/database');

// Create Payment Intent (Stripe)
router.post('/create-intent', verifyToken, paymentLimiter, async (req, res) => {
  try {
    const { amount, currency, sessionId, trainerId } = req.body;

    const result = await createStripePayment(amount, currency, {
      userId: req.user.userId,
      sessionId,
      trainerId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Save payment record
    const db = getDatabase();
    await db.collection('payments').insertOne({
      userId: req.user.userId,
      sessionId,
      trainerId,
      amount,
      currency,
      provider: 'stripe',
      paymentIntentId: result.paymentIntentId,
      status: 'pending',
      createdAt: new Date()
    });

    res.json(result);
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Create Razorpay Order
router.post('/create-order', verifyToken, paymentLimiter, async (req, res) => {
  try {
    const { amount, currency, sessionId, trainerId } = req.body;

    const result = await createRazorpayOrder(amount, currency, {
      userId: req.user.userId,
      sessionId,
      trainerId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Save payment record
    const db = getDatabase();
    await db.collection('payments').insertOne({
      userId: req.user.userId,
      sessionId,
      trainerId,
      amount,
      currency,
      provider: 'razorpay',
      orderId: result.orderId,
      status: 'pending',
      createdAt: new Date()
    });

    res.json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Verify Razorpay Payment
router.post('/verify-razorpay', verifyToken, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const isValid = verifyRazorpayPayment(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update payment record
    const db = getDatabase();
    await db.collection('payments').updateOne(
      { orderId },
      {
        $set: {
          paymentId,
          status: 'completed',
          completedAt: new Date()
        }
      }
    );

    // Update session payment status
    const payment = await db.collection('payments').findOne({ orderId });
    if (payment && payment.sessionId) {
      await db.collection('sessions').updateOne(
        { _id: payment.sessionId },
        {
          $set: {
            'payment.status': 'completed',
            'payment.transactionId': paymentId,
            'payment.completedAt': new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Verify Stripe Payment
router.post('/verify-stripe', verifyToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const result = await verifyStripePayment(paymentIntentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update payment record
    const db = getDatabase();
    await db.collection('payments').updateOne(
      { paymentIntentId },
      {
        $set: {
          status: result.status === 'succeeded' ? 'completed' : result.status,
          completedAt: result.status === 'succeeded' ? new Date() : null
        }
      }
    );

    // Update session payment status
    const payment = await db.collection('payments').findOne({ paymentIntentId });
    if (payment && payment.sessionId && result.status === 'succeeded') {
      await db.collection('sessions').updateOne(
        { _id: payment.sessionId },
        {
          $set: {
            'payment.status': 'completed',
            'payment.transactionId': paymentIntentId,
            'payment.completedAt': new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: result
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Get Payment History
router.get('/history', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const payments = await db.collection('payments')
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Request Refund
router.post('/refund', verifyToken, async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const db = getDatabase();
    const payment = await db.collection('payments').findOne({
      $or: [
        { paymentIntentId: paymentId },
        { paymentId: paymentId }
      ],
      userId: req.user.userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const result = await createRefund(
      payment.paymentIntentId || payment.paymentId,
      amount,
      payment.provider
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update payment record
    await db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'refunded',
          refundId: result.refundId,
          refundReason: reason,
          refundedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund failed',
      error: error.message
    });
  }
});

module.exports = router;
