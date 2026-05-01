# Airtel Money Payments - Quick Start Checklist

## Pre-Implementation Setup

- [ ] Have Node.js >= 18 installed
- [ ] Have npm installed
- [ ] Have MongoDB running/configured
- [ ] Have existing e-commerce store running

## Installation Steps

### Step 1: Install Dependencies
```bash
npm install
npm install axios
```
- [ ] axios successfully installed
- [ ] No installation errors

### Step 2: Get Airtel Money Credentials
- [ ] Create account at https://developer.airtel.africa
- [ ] Create new application
- [ ] Obtain:
  - [ ] Client ID
  - [ ] Client Secret
  - [ ] API Key
  - [ ] Merchant ID

### Step 3: Configure Environment Variables
```bash
cp .env.airtel.example .env
```

Edit `.env` file:
- [ ] Set AIRTEL_CLIENT_ID
- [ ] Set AIRTEL_CLIENT_SECRET
- [ ] Set AIRTEL_API_KEY
- [ ] Set AIRTEL_MERCHANT_ID
- [ ] Set AIRTEL_API_URL (for sandbox: https://sandbox-api.airtel.africa)
- [ ] Set APP_URL (http://localhost:3000 for local testing)
- [ ] Set NODE_ENV=sandbox (for testing)

### Step 4: Verify Configuration
```bash
node test-payments.js
```
- [ ] All tests pass
- [ ] No configuration errors
- [ ] Service initializes successfully

## Testing in Sandbox

### Step 5: Start Your Server
```bash
npm start
# or for development
npm run dev
```
- [ ] Server starts without errors
- [ ] Server accessible at http://localhost:3000
- [ ] No console errors

### Step 6: Test Payment Flow
1. Go to http://localhost:3000/products
   - [ ] Products page loads
   - [ ] Cart functionality works

2. Add items to cart
   - [ ] Items add to cart successfully
   - [ ] Cart total updates

3. Go to checkout
   - [ ] Checkout page displays
   - [ ] Cart items visible
   - [ ] Order summary correct

4. Enter shipping info
   - [ ] Form validates input
   - [ ] Proceed button available

5. Select payment method
   - [ ] Payment method page loads
   - [ ] Airtel Money option available
   - [ ] Order summary shows

6. Enter Airtel Money details
   - [ ] Phone number form appears
   - [ ] Placeholder shows format hints

7. Test with sandbox phone
   - [ ] Request sends to Airtel Money
   - [ ] Response received successfully
   - [ ] Status page shows transaction details

### Step 7: Verify Webhook
- [ ] Webhook endpoint accessible at /payments/callback
- [ ] Test webhook payload sent from Airtel Money
- [ ] Order status updates in database
- [ ] No console errors

## Production Deployment Checklist

### Before Going Live

- [ ] Update NODE_ENV to "production" in .env
- [ ] Obtain production Airtel Money credentials
- [ ] Update AIRTEL_API_URL to production endpoint
- [ ] Set APP_URL to your production domain
- [ ] Enable HTTPS on all endpoints
- [ ] Configure production webhook URL in Airtel dashboard
- [ ] Set up proper error logging
- [ ] Test complete flow end-to-end
- [ ] Set up monitoring and alerts
- [ ] Document support procedures

### Security Checks

- [ ] Never commit .env file to version control
- [ ] All API endpoints use HTTPS
- [ ] Webhook signature verification enabled
- [ ] User authentication checks in place
- [ ] Order ownership validation working
- [ ] Rate limiting configured
- [ ] Error messages don't expose sensitive data
- [ ] Database credentials secure

### Monitoring Setup

- [ ] Payment success rate tracking
- [ ] Failed payment alerts
- [ ] Webhook delivery monitoring
- [ ] API error rate tracking
- [ ] Database backup configured
- [ ] Log aggregation setup
- [ ] Customer support contact methods established

## Documentation Review

- [ ] Read AIRTEL_PAYMENTS_GUIDE.md
- [ ] Read PAYMENTS_MODULE_README.md
- [ ] Review IMPLEMENTATION_SUMMARY.md
- [ ] Understand payment flow
- [ ] Know error handling procedures
- [ ] Understand webhook security

## Code Review

- [ ] Review services/airtelMoney.js
- [ ] Review routes/payments.js
- [ ] Review views/payment.ejs and payment-method.ejs
- [ ] Review models/order.js changes
- [ ] Review app.js integration
- [ ] Understand error handling

## Testing Coverage

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Sandbox payment flow works
- [ ] Error scenarios tested
- [ ] Phone number formatting correct
- [ ] Webhook signature verification working
- [ ] Order status updates correctly
- [ ] Retry payment mechanism works

## Deployment

### Development Deployment
```bash
npm run dev
```
- [ ] Application runs
- [ ] Payment flow works
- [ ] No console errors

### Production Deployment
```bash
NODE_ENV=production npm start
```
- [ ] Application starts
- [ ] HTTPS enabled
- [ ] Webhooks received
- [ ] Orders processed

## Post-Deployment

- [ ] Monitor payment transactions
- [ ] Check webhook delivery
- [ ] Review error logs
- [ ] Verify customer satisfaction
- [ ] Track payment success rate
- [ ] Monitor system performance
- [ ] Test failed payment recovery
- [ ] Verify refund process (if implemented)

## Troubleshooting Guide

If encountering issues:

1. **Payment initiation fails**
   - [ ] Check AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET
   - [ ] Verify API URL is correct
   - [ ] Ensure network connectivity
   - [ ] Check API rate limits

2. **Phone number format errors**
   - [ ] Test with different phone formats
   - [ ] Verify country code handling
   - [ ] Check formatting function output

3. **Webhook not received**
   - [ ] Verify webhook URL is accessible
   - [ ] Check firewall/network settings
   - [ ] Verify webhook configuration in Airtel dashboard
   - [ ] Check server logs for incoming requests

4. **Order status not updating**
   - [ ] Check webhook processing logs
   - [ ] Verify database connection
   - [ ] Check for console errors
   - [ ] Test manual status check endpoint

5. **Authentication errors**
   - [ ] Clear token cache (restart server)
   - [ ] Verify credentials again
   - [ ] Check token expiration logic
   - [ ] Test with new credentials

## Support Resources

- Documentation: See AIRTEL_PAYMENTS_GUIDE.md
- Quick Reference: See PAYMENTS_MODULE_README.md
- Implementation Details: See IMPLEMENTATION_SUMMARY.md
- Service Code: See services/airtelMoney.js
- Route Handlers: See routes/payments.js
- Test Script: Run test-payments.js

## Getting Help

1. **Configuration Issues:**
   - Verify all environment variables
   - Run test-payments.js
   - Check .env file format

2. **Payment Flow Issues:**
   - Review AIRTEL_PAYMENTS_GUIDE.md
   - Check server logs
   - Test with sandbox first

3. **Integration Issues:**
   - Read PAYMENTS_MODULE_README.md
   - Review code comments
   - Check console for errors

## Success Indicators

✅ You know your implementation is working when:

- [ ] test-payments.js passes all tests
- [ ] Payment method page displays correctly
- [ ] Phone number accepts input in various formats
- [ ] Payment request reaches Airtel Money
- [ ] Webhook payload received and processed
- [ ] Order status updates to "Processing" after payment
- [ ] Payment status updates to "Completed"
- [ ] Failed payments can be retried
- [ ] Customer can see payment details in order
- [ ] No console errors during payment flow

## Timeline Estimate

- **Configuration:** 15-30 minutes
- **Testing:** 30-60 minutes
- **Debugging:** Variable (usually < 60 minutes)
- **Sandbox Verification:** 15-30 minutes
- **Production Deployment:** 30-60 minutes

**Total Estimated Time: 2-4 hours**

---

**You're all set! Follow this checklist to successfully integrate Airtel Money payments into your store.** 🚀
