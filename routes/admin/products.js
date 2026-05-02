const express = require('express');
const router = express.Router();
const Product = require('../../models/product');
const { requireAdmin } = require('../../middleware/setUser');

// List all products
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Apply search filter
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // Apply category filter
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Get unique categories for the filter dropdown
    const categories = await Product.distinct('category');

    res.render('admin/products/index', {
      products,
      categories,
      search,
      selectedCategory: category,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    req.flash('error', 'Failed to load products');
    res.redirect('/admin/dashboard');
  }
});

// Show add product form
router.get('/add', requireAdmin, (req, res) => {
  res.render('admin/products/add', {
    product: {},
  });
});

// Create new product
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stockLevel,
      sku,
      status = 'draft',
      image,
    } = req.body;

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stockLevel: parseInt(stockLevel, 10),
      sku,
      status,
      image,
    });

    await product.save();
    req.flash('success', 'Product created successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error creating product:', err);
    req.flash('error', 'Failed to create product');
    res.redirect('/admin/products/add');
  }
});

// Show edit product form
router.get('/:id/edit', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }
    res.render('admin/products/edit', { product });
  } catch (err) {
    console.error('Error fetching product:', err);
    req.flash('error', 'Failed to load product');
    res.redirect('/admin/products');
  }
});

// Get product details as JSON
router.get('/:id/details', requireAdmin, async (req, res) => {
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

// Update product
router.post('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stockLevel,
      sku,
      status,
      image,
    } = req.body;

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      description,
      price: parseFloat(price),
      category,
      stockLevel: parseInt(stockLevel, 10),
      sku,
      status,
      image,
    });

    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error updating product:', err);
    req.flash('error', 'Failed to update product');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
});

// Update product status
router.post('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { status });
    req.flash('success', 'Product status updated');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error updating product status:', err);
    req.flash('error', 'Failed to update product status');
    res.redirect('/admin/products');
  }
});

// Delete product
router.post('/:id/delete', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error deleting product:', err);
    req.flash('error', 'Failed to delete product');
    res.redirect('/admin/products');
  }
});

module.exports = router;
