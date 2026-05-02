# Airtel Money Payment Integration - Configuration Guide

This guide explains how to configure and use the Airtel Money Payments module in your e-commerce store.

## Overview

The Airtel Money Payments module provides seamless integration with Airtel Africa's Cash In API, enabling customers to pay for their orders using their Airtel Money accounts.

## Features

- **Secure Payment Processing**: Uses OAuth2 authentication with Airtel Money
- **Cash In API Integration**: Direct payment initiation and status tracking
- **Webhook Support**: Real-time payment status updates
- **Phone Number Validation**: Automatic formatting of phone numbers for different regions
- **Order Management**: Detailed payment tracking within order records
- **Error Handling**: Comprehensive error messages and retry mechanisms

## Environment Setup

### Required Environment Variables

Add the following variables to your `.env` file:

```env
# Airtel Money Configuration
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_API_KEY=your_api_key_here
AIRTEL_MERCHANT_ID=your_merchant_id_here
AIRTEL_API_URL=https://api.airtel.africa
APP_URL=http://localhost:3000  # or your production URL

# Node Environment
NODE_ENV=sandbox  # or production
```

### Obtaining Credentials

1. **Register with Airtel Money**:
   - Visit the [Airtel Money Developer Portal](https://developer.airtel.africa)
   - Sign up for a developer account

2. **Create an Application**:
   - Create a new application in your dashboard
   - Set up OAuth2 credentials
   - Configure your callback/webhook URL

3. **Get Your Credentials**:
   - Client ID
   - Client Secret
   - API Key
   - Merchant ID

4. **Configure Webhooks**:
   - Point your webhook endpoint to: `https://yourdomain.com/payments/callback`
   - Ensure the endpoint is publicly accessible

## API Integration

### Service File: `/services/airtelMoney.js`

The `AirtelMoneyService` class handles all Airtel Money API interactions:

#### Key Methods

1. **`getAccessToken()`**
   - Obtains OAuth2 access token
   - Caches token for 55 minutes
   - Automatically refreshes when expired

2. **`initiatePayment(paymentData)`**
   - Initiates a new payment request
   - Parameters:
     - `phoneNumber`: Customer's Airtel Money phone number
     - `amount`: Payment amount in UGX
     - `orderId`: Your order ID
     - `merchantTransactionId`: Unique transaction reference
     - `narration`: Payment description

3. **`getPaymentStatus(transactionId)`**
   - Checks payment status from Airtel Money
   - Returns transaction details

4. **`formatPhoneNumber(phoneNumber)`**
   - Converts various phone formats to +256XXXXXXXXX
   - Handles formats with/without country code and leading zeros

5. **`verifyWebhookSignature(payload, signature)`**
   - Verifies webhook authenticity using HMAC-SHA256

## Payment Flow

### 1. Checkout Process

```
Customer Cart → Shipping Info → Payment Method Selection → Airtel Money
```

### 2. Payment Initiation

- User selects Airtel Money as payment method
- Enters their Airtel Money phone number
- System sends payment request to Airtel Money API
- Customer receives payment prompt on their phone

### 3. Payment Confirmation

- Customer enters their Airtel Money PIN
- Airtel Money processes the payment
- Webhook notifies your system of payment status
- Order status is updated automatically

### 4. Order Fulfillment

- Upon successful payment, order moves to "Processing" status
- Payment status updated to "Completed"
- Order is available in customer's profile

## API Endpoints

### Payment Routes

#### 1. **Initiate Payment**

```
POST /payments/initiate
Content-Type: application/json

{
  "orderId": "order_id",
  "phoneNumber": "+256700000000"
}

Response:
{
  "success": true,
  "transactionId": "transaction_id",
  "reference": "merchant_ref",
  "authUrl": "redirect_url_to_airtel"
}
```

#### 2. **Webhook Callback**

```
POST /payments/callback
X-Airtel-Signature: signature_hash

Body: Airtel Money webhook payload
```

#### 3. **Check Payment Status**

```
GET /payments/status/:transactionId

Response:
{
  "success": true,
  "payment": {
    "transactionId": "txn_id",
    "status": "SUCCESS",
    "amount": 50000,
    "currency": "UGX"
  },
  "order": {
    "_id": "order_id",
    "status": "Processing",
    "paymentStatus": "Completed",
    "totalAmount": 50000
  }
}
```

#### 4. **Check Order Payment Status**

```
GET /payments/order/:orderId

Response:
{
  "success": true,
  "order": {
    "_id": "order_id",
    "status": "Processing",
    "paymentStatus": "Completed",
    "paymentMethod": "AirtelMoney",
    "totalAmount": 50000,
    "paymentDetails": {
      "transactionId": "txn_id",
      "reference": "merchant_ref",
      "phoneNumber": "+256700000000"
    }
  }
}
```

#### 5. **Retry Payment**

```
POST /payments/retry/:orderId
Content-Type: application/json

{
  "phoneNumber": "+256700000000"
}

Response:
{
  "success": true,
  "transactionId": "new_txn_id",
  "reference": "new_ref",
  "authUrl": "redirect_url"
}
```

## Database Schema Updates

### Order Model Extended

The Order model now includes payment details:

```javascript
{
  paymentMethod: {
    type: String,
    enum: ['AirtelMoney', 'CreditCard', 'BankTransfer'],
    default: 'AirtelMoney'
  },
  paymentDetails: {
    transactionId: String,
    merchantTransactionId: String,
    reference: String,
    phoneNumber: String,
    amount: Number,
    currency: String,
    timestamp: Date
  }
}
```

## Views

### 1. **Payment Method Selection** (`/views/payment-method.ejs`)

- Allows customers to choose payment method
- Currently enabled: Airtel Money
- Future options: Credit Card, Bank Transfer

### 2. **Airtel Money Payment** (`/views/payment.ejs`)

- Phone number input form
- Order summary display
- Payment status updates
- Retry functionality for failed payments
- Payment instructions

## Testing

### Sandbox Environment

For testing, set `NODE_ENV=sandbox` in your `.env` file. This uses Airtel's sandbox API.

### Test Phone Numbers

Contact Airtel Money developer support for test phone numbers and sandbox credentials.

### Testing Payment Flow

1. Go through checkout process
2. Select Airtel Money payment
3. Enter test phone number
4. Wait for prompt on test account
5. Complete payment with test PIN
6. Verify webhook is received and processed

## Error Handling

### Common Error Scenarios

| Error                                      | Cause                           | Solution                              |
| ------------------------------------------ | ------------------------------- | ------------------------------------- |
| `Failed to authenticate with Airtel Money` | Invalid credentials             | Verify API credentials in `.env`      |
| `Failed to initiate payment`               | Network or API issue            | Check API URL and internet connection |
| `Order not found`                          | Invalid order ID                | Verify order exists before payment    |
| `Unauthorized`                             | User doesn't own order          | Ensure correct user is authenticated  |
| `Invalid webhook signature`                | Webhook signature doesn't match | Verify webhook signing key            |

## Security Considerations

1. **Credentials**: Never commit `.env` file to version control
2. **HTTPS**: Always use HTTPS in production for webhook endpoints
3. **Webhook Verification**: Always verify webhook signatures
4. **Rate Limiting**: Implement rate limiting on payment endpoints
5. **PCI Compliance**: Phone numbers are stored but not PCI-regulated
6. **Error Logging**: Log payment errors but don't log sensitive data

## Webhook Setup

### Configuring Your Webhook

1. Get your public IP or domain name
2. Configure webhook URL in Airtel Money dashboard:
   - URL: `https://yourdomain.com/payments/callback`
   - Method: POST
   - Content-Type: application/json

3. Implement webhook receiver with signature verification

### Webhook Security

The webhook handler automatically:

- Verifies HMAC-SHA256 signature
- Logs invalid signatures
- Processes payload regardless (continues execution)
- Updates order status based on payment result

## Production Deployment

### Before Going Live

1. ✅ Update environment to `NODE_ENV=production`
2. ✅ Obtain production Airtel Money credentials
3. ✅ Configure production API URL
4. ✅ Set up HTTPS on all endpoints
5. ✅ Configure production webhook URL
6. ✅ Test complete payment flow end-to-end
7. ✅ Set up payment monitoring and alerts
8. ✅ Document payment support procedures

### Monitoring

- Log all payment transactions
- Monitor webhook delivery
- Track failed payments
- Set up alerts for API errors
- Monitor response times

## Future Enhancements

- [ ] Add credit card payment support
- [ ] Add bank transfer support
- [ ] Implement payment receipts/invoices
- [ ] Add SMS notifications for payment status
- [ ] Implement recurring payments
- [ ] Add multi-currency support
- [ ] Payment analytics dashboard

## Support

For issues or questions:

1. Check Airtel Money API documentation
2. Review logs for error messages
3. Verify webhook configuration
4. Test with sandbox environment first
5. Contact Airtel Money developer support

## References

- [Airtel Money Developer Portal](https://developer.airtel.africa)
- [Cash In API Documentation](https://developer.airtel.africa/docs)
- [OAuth2 Integration Guide](https://developer.airtel.africa/docs/oauth)
- [Webhook Documentation](https://developer.airtel.africa/docs/webhooks)
