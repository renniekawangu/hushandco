const express = require('express');
const router = express.Router();
const Category = require('../../models/category');
const { requireAdmin } = require('../../middleware/setUser');

// List all categories
router.get('/', requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.render('admin/categories/index', { categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    req.flash('error', 'Failed to load categories');
    res.redirect('/admin/dashboard');
  }
});

// Show add category form
router.get('/add', requireAdmin, (req, res) => {
  res.render('admin/categories/add', { category: {} });
});

// Create new category
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      req.flash('error', 'Category already exists');
      return res.redirect('/admin/categories/add');
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
    });

    await category.save();
    req.flash('success', 'Category created successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error creating category:', err);
    req.flash('error', 'Failed to create category');
    res.redirect('/admin/categories/add');
  }
});

// Show edit category form
router.get('/:id/edit', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }
    res.render('admin/categories/edit', { category });
  } catch (err) {
    console.error('Error fetching category:', err);
    req.flash('error', 'Failed to load category');
    res.redirect('/admin/categories');
  }
});

// Update category
router.post('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if new name already exists (excluding current category)
    const existing = await Category.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: `^${name}$`, $options: 'i' },
    });
    if (existing) {
      req.flash('error', 'Category name already exists');
      return res.redirect(`/admin/categories/${req.params.id}/edit`);
    }

    await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim(),
      },
      { new: true }
    );

    req.flash('success', 'Category updated successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error updating category:', err);
    req.flash('error', 'Failed to update category');
    res.redirect('/admin/categories');
  }
});

// Delete category
router.post('/:id/delete', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Category deleted successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error deleting category:', err);
    req.flash('error', 'Failed to delete category');
    res.redirect('/admin/categories');
  }
});

module.exports = router;
