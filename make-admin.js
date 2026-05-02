require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

// Get email from command line argument
const userEmail = process.argv[2];

const port = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

if (!userEmail) {
  console.error('Please provide an email address:');
  console.error('Usage: node make-admin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: userEmail });

    if (user) {
      // Update existing user to admin
      user.isAdmin = true;
      await user.save();
      console.log('Successfully made user an admin:', user.email);
    } else {
      // Create new admin user
      const adminUser = new User({
        email: userEmail,
        password: 'admin123', // Will be hashed by the User model
        name: 'Admin User',
        isAdmin: true,
      });
      await adminUser.save();
      console.log('Created new admin user successfully!');
      console.log('Email:', userEmail);
      console.log('Password: admin123');
      console.log('Please change your password after first login');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

makeAdmin().catch(console.error);
