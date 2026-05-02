require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
// const { router: authRouter } = require('./routes/auth');
const productRouter = require('./routes/products');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/product');

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.log('Process will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('Process will continue running...');
});

const app = express();
const PORT = process.env.PORT || 3000;
// Use MongoDB URI from environment variable or fallback to local
const MONGODB_URI = process.env.MONGODB_URI;

// Trust proxy - required for secure cookies on Render
app.set('trust proxy', 1);

// Connect to MongoDB with updated options for MongoDB 4.0+
console.log('Attempting to connect to MongoDB...');
console.log(
  'MongoDB URI (redacted):',
  MONGODB_URI.replace(/\/\/[^@]+@/, '//<credentials>@')
);

const connectWithRetry = async (retryCount = 0) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Add these options for better stability
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
    });
    console.log('Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.name);
    console.log('Connection state:', mongoose.connection.readyState);
  } catch (err) {
    console.error('MongoDB connection error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      state: mongoose.connection.readyState,
      attempt: retryCount + 1,
    });

    if (retryCount < 3) {
      console.log(
        `Retrying connection in 5 seconds... (Attempt ${retryCount + 1}/3)`
      );
      setTimeout(() => connectWithRetry(retryCount + 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after 3 attempts');
      // Don't exit the process, let the application continue to run
      // so Render can see the logs and health endpoint can respond
    }
  }
};

connectWithRetry();

// Middleware
// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// Then parse requests and handle sessions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'your-super-secret-key-change-this-in-production',
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
    name: 'sessionId', // Change the cookie name from connect.sid
    proxy: true, // Always trust the proxy for Render
  })
);

// Debug middleware to log session and request info
app.use((req, res, next) => {
  console.log('Request Info:', {
    path: req.path,
    method: req.method,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    userId: req.session?.userId,
    headers: {
      host: req.headers.host,
      cookie: req.headers.cookie,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
    },
  });
  next();
});

// Flash messages middleware
app.use((req, res, next) => {
  req.flash = (type, message) => {
    if (!req.session.flash) req.session.flash = {};
    req.session.flash[type] = message;
  };
  res.locals.messages = req.session.flash || {};
  req.session.flash = {};
  next();
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize empty cart in session and set user
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// Set user middleware
const { setUser } = require('./middleware/setUser');
app.use(setUser);

// Routes
const productsRouter = require('./routes/products');
const paymentsRouter = require('./routes/payments');
const { router: authRouter, isAuthenticated } = require('./routes/auth');
const adminRouter = require('./routes/admin');
const profileRouter = require('./routes/profile');
const contactRouter = require('./routes/contact');

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/payments', paymentsRouter);
app.use('/admin', isAuthenticated, adminRouter);
app.use('/profile', isAuthenticated, profileRouter);
app.use('/contact', contactRouter);

// Public About page
app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/', async (req, res) => {
  try {
    const [featuredProducts, recentProducts, categories, totalProducts] =
      await Promise.all([
        Product.find({ featured: true }).sort({ createdAt: -1 }).limit(4),
        Product.find({}).sort({ createdAt: -1 }).limit(6),
        Product.distinct('category'),
        Product.countDocuments(),
      ]);

    res.render('home', {
      title: 'Home',
      featuredProducts,
      recentProducts,
      categories,
      totalProducts,
      cart: req.session.cart || [],
      user: req.user,
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('home', {
      title: 'Home',
      featuredProducts: [],
      recentProducts: [],
      categories: [],
      totalProducts: 0,
      cart: req.session.cart || [],
      user: req.user,
    });
  }
});

// Health check endpoint for platform probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Graceful shutdown for hosted environments
function shutdown() {
  console.log('Shutting down server...');
  mongoose.connection
    .close(false)
    .then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error closing MongoDB connection', err);
      process.exit(1);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Error handling middleware should be last
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Something went wrong! Please try again.' });
});

// Start the server with error handling
const server = app
  .listen(PORT, '0.0.0.0', () => {
    console.log(`E-commerce app listening at http://localhost:${PORT}`);
  })
  .on('error', (err) => {
    console.error('Server startup error:', err);
    // Don't exit, let the process continue
  });
