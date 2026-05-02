require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Find all users
    const users = await User.find({});

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('\nRegistered Users:');
      users.forEach((user) => {
        console.log(`\nName: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Admin: ${user.isAdmin}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('------------------------');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listUsers();
