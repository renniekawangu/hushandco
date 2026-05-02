const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const Message = require('../models/message');

// Import admin routes
const userRouter = require('./admin/users');
const productsRouter = require('./admin/products');

const { requireAdmin } = require('../middleware/setUser');

// Admin dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const {
      productSearch = '',
      productCategory = '',
      orderSearch = '',
      orderStatus = '',
    } = req.query;

    // Initialize flash messages
    res.locals.messages = {
      error: req.session.error,
      success: req.session.success,
    };
    req.session.error = null;
    req.session.success = null;

    // Build product query
    let productQuery = {};
    if (productSearch) {
      productQuery.$or = [
        { name: new RegExp(productSearch, 'i') },
        { description: new RegExp(productSearch, 'i') },
      ];
    }
    if (productCategory) {
      productQuery.category = productCategory;
    }

    // Build order query
    let orderQuery = {};
    if (orderSearch) {
      orderQuery.$or = [
        { _id: orderSearch.length === 24 ? orderSearch : null },
        { 'user.email': new RegExp(orderSearch, 'i') },
      ];
    }
    if (orderStatus) {
      orderQuery.status = orderStatus;
    }

    const products = await Product.find(productQuery).sort({ createdAt: -1 });
    const orders = await Order.find(orderQuery)
      .populate('user', 'email')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(orderSearch ? 50 : 10); // Show more results when searching

    // Recent contact messages for admin
    const messagesList = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(20);

    res.render('admin/dashboard', {
      products,
      orders,
      messagesList,
      productSearch,
      productCategory,
      orderSearch,
      orderStatus,
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading dashboard' });
  }
});

// Add product form
router.get('/products/add', requireAdmin, (req, res) => {
  res.render('admin/product-form', { product: null });
});

// Create new product
router.post('/products/add', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock, featured } =
      req.body;
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      stock: parseInt(stock),
      featured: featured === 'on',
    });
    await product.save();
    req.session.success = 'Product added successfully';
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error creating product:', error);
    req.session.error = 'Error creating product';
    res.redirect('/admin/products/add');
  }
});

// Edit product form
router.get('/products/edit/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).redirect('/admin/dashboard');
    }
    res.render('admin/product-form', { product });
  } catch (error) {
    res.status(500).render('error', { error: 'Error loading product' });
  }
});

// Update product
router.post('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock, featured } =
      req.body;
    await Product.findByIdAndUpdate(req.params.id, {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      stock: parseInt(stock),
      featured: featured === 'on',
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(500).render('error', { error: 'Error updating product' });
  }
});

// Delete product
router.post('/products/delete/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(500).render('error', { error: 'Error deleting product' });
  }
});

// Update order status
router.post('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(500).render('error', { error: 'Error updating order status' });
  }
});

// Get order details
router.get('/orders/:id/details', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order details' });
  }
});

// Delete order
router.post('/orders/delete/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/dashboard');
    }

    // Delete the order
    await Order.findByIdAndDelete(req.params.id);

    req.session.success = 'Order deleted successfully';
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting order:', error);
    req.session.error = 'Failed to delete order';
    res.redirect('/admin/dashboard');
  }
});

// Orders management page
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { _id: search.length === 24 ? search : null },
        { 'user.email': new RegExp(search, 'i') },
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'email')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(200);

    res.render('admin/orders', { orders, search });
  } catch (error) {
    console.error('Error loading orders list:', error);
    req.session.error = 'Error loading orders';
    res.redirect('/admin/dashboard');
  }
});

// Mount admin routes
router.use('/users', userRouter);
router.use('/products', productsRouter);

// Mark message as read
router.post('/messages/mark-read/:id', requireAdmin, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error marking message read:', error);
    req.session.error = 'Failed to mark message as read';
    res.redirect('/admin/dashboard');
  }
});

// List messages page
router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const { q: query = '' } = req.query;
    let filter = {};

    if (query) {
      filter.$or = [
        { subject: new RegExp(query, 'i') },
        { message: new RegExp(query, 'i') },
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
      ];
    }

    const messagesList = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    res.render('admin/messages', { messagesList, query });
  } catch (error) {
    console.error('Error loading messages list:', error);
    req.session.error = 'Error loading messages';
    res.redirect('/admin/dashboard');
  }
});

// View single message
router.get('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      req.session.error = 'Message not found';
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/message-view', { message });
  } catch (error) {
    console.error('Error loading message:', error);
    req.session.error = 'Error loading message';
    res.redirect('/admin/dashboard');
  }
});

// Delete message
router.post('/messages/delete/:id', requireAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    req.session.success = 'Message deleted';
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting message:', error);
    req.session.error = 'Failed to delete message';
    res.redirect('/admin/dashboard');
  }
});

// Debug: return messages as JSON (admin only) to verify storage
router.get('/messages/json', requireAdmin, async (req, res) => {
  try {
    const list = await Message.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ count: list.length, messages: list });
  } catch (err) {
    console.error('Error fetching messages JSON:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
