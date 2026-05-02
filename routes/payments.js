const express = require('express');
const router = express.Router();
const AirtelMoneyService = require('../services/airtelMoney');
const Order = require('../models/order');
const { isAuthenticated } = require('./auth');

const airtelService = new AirtelMoneyService();

/**
 * Initiate Airtel Money payment
 * POST /payments/initiate
 */
router.post('/initiate', isAuthenticated, async (req, res) => {
  try {
    const { orderId, phoneNumber } = req.body;

    // Validate input
    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        error: 'Order ID and phone number are required',
      });
    }

    // Get order details
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to authenticated user
    if (order.user._id.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate merchant transaction ID
    const merchantTransactionId = airtelService.generateMerchantTransactionId();

    // Update order with payment details
    order.paymentDetails = {
      merchantTransactionId,
      phoneNumber,
      amount: order.totalAmount,
      currency: 'ZMW',
      timestamp: new Date(),
    };

    // Initiate payment with Airtel Money
    const paymentResponse = await airtelService.initiatePayment({
      phoneNumber,
      amount: order.totalAmount,
      orderId: order._id.toString(),
      merchantTransactionId,
      narration: `Payment for Order #${order._id}`,
    });

    if (!paymentResponse.success) {
      order.paymentStatus = 'Pending';
    }

    // Save payment details to order
    order.paymentDetails.transactionId = paymentResponse.transactionId;
    order.paymentDetails.reference = paymentResponse.reference;
    await order.save();

    res.json({
      success: true,
      transactionId: paymentResponse.transactionId,
      reference: paymentResponse.reference,
      authUrl: paymentResponse.authUrl,
      message: 'Payment initiated. Redirecting to Airtel Money...',
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to initiate payment',
    });
  }
});

/**
 * Webhook callback from Airtel Money
 * POST /payments/callback
 */
router.post('/callback', async (req, res) => {
  try {
    const signature = req.headers['x-airtel-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!airtelService.verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid webhook signature');
      // Still process but log the warning
    }

    // Parse webhook data
    const webhookData = airtelService.parseWebhookCallback(payload);

    // Find order by merchant transaction ID
    const order = await Order.findOne({
      'paymentDetails.merchantTransactionId': webhookData.reference,
    });

    if (!order) {
      console.warn('Order not found for transaction:', webhookData.reference);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update payment status based on webhook
    if (webhookData.status === 'SUCCESS' || webhookData.status === 'APPROVED') {
      order.paymentStatus = 'Completed';
      order.status = 'Processing';
    } else if (
      webhookData.status === 'FAILED' ||
      webhookData.status === 'REJECTED'
    ) {
      order.paymentStatus = 'Failed';
      order.status = 'Cancelled';
    } else {
      order.paymentStatus = 'Pending';
    }

    // Update transaction ID if available
    if (webhookData.transactionId) {
      order.paymentDetails.transactionId = webhookData.transactionId;
    }

    await order.save();

    // Return success response to Airtel Money
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      orderStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
    });
  }
});

/**
 * Get payment status
 * GET /payments/status/:transactionId
 */
router.get('/status/:transactionId', isAuthenticated, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Get payment status from Airtel Money
    const paymentStatus = await airtelService.getPaymentStatus(transactionId);

    // Find associated order
    const order = await Order.findOne({
      'paymentDetails.transactionId': transactionId,
      user: req.session.userId,
    });

    res.json({
      success: true,
      payment: paymentStatus,
      order: order
        ? {
            _id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
          }
        : null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: error.message || 'Failed to check payment status',
    });
  }
});

/**
 * Check order payment status
 * GET /payments/order/:orderId
 */
router.get('/order/:orderId', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify authorization
    if (order.user._id.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        paymentDetails: {
          transactionId: order.paymentDetails?.transactionId,
          reference: order.paymentDetails?.reference,
          phoneNumber: order.paymentDetails?.phoneNumber,
        },
      },
    });
  } catch (error) {
    console.error('Order status check error:', error);
    res.status(500).json({
      error: 'Failed to check order status',
    });
  }
});

/**
 * Resend payment request
 * POST /payments/retry/:orderId
 */
router.post('/retry/:orderId', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const order = await Order.findById(orderId).populate('user');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user._id.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (order.paymentStatus === 'Completed') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Generate new merchant transaction ID
    const merchantTransactionId = airtelService.generateMerchantTransactionId();

    // Initiate new payment
    const paymentResponse = await airtelService.initiatePayment({
      phoneNumber,
      amount: order.totalAmount,
      orderId: order._id.toString(),
      merchantTransactionId,
      narration: `Retry Payment for Order #${order._id}`,
    });

    // Update order with new payment details
    order.paymentDetails = {
      merchantTransactionId,
      transactionId: paymentResponse.transactionId,
      reference: paymentResponse.reference,
      phoneNumber,
      amount: order.totalAmount,
      currency: 'UGX',
      timestamp: new Date(),
    };

    await order.save();

    res.json({
      success: true,
      transactionId: paymentResponse.transactionId,
      reference: paymentResponse.reference,
      authUrl: paymentResponse.authUrl,
      message: 'Payment request resent successfully',
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retry payment',
    });
  }
});

module.exports = router;
