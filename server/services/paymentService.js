const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');

// Initialize Razorpay (for Indian payments)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
});

// Stripe Payment Intent (International)
const createStripePayment = async (amount, currency, metadata) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Razorpay Order (India)
const createRazorpayOrder = async (amount, currency, metadata) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: metadata || {}
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error('Razorpay order error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

// Verify Stripe Payment
const verifyStripePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Create Refund
const createRefund = async (paymentId, amount, provider = 'stripe') => {
  try {
    if (provider === 'stripe') {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });
      return {
        success: true,
        refundId: refund.id,
        status: refund.status
      };
    } else if (provider === 'razorpay') {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined
      });
      return {
        success: true,
        refundId: refund.id,
        status: refund.status
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  createStripePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyStripePayment,
  createRefund
};
