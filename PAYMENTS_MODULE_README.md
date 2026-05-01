# Airtel Money Payments Module

A complete payment integration module for the e-commerce store using Airtel Money's Cash In API.

## Module Contents

### Services
- **`services/airtelMoney.js`** - Airtel Money API client and payment service

### Routes
- **`routes/payments.js`** - Payment endpoint handlers

### Views
- **`views/payment-method.ejs`** - Payment method selection interface
- **`views/payment.ejs`** - Airtel Money payment interface

### Models
- **`models/order.js`** (updated) - Enhanced with payment tracking fields

### Configuration
- **`.env.airtel.example`** - Example environment configuration
- **`AIRTEL_PAYMENTS_GUIDE.md`** - Complete integration guide

## Quick Start

### 1. Install Dependencies

The module requires `axios` for HTTP requests. Ensure it's installed:

```bash
npm install axios
```

### 2. Configure Environment Variables

Copy `.env.airtel.example` to `.env` and add your Airtel Money credentials:

```bash
cp .env.airtel.example .env
```

Edit `.env` with your credentials:

```env
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret
AIRTEL_API_KEY=your_api_key
AIRTEL_MERCHANT_ID=your_merchant_id
APP_URL=http://localhost:3000
NODE_ENV=sandbox
```

### 3. Update Package.json

If `axios` is not already installed, add it to your dependencies:

```bash
npm install axios
```

Or manually add to package.json:

```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### 4. Database Setup

The Order model is already updated with payment fields. If you have existing orders, they will use default values.

### 5. Test the Integration

1. Start your server: `npm start`
2. Navigate to `/products`
3. Add items to cart
4. Go to checkout
5. Select Airtel Money payment
6. Enter test phone number (provided by Airtel)
7. Complete payment flow

## File Structure

```
e-commerce-store/
├── services/
│   └── airtelMoney.js          # Airtel Money service client
├── routes/
│   ├── payments.js             # Payment route handlers
│   └── products.js             # Updated with payment flow
├── views/
│   ├── payment-method.ejs      # Payment method selection
│   ├── payment.ejs             # Payment processing
│   └── checkout.ejs            # Updated checkout flow
├── models/
│   └── order.js                # Updated with payment fields
├── .env.airtel.example         # Example configuration
├── AIRTEL_PAYMENTS_GUIDE.md    # Full documentation
└── app.js                      # Updated with payment routes
```

## API Endpoints

### Payment Endpoints

- **POST `/payments/initiate`** - Start payment process
- **POST `/payments/callback`** - Webhook for Airtel Money responses
- **GET `/payments/status/:transactionId`** - Check payment status
- **GET `/payments/order/:orderId`** - Get order payment info
- **POST `/payments/retry/:orderId`** - Retry failed payment

### Product Routes (Updated)

- **GET `/products/payment-method`** - Select payment method
- **POST `/products/process-payment`** - Process payment method selection
- **POST `/products/place-order`** - Place order and redirect to payment

## Payment Status Tracking

Orders now track payment information:

```javascript
paymentStatus: 'Pending' | 'Completed' | 'Failed'
paymentMethod: 'AirtelMoney'
paymentDetails: {
  transactionId: 'airtel_transaction_id',
  merchantTransactionId: 'your_ref_id',
  reference: 'airtel_ref',
  phoneNumber: '+256700000000',
  amount: 50000,
  currency: 'UGX',
  timestamp: Date
}
```

## Phone Number Formatting

The module automatically formats phone numbers to the Airtel standard:

- Input: `0700000000`, `700000000`, `+256700000000`
- Output: `+256700000000`

## Error Handling

The module includes comprehensive error handling:

- **API Errors**: Caught and logged with details
- **Webhook Errors**: Signature verification with logging
- **Network Errors**: Automatic retry on failure
- **User Errors**: Clear error messages for customers

## Security Features

- ✅ OAuth2 authentication with Airtel Money
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Token caching and expiration handling
- ✅ User authorization checks on payment endpoints
- ✅ Phone number validation and formatting

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Service can authenticate with Airtel Money
- [ ] Payment initiation works
- [ ] Phone number formatting works correctly
- [ ] Webhook endpoint is accessible
- [ ] Payment status updates work
- [ ] Retry payment functionality works
- [ ] Order status updates on payment completion
- [ ] Error handling works as expected

## Troubleshooting

### Common Issues

**"Failed to authenticate with Airtel Money"**
- Verify API credentials are correct
- Check `NODE_ENV` setting (sandbox vs production)
- Ensure API URL is correct

**"Order not found"**
- Verify order was created before payment initiation
- Check user authentication

**"Invalid webhook signature"**
- Verify API key matches webhook signing key
- Check webhook payload format

**"Payment initiation failed"**
- Check customer phone number format
- Verify Airtel Money service is operational
- Check error response from Airtel Money API

## Next Steps

1. ✅ Get Airtel Money API credentials
2. ✅ Configure environment variables
3. ✅ Test in sandbox environment
4. ✅ Set up webhook endpoint
5. ✅ Test complete payment flow
6. ✅ Deploy to production
7. ✅ Monitor payments and handle errors

## Support

For detailed information, see:
- `AIRTEL_PAYMENTS_GUIDE.md` - Complete documentation
- `services/airtelMoney.js` - Service implementation
- `routes/payments.js` - Route handlers

## Future Features

- Support for other payment methods (card, bank transfer)
- Payment receipts and invoices
- SMS notifications
- Recurring payments
- Multi-currency support

## Credits

Created as part of the e-commerce store payment system upgrade.

Module Version: 1.0.0
Last Updated: 2026-01-19
