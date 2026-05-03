require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

const MONGODB_URI = process.env.MONGODB_URI;

const defaultCategories = [
  { name: 'Electronics', description: 'Tech gadgets and electronic devices' },
  { name: 'Clothing', description: 'Apparel and fashion items' },
  { name: 'Books', description: 'Physical and digital books' },
  { name: 'Home & Kitchen', description: 'Home essentials and kitchen appliances' },
  { name: 'Sports', description: 'Sports equipment and fitness gear' },
  { name: 'Other', description: 'Miscellaneous items' },
];

async function seedCategories() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing categories
    const deletedCount = await Category.deleteMany({});
    console.log(`Cleared ${deletedCount.deletedCount} existing categories`);

    // Insert default categories
    await Category.insertMany(defaultCategories);
    console.log(`Successfully seeded ${defaultCategories.length} categories:`);
    defaultCategories.forEach(cat => console.log(`  - ${cat.name}`));
  } catch (err) {
    console.error('Error seeding categories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedCategories();
