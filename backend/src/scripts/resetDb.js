require('dotenv').config();
const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the users collection
    console.log('🗑️ Dropping users collection...');
    await mongoose.connection.collection('users').drop();
    console.log('✅ Users collection dropped successfully');

    console.log('🔄 Creating new users collection...');
    await mongoose.connection.createCollection('users');
    console.log('✅ New users collection created');

    console.log('🎉 Database reset completed!');
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('ℹ️ Users collection did not exist. Creating new one...');
      await mongoose.connection.createCollection('users');
      console.log('✅ New users collection created');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
}

resetDatabase(); 