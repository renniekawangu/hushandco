# Airtel Money Payments Module - Architecture & Diagrams

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CUSTOMER (Browser)                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌───────────────┐        ┌───────────────┐
        │  Checkout UI  │        │  Payment UI   │
        │  (EJS Views)  │        │  (EJS Views)  │
        └───────┬───────┘        └───────┬───────┘
                │                        │
                └────────────┬───────────┘
                             │
              ┌──────────────▼──────────────┐
              │   Express.js Application    │
              │   ─────────────────────     │
              │   Routes:                   │
              │   • /products/place-order   │
              │   • /payments/initiate      │
              │   • /payments/callback      │
              │   • /payments/status        │
              └──────────────┬──────────────┘
                             │
        ┌────────────┬───────┴────────┬──────────────┐
        ▼            ▼                 ▼              ▼
    ┌────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────────┐
    │ Order  │  │ Payment │  │ Airtel Money │  │  MongoDB     │
    │ Model  │  │ Service │  │ API Client   │  │  Database    │
    │        │  │         │  │              │  │              │
    └────────┘  └────┬────┘  └──────┬───────┘  └──────────────┘
                     │              │
                     └──────┬───────┘
                            │
                   ┌────────▼───────┐
                   │   HTTP/REST    │
                   │   (axios)      │
                   └────────┬───────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Airtel Money API          │
              │   (OAuth2 + Cash In API)    │
              │                             │
              │   • Authentication          │
              │   • Payment Initiation      │
              │   • Status Tracking         │
              └──────────┬──────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                  ▼
┌──────────────────┐          ┌────────────────────────┐
│ Payment Prompt   │          │ Webhook Callback       │
│ On Customer      │          │ (POST /payments/       │
│ Phone            │          │  callback)             │
└──────────────────┘          └──────┬─────────────────┘
                                     │
                                     ▼
                            ┌────────────────┐
                            │ Process & Log  │
                            │ Update Status  │
                            └────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    Package Structure                            │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  services/airtelMoney.js                                        │
│  ├─ class AirtelMoneyService                                    │
│  ├─ getAccessToken()           ─→ OAuth2 Token                 │
│  ├─ initiatePayment()          ─→ Start Transaction            │
│  ├─ getPaymentStatus()         ─→ Check Status                 │
│  ├─ formatPhoneNumber()        ─→ Validate Phone              │
│  ├─ verifyWebhookSignature()   ─→ Security                    │
│  └─ parseWebhookCallback()     ─→ Parse Response              │
│                                                                  │
│  routes/payments.js                                             │
│  ├─ POST /payments/initiate         ─→ Start Payment           │
│  ├─ POST /payments/callback         ─→ Webhook Handler        │
│  ├─ GET /payments/status/:id        ─→ Check Status           │
│  ├─ GET /payments/order/:id         ─→ Order Details          │
│  └─ POST /payments/retry/:id        ─→ Retry Payment          │
│                                                                  │
│  routes/products.js (Updated)                                   │
│  ├─ POST /products/place-order           ─→ Create Order      │
│  ├─ GET /products/payment-method         ─→ Select Method     │
│  └─ POST /products/process-payment       ─→ Process Choice    │
│                                                                  │
│  models/order.js (Enhanced)                                     │
│  └─ paymentMethod, paymentDetails fields added                 │
│                                                                  │
│  views/                                                          │
│  ├─ payment-method.ejs         ─→ Method Selection UI         │
│  └─ payment.ejs                ─→ Payment Processing UI        │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## Payment State Machine

```
        ┌──────────────┐
        │   PENDING    │ (Initial State)
        └──────┬───────┘
               │
        ┌──────▼──────┐
        │  Initiate   │ User submits payment
        │  Payment    │
        └──────┬──────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
  ┌─────────┐      ┌──────────┐
  │ SUCCESS │      │  FAILED  │
  │         │      │          │
  │Complete │      │ Can Retry│
  │Process  │      │          │
  └────┬────┘      └──────┬───┘
       │                  │
       │       ┌──────────┘
       │       │
       ▼       ▼
    ┌──────────────────┐
    │ PROCESSING       │ Order moves to next stage
    │ (Order Status)   │
    └──────────────────┘
       │
       ▼
    ┌──────────────────┐
    │ SHIPPED          │
    │ (Delivery)       │
    └──────────────────┘
       │
       ▼
    ┌──────────────────┐
    │ DELIVERED        │
    │ (Completed)      │
    └──────────────────┘
```

## Authentication Flow

```
CLIENT REQUEST                    SERVER                    AIRTEL MONEY
     │                              │                             │
     │  1. Request Access Token      │                             │
     ├─────────────────────────────►│                             │
     │    (No previous token)        │                             │
     │                              │  2. OAuth2 Request          │
     │                              │    (Client ID/Secret)      │
     │                              ├────────────────────────────►│
     │                              │                             │
     │                              │◄────────────────────────────┤
     │                              │  3. Access Token            │
     │                              │    (55 min expiry)          │
     │                              │                             │
     │◄─────────────────────────────┤                             │
     │  Cached Token                │                             │
     │  (for next 55 minutes)        │                             │
     │                              │                             │
     │  4. API Request               │                             │
     │  (with token)                │                             │
     ├─────────────────────────────►│                             │
     │                              │  5. Initiate Payment        │
     │                              ├────────────────────────────►│
     │                              │                             │
     │                              │◄────────────────────────────┤
     │                              │  6. Response                │
     │◄─────────────────────────────┤                             │
     │  Payment Initiated            │                             │
     │                              │                             │
```

## Webhook Flow (Sequence Diagram)

```
AIRTEL MONEY         YOUR SERVER          DATABASE
     │                    │                   │
     │  Payment           │                   │
     │  Processed         │                   │
     │                    │                   │
     │  1. Webhook        │                   │
     │     Request        │                   │
     ├───────────────────►│                   │
     │  (signed payload)  │                   │
     │                    │                   │
     │                    │ 2. Verify         │
     │                    │    Signature      │
     │                    │    (HMAC-SHA256)  │
     │                    │                   │
     │                    │ 3. Parse          │
     │                    │    Payload        │
     │                    │                   │
     │                    │ 4. Find Order     │
     │                    ├──────────────────►│
     │                    │                   │
     │                    │◄──────────────────┤
     │                    │  Order Found      │
     │                    │                   │
     │                    │ 5. Update Status  │
     │                    ├──────────────────►│
     │                    │ (Payment Complete)│
     │                    │                   │
     │                    │◄──────────────────┤
     │                    │  Updated          │
     │                    │                   │
     │ 6. Webhook         │                   │
     │    Confirmation    │                   │
     │◄───────────────────┤                   │
     │                    │                   │
```

## Data Flow

```
┌─────────────────┐
│  Customer Form  │  Phone Number
└────────┬────────┘
         │
         ▼
   ┌────────────────────────┐
   │ Phone Validation &     │
   │ Formatting             │
   │ +256700000000          │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Create Request Body    │
   │ {                      │
   │   phoneNumber,         │
   │   amount,              │
   │   orderId,             │
   │   merchantTransactionId│
   │ }                      │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Get Access Token       │
   │ (cached/refreshed)     │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Send to Airtel API     │
   │ POST /openapi/v3/      │
   │   merchant/cashin/init │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Parse Response         │
   │ {                      │
   │   transactionId,       │
   │   reference,           │
   │   authUrl              │
   │ }                      │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Update Order           │
   │ paymentDetails: {      │
   │   transactionId,       │
   │   merchantTransactionId│
   │   reference            │
   │ }                      │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Return to Client       │
   │ authUrl, reference     │
   └────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────┐
│  Payment Request           │
└────────────┬───────────────┘
             │
      ┌──────▼──────┐
      │ Validate    │
      │ Input       │
      └──────┬──────┘
             │
    ┌────────┴─────────┐
    │ Invalid?         │
    ├────────────────┐ │
    │ Yes (Error 400)│ │
    │ ◄──────────────┘ │
    │                  │ No
    │                  ▼
    │           ┌─────────────┐
    │           │ Authenticate│
    │           │ with Airtel │
    │           └──────┬──────┘
    │                  │
    │           ┌──────┴──────┐
    │           │ Error?      │
    │           ├──────────┐  │
    │           │ Yes      │  │ No
    │           │ (Error   │  │
    │           │  500)    │  │
    │           │◄─────────┘  │
    │                         ▼
    │                  ┌──────────────┐
    │                  │ Initiate     │
    │                  │ Payment      │
    │                  └──────┬───────┘
    │                         │
    │                  ┌──────┴──────┐
    │                  │ Success?    │
    │                  ├──────────┐  │
    │                  │ No       │  │ Yes
    │                  │ (Error)  │  │
    │                  │◄─────────┘  │
    │                                ▼
    │                         ┌──────────────┐
    │                         │ Return to    │
    │                         │ Client       │
    │                         │ (Success 200)│
    │                         └──────────────┘
    │
    ├─► Log Error
    ├─► Return Error Message
    └─► Store Failed Attempt
```

## Database Schema Relationship

```
┌──────────────────────────────────────┐
│         User Collection              │
├──────────────────────────────────────┤
│ _id: ObjectId                        │
│ name: String                         │
│ email: String                        │
│ ...                                  │
└──────────────┬───────────────────────┘
               │ (references)
               │ (user: userId)
               │
┌──────────────▼───────────────────────────────────────────┐
│         Order Collection                                  │
├────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                              │
│ user: ObjectId (ref: User)                                │
│ items: [{                                                  │
│   product: ObjectId (ref: Product),                       │
│   quantity: Number,                                       │
│   price: Number                                           │
│ }]                                                         │
│ totalAmount: Number                                       │
│ shippingAddress: { street, city, state, zipCode, country}│
│ status: String (Pending/Processing/Shipped/Delivered)    │
│ paymentStatus: String (Pending/Completed/Failed)         │
│ paymentMethod: String (AirtelMoney)                      │
│ paymentDetails: {           ◄── NEW FIELDS              │
│   transactionId: String,                                  │
│   merchantTransactionId: String,                          │
│   reference: String,                                      │
│   phoneNumber: String,                                    │
│   amount: Number,                                         │
│   currency: String,                                       │
│   timestamp: Date                                         │
│ }                                                          │
│ createdAt: Date                                           │
└────────────────────────────────────────────────────────────┘
               │ (references)
               │ (product: productId)
               │
┌──────────────▼───────────────────────┐
│      Product Collection              │
├───────────────────────────────────────┤
│ _id: ObjectId                        │
│ name: String                         │
│ price: Number                        │
│ stock: Number                        │
│ ...                                  │
└────────────────────────────────────────┘
```

## Request/Response Flow Chart

```
CLIENT REQUEST
     │
     ├─ POST /payments/initiate
     │  Body: { orderId, phoneNumber }
     │
     ▼
SERVER PROCESSING
     ├─ Authenticate User
     ├─ Find Order
     ├─ Validate Order Ownership
     ├─ Generate Merchant Transaction ID
     ├─ Get Access Token from Airtel
     ├─ Call Airtel Money API
     │  POST /openapi/v3/merchant/cashin/init
     │
     ▼
AIRTEL MONEY RESPONSE
     ├─ transactionId
     ├─ reference
     ├─ authUrl
     │
     ▼
SERVER RESPONSE
     ├─ Update Order with Payment Details
     ├─ Return JSON Response
     │
     ▼
CLIENT RESPONSE
     {
       "success": true,
       "transactionId": "...",
       "reference": "...",
       "authUrl": "...",
       "message": "Payment initiated"
     }
```

## Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│                 Frontend Layer                            │
├──────────────────────────────────────────────────────────┤
│  HTML/CSS/JavaScript (EJS Templates)                     │
│  • payment-method.ejs                                    │
│  • payment.ejs                                           │
│  Mobile Responsive Design                               │
└──────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴─────────────────────────────────┐
│            Application Server Layer                      │
├──────────────────────────────────────────────────────────┤
│  Node.js + Express.js                                   │
│  • services/airtelMoney.js (Service Layer)              │
│  • routes/payments.js (Route Layer)                     │
│  • Middleware (Authentication, Authorization)           │
│  • Error Handling & Logging                             │
└──────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴─────────────────────────────────┐
│             Data Persistence Layer                       │
├──────────────────────────────────────────────────────────┤
│  MongoDB                                                 │
│  • Order Collection (with payment tracking)             │
│  • Product Collection                                    │
│  • User Collection                                       │
└──────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴─────────────────────────────────┐
│           External Payment Service Layer                 │
├──────────────────────────────────────────────────────────┤
│  Airtel Money API                                        │
│  • OAuth2 Authentication Service                        │
│  • Cash In API (Payment Initiation)                     │
│  • Payment Status API                                    │
│  • Webhook Service                                       │
└──────────────────────────────────────────────────────────┘
```

---

This documentation provides visual representation of the Airtel Money Payments module architecture and all key flows.
