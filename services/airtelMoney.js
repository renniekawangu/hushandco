const axios = require('axios');

/**
 * Airtel Money Payment Service
 * Handles integration with Airtel Money Cash In API
 */

class AirtelMoneyService {
  constructor() {
    // Initialize with environment variables
    this.clientId = process.env.AIRTEL_CLIENT_ID;
    this.clientSecret = process.env.AIRTEL_CLIENT_SECRET;
    this.apiKey = process.env.AIRTEL_API_KEY;
    this.baseUrl = process.env.AIRTEL_API_URL || 'https://api.airtel.africa';
    this.merchantId = process.env.AIRTEL_MERCHANT_ID;
    this.environment =
      process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token from Airtel Money OAuth endpoint
   */
  async getAccessToken() {
    try {
      // Return cached token if still valid
      if (
        this.accessToken &&
        this.tokenExpiry &&
        Date.now() < this.tokenExpiry
      ) {
        return this.accessToken;
      }

      const authUrl = `${this.baseUrl}/oauth2/token`;

      const response = await axios.post(
        authUrl,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 55 minutes (assuming 1 hour token validity)
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      console.error(
        'Failed to get Airtel Money access token:',
        error.response?.data || error.message
      );
      throw new Error('Failed to authenticate with Airtel Money');
    }
  }

  /**
   * Initiate a payment request using Airtel Money Cash In API
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.phoneNumber - Customer phone number
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.orderId - Order ID for reference
   * @param {string} paymentData.merchantTransactionId - Unique transaction ID
   * @param {string} paymentData.narration - Payment description
   */
  async initiatePayment(paymentData) {
    try {
      const token = await this.getAccessToken();

      const paymentUrl = `${this.baseUrl}/openapi/v3/merchant/cashin/init`;

      const requestBody = {
        reference: paymentData.merchantTransactionId,
        subscriber: {
          country: 'UG', // Default to Uganda, can be made dynamic
          currency: 'UGX',
          msisdn: this.formatPhoneNumber(paymentData.phoneNumber),
        },
        transaction: {
          amount: paymentData.amount,
          currency: 'UGX',
          id: paymentData.merchantTransactionId,
        },
        merchant: {
          consumerKey: this.clientId,
          displayName: paymentData.narration || 'E-Commerce Store',
          redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payments/callback`,
        },
      };

      const response = await axios.post(paymentUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': paymentData.merchantTransactionId,
        },
      });

      return {
        success: true,
        transactionId: response.data.data?.transaction?.id,
        reference: response.data.data?.transaction?.reference,
        status: response.data.data?.transaction?.status,
        authUrl:
          response.data.data?.auth_url || response.data.data?.checkout_url,
        rawResponse: response.data,
      };
    } catch (error) {
      console.error(
        'Payment initiation failed:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message ||
          'Failed to initiate payment with Airtel Money'
      );
    }
  }

  /**
   * Get payment status from Airtel Money
   * @param {string} transactionId - Transaction ID to check
   */
  async getPaymentStatus(transactionId) {
    try {
      const token = await this.getAccessToken();

      const statusUrl = `${this.baseUrl}/openapi/v3/merchant/cashin/${transactionId}/status`;

      const response = await axios.get(statusUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        transactionId: response.data.data?.transaction?.id,
        status: response.data.data?.transaction?.status,
        amount: response.data.data?.transaction?.amount,
        currency: response.data.data?.transaction?.currency,
        reference: response.data.data?.transaction?.reference,
        rawResponse: response.data,
      };
    } catch (error) {
      console.error(
        'Failed to get payment status:',
        error.response?.data || error.message
      );
      throw new Error('Failed to retrieve payment status');
    }
  }

  /**
   * Format phone number to Airtel Money standard
   * Converts various formats to +256XXXXXXXXX
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // If it starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = '256' + cleaned.substring(1);
    }

    // If it doesn't have country code, add it
    if (!cleaned.startsWith('256')) {
      cleaned = '256' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Verify webhook signature from Airtel Money
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Signature header from Airtel Money
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const crypto = require('crypto');
      const message = JSON.stringify(payload);
      const hash = crypto
        .createHmac('sha256', this.apiKey)
        .update(message)
        .digest('base64');

      return hash === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Parse and validate webhook callback from Airtel Money
   */
  parseWebhookCallback(webhookData) {
    try {
      return {
        transactionId: webhookData.transaction?.id,
        reference: webhookData.transaction?.reference,
        status: webhookData.transaction?.status,
        amount: webhookData.transaction?.amount,
        currency: webhookData.transaction?.currency,
        timestamp: webhookData.timestamp,
        msisdn: webhookData.subscriber?.msisdn,
      };
    } catch (error) {
      console.error('Webhook parsing failed:', error.message);
      throw new Error('Invalid webhook payload');
    }
  }

  /**
   * Generate unique merchant transaction ID
   */
  generateMerchantTransactionId() {
    return `${this.merchantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AirtelMoneyService;
