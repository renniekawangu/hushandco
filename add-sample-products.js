require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

const sampleProducts = [
  {
    name: 'MacBook Pro',
    description: '16-inch, M2 Pro chip, 16GB RAM, 512GB SSD',
    price: 2499.99,
    category: 'Electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3',
    stock: 10,
    featured: true,
  },
  {
    name: 'iPhone 15 Pro',
    description: '256GB, Titanium, Pro Camera System',
    price: 1199.99,
    category: 'Electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?ixlib=rb-4.0.3',
    stock: 15,
    featured: true,
  },
  {
    name: 'Nike Air Max',
    description: 'Running shoes with premium cushioning',
    price: 129.99,
    category: 'Sports',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3',
    stock: 25,
    featured: false,
  },
  {
    name: 'The Art of Programming',
    description: 'Comprehensive guide to modern software development',
    price: 49.99,
    category: 'Books',
    imageUrl:
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3',
    stock: 30,
    featured: false,
  },
  {
    name: 'Smart LED TV',
    description: '65-inch 4K Ultra HD Smart TV with HDR',
    price: 899.99,
    category: 'Electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3',
    stock: 8,
    featured: true,
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe',
    price: 79.99,
    category: 'Home & Kitchen',
    imageUrl:
      'https://images.unsplash.com/photo-1517914082642-3c21c11c1a77?ixlib=rb-4.0.3',
    stock: 20,
    featured: false,
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip exercise yoga mat with carrying strap',
    price: 29.99,
    category: 'Sports',
    imageUrl:
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf9b2f?ixlib=rb-4.0.3',
    stock: 40,
    featured: false,
  },
  {
    name: 'Winter Jacket',
    description: 'Waterproof winter jacket with thermal lining',
    price: 159.99,
    category: 'Clothing',
    imageUrl:
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3',
    stock: 15,
    featured: false,
  },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    // Delete existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add new sample products
    await Product.insertMany(sampleProducts);
    console.log('Sample products added successfully!');
    console.log(`Added ${sampleProducts.length} products`);
  } catch (error) {
    console.error('Error adding sample products:', error);
  } finally {
    await mongoose.connection.close();
  }
});
