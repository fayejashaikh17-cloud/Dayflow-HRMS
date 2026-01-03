const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow-hrms';
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('✗ Error connecting to MongoDB:', error.message);
    console.error('\nPlease ensure MongoDB is running:');
    console.error('  1. If using local MongoDB, start it with: mongod');
    console.error('  2. Or update MONGODB_URI in .env file to use MongoDB Atlas');
    console.error('  3. The server will continue but database operations will fail\n');
    
    // Don't exit - allow server to start but warn about database
    // This allows the frontend to load even if DB is not available
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = connectDB;

