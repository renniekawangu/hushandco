# Hush Co

A full-featured e-commerce platform built with Node.js, Express, MongoDB, and EJS templating engine. Featuring integrated Airtel Money payments for seamless transactions.

## Features

- 🛍️ Product browsing with filtering and search
- 🛒 Shopping cart functionality
- 👤 User authentication and profile management
- 📦 Order processing and tracking
- 💳 Airtel Money integrated payment processing
- 🔑 Admin dashboard for product, order and user management
- 🎨 Responsive design
- 🔐 Secure checkout process

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm

## Installation

1. Clone the repository:

```bash
git clone https://github.com/renniekawangu/e-commerce-store
cd e-commerce-store
```

2. Install dependencies:

```bash
npm install
```

3. Make sure MongoDB is running on your system:

```bash
mongod --version  # Check MongoDB installation
```

4. Start the application:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── app.js                 # Application entry point
├── middleware/
│   └── setUser.js        # User authentication middleware
├── models/
│   ├── messages.js       # Messages model schema
│   ├── order.js          # Order model schema
│   ├── product.js        # Product model schema
│   └── user.js           # User model schema
├── public/
│   └── css/
│       ├── style.css            # Global styles
│       ├── admin-users.css      # styles to enhance admin/users page
│       └── admin-tables.css     # styles to enhance admin tables
├── routes/
│   ├── admin/
│   |   ├── products.js   # products routes
│   |   └── users.js      # users routes
│   ├── admin.js          # Admin dashboard routes
│   ├── contacts.js       # contact routes
│   ├── auth.js           # Authentication routes
│   ├── products.js       # Product and cart routes
│   └── profile.js        # User profile routes
└── views/
    ├── checkout.ejs      # Checkout page
    ├── confirmation.ejs  # Order confirmation
    ├── products.ejs      # Product listing
    ├── admin/
    │   ├── dashboard.ejs
    │   └── product-form.ejs
    ├── auth/
    │   ├── login.ejs
    │   └── signup.ejs
    ├── partials/
    │   ├── footer.ejs
    │   └── header.ejs
    └── profile/
        ├── profile.ejs
        └── settings.ejs
```

## Utility Scripts

- `make-admin.js` - Script to promote a user to admin status
- `add-sample-products.js` - Script to populate the database with sample products

## Development

To set up the development environment:

1. Install dependencies:

```bash
npm install
```

2. Create an admin user:

```bash
node make-admin.js <email>
```

3. Add sample products:

```bash
node add-sample-products.js
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Database

- `MONGODB_URI` - MongoDB connection string

### Authentication

- `SESSION_SECRET` - Secret for session management
- `JWT_SECRET` - Secret for JWT tokens (if implemented)

### Email (for future use)

- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### File Upload

- `UPLOAD_DIR` - Directory for file uploads
- `MAX_FILE_SIZE` - Maximum file size for uploads

### Security

- `BCRYPT_ROUNDS` - Number of bcrypt hashing rounds
- `CORS_ORIGIN` - Allowed CORS origin
- `RATE_LIMIT_WINDOW` - Rate limiting window in minutes
- `RATE_LIMIT_MAX` - Maximum requests per window

## Security Features

- Password hashing using bcrypt
- Session-based authentication
- CSRF protection
- XSS protection through EJS escaping
- Secure password validation
- Protected routes middleware

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Deployment on Render

1. Create a MongoDB database:
   - Sign up for a free MongoDB Atlas account at https://www.mongodb.com/atlas/database
   - Create a new cluster
   - Add your connection string to Render's environment variables as `MONGODB_URI`

2. Deploy on Render:
   - Sign up for a Render account at https://render.com
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Fill in the following details:
     - Name: `e-commerce-store` (or your preferred name)
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node app.js`
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `SESSION_SECRET`: A secure random string
     - `NODE_ENV`: `production`

3. After deployment:
   - Create an admin user using the provided script
   - Add sample products if needed
   - Your app is now live at your Render URL!

## License

ISC License# hushandco
