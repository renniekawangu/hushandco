const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const { isAuthenticated } = require('./auth');

// Search route - redirects to main products route
router.get('/search', (req, res) => {
  const searchQuery = req.query.query;
  res.redirect(`/products?search=${encodeURIComponent(searchQuery)}`);
});

// Get all products with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { category, sort, minPrice, maxPrice, search } = req.query;
    let query = {};

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price range filt
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortQuery = {};
    switch (sort) {
      case 'price-asc':
        sortQuery = { price: 1 };
        break;
      case 'price-desc':
        sortQuery = { price: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const products = await Product.find(query).sort(sortQuery);
    const categories = await Product.distinct('category');

    res.render('products', {
      products,
      categories,
      cart: req.session.cart || [],
      currentCategory: category || 'All',
      currentSort: sort || 'newest',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
      searchQuery: search || '',
      user: req.user,
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading products' });
  }
});

// Get product details as JSON
router.get('/:id/details', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Add to cart
router.post('/add-to-cart/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const cartItem = req.session.cart.find((item) => item.id === req.params.id);
    if (cartItem) {
      if (cartItem.quantity < product.stock) {
        cartItem.quantity += 1;
      }
    } else {
      if (product.stock > 0) {
        req.session.cart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        });
      }
    }

    res.redirect('/products');
  } catch (error) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
});

// Remove from cart
router.post('/remove-from-cart/:id', (req, res) => {
  req.session.cart = req.session.cart.filter(
    (item) => item.id !== req.params.id
  );
  res.redirect('/products');
});

// Checkout page
router.get('/checkout', (req, res) => {
  if (req.session.cart.length === 0) {
    return res.redirect('/products');
  }
  res.render('checkout', { cart: req.session.cart });
});

// Select payment method
router.get('/payment-method', isAuthenticated, (req, res) => {
  if (req.session.cart.length === 0) {
    return res.redirect('/products');
  }
  res.render('payment-method', { cart: req.session.cart });
});

// Place order with payment
router.post('/place-order', isAuthenticated, async (req, res) => {
  try {
    const { street, city, state, zipCode, country } = req.body;

    // Calculate total and create order items
    const orderItems = await Promise.all(
      req.session.cart.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        // Update product stock
        product.stock -= item.quantity;
        await product.save();

        return {
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        };
      })
    );

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const order = new Order({
      user: req.session.userId,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        street,
        city,
        state,
        zipCode,
        country,
      },
      paymentMethod: 'AirtelMoney',
    });

    await order.save();

    // Redirect to payment method selection
    res.redirect('/products/payment-method');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Process payment method selection
router.post('/process-payment', isAuthenticated, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res
        .status(400)
        .render('error', { error: 'Payment method is required' });
    }

    // Get the latest order for this user
    const order = await Order.findOne({ user: req.session.userId }).sort({
      createdAt: -1,
    });

    if (!order) {
      return res.status(404).render('error', { error: 'Order not found' });
    }

    // Update order payment method
    order.paymentMethod = paymentMethod;
    await order.save();

    // Route to appropriate payment handler
    if (paymentMethod === 'AirtelMoney') {
      res.render('payment', { order });
    } else if (paymentMethod === 'CreditCard') {
      res
        .status(501)
        .render('error', { error: 'Credit card payments coming soon' });
    } else if (paymentMethod === 'BankTransfer') {
      res
        .status(501)
        .render('error', { error: 'Bank transfer payments coming soon' });
    } else {
      res.status(400).render('error', { error: 'Invalid payment method' });
    }

    // Clear cart after order is placed
    req.session.cart = [];
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

module.exports = router;
