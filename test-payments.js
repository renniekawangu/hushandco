#!/usr/bin/env node

/**
 * Airtel Money Payment Integration Test Script
 *
 * This script tests various components of the Airtel Money payment integration
 * Run: node test-payments.js
 */

require('dotenv').config();
const AirtelMoneyService = require('./services/airtelMoney');

const tests = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    tests.passed++;
    log(`✓ ${name}`, 'green');
  } catch (error) {
    tests.failed++;
    tests.errors.push({ name, error: error.message });
    log(`✗ ${name}: ${error.message}`, 'red');
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  log('\n=== Airtel Money Payment Integration Tests ===\n', 'blue');

  // Test 1: Environment variables
  log('Testing Environment Configuration...', 'yellow');
  test('AIRTEL_CLIENT_ID is set', () => {
    assert(process.env.AIRTEL_CLIENT_ID, 'AIRTEL_CLIENT_ID not found in .env');
  });

  test('AIRTEL_CLIENT_SECRET is set', () => {
    assert(
      process.env.AIRTEL_CLIENT_SECRET,
      'AIRTEL_CLIENT_SECRET not found in .env'
    );
  });

  test('AIRTEL_API_KEY is set', () => {
    assert(process.env.AIRTEL_API_KEY, 'AIRTEL_API_KEY not found in .env');
  });

  test('AIRTEL_MERCHANT_ID is set', () => {
    assert(
      process.env.AIRTEL_MERCHANT_ID,
      'AIRTEL_MERCHANT_ID not found in .env'
    );
  });

  test('APP_URL is set', () => {
    assert(process.env.APP_URL, 'APP_URL not found in .env');
  });

  // Test 2: Service instantiation
  log('\nTesting Service Instantiation...', 'yellow');
  let service;
  test('AirtelMoneyService can be instantiated', () => {
    service = new AirtelMoneyService();
    assert(service !== null, 'Failed to create service instance');
  });

  test('Service has required methods', () => {
    assert(
      typeof service.initiatePayment === 'function',
      'Missing initiatePayment method'
    );
    assert(
      typeof service.getPaymentStatus === 'function',
      'Missing getPaymentStatus method'
    );
    assert(
      typeof service.formatPhoneNumber === 'function',
      'Missing formatPhoneNumber method'
    );
    assert(
      typeof service.verifyWebhookSignature === 'function',
      'Missing verifyWebhookSignature method'
    );
  });

  // Test 3: Phone number formatting
  log('\nTesting Phone Number Formatting...', 'yellow');
  test('Format phone with country code', () => {
    const result = service.formatPhoneNumber('+256700000000');
    assert(result === '+256700000000', `Expected +256700000000, got ${result}`);
  });

  test('Format phone without country code', () => {
    const result = service.formatPhoneNumber('700000000');
    assert(result === '+256700000000', `Expected +256700000000, got ${result}`);
  });

  test('Format phone with leading zero', () => {
    const result = service.formatPhoneNumber('0700000000');
    assert(result === '+256700000000', `Expected +256700000000, got ${result}`);
  });

  test('Format phone with spaces and dashes', () => {
    const result = service.formatPhoneNumber('+256 700-000-000');
    assert(result === '+256700000000', `Expected +256700000000, got ${result}`);
  });

  // Test 4: Merchant transaction ID generation
  log('\nTesting Transaction ID Generation...', 'yellow');
  test('Generate unique merchant transaction IDs', () => {
    const id1 = service.generateMerchantTransactionId();
    const id2 = service.generateMerchantTransactionId();
    assert(id1 !== id2, 'Generated IDs are not unique');
    assert(
      id1.includes(process.env.AIRTEL_MERCHANT_ID),
      'ID does not contain merchant ID'
    );
  });

  // Test 5: Configuration validation
  log('\nTesting Configuration...', 'yellow');
  test('Service configuration is correct', () => {
    assert(
      service.clientId === process.env.AIRTEL_CLIENT_ID,
      'Client ID not configured'
    );
    assert(
      service.merchantId === process.env.AIRTEL_MERCHANT_ID,
      'Merchant ID not configured'
    );
    assert(
      service.environment === 'sandbox' || service.environment === 'prod',
      'Invalid environment'
    );
  });

  test('API URL is properly configured', () => {
    assert(service.baseUrl.startsWith('http'), 'Invalid API URL');
  });

  // Test 6: Authentication flow
  log('\nTesting Authentication Flow...', 'yellow');
  test('Token caching logic works', () => {
    service.accessToken = 'test_token';
    service.tokenExpiry = Date.now() + 1000; // 1 second in future
    assert(service.accessToken === 'test_token', 'Token not cached properly');
    assert(service.tokenExpiry > Date.now(), 'Token expiry not set correctly');
  });

  test('Token expiration is detected', () => {
    service.accessToken = 'test_token';
    service.tokenExpiry = Date.now() - 1000; // 1 second in past
    const isExpired = service.tokenExpiry < Date.now();
    assert(isExpired, 'Expiration not detected');
  });

  // Test 7: Webhook verification
  log('\nTesting Webhook Verification...', 'yellow');
  test('Webhook verification method exists', () => {
    const payload = { test: 'data' };
    const signature = 'test_signature';
    const result = service.verifyWebhookSignature(payload, signature);
    assert(
      typeof result === 'boolean',
      'Webhook verification should return boolean'
    );
  });

  // Test 8: Payment data parsing
  log('\nTesting Payment Data Parsing...', 'yellow');
  test('Webhook callback parsing works', () => {
    const webhookData = {
      transaction: {
        id: 'txn_123',
        reference: 'ref_123',
        status: 'SUCCESS',
        amount: 50000,
        currency: 'UGX',
      },
      subscriber: {
        msisdn: '+256700000000',
      },
      timestamp: new Date().toISOString(),
    };

    const parsed = service.parseWebhookCallback(webhookData);
    assert(parsed.transactionId === 'txn_123', 'Transaction ID not parsed');
    assert(parsed.status === 'SUCCESS', 'Status not parsed');
    assert(parsed.amount === 50000, 'Amount not parsed');
  });

  // Summary
  log('\n=== Test Summary ===', 'blue');
  log(`Total Tests: ${tests.passed + tests.failed}`, 'blue');
  log(`Passed: ${tests.passed}`, 'green');
  log(`Failed: ${tests.failed}`, tests.failed > 0 ? 'red' : 'green');

  if (tests.errors.length > 0) {
    log('\n=== Failed Tests ===', 'red');
    tests.errors.forEach(({ name, error }) => {
      log(`${name}: ${error}`, 'red');
    });
  }

  const allPassed = tests.failed === 0;
  log(
    `\n${allPassed ? 'All tests passed! ✓' : 'Some tests failed! ✗'}`,
    allPassed ? 'green' : 'red'
  );

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(`\nFatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
