// One-time migration script to update INVESTIGATING status to OPEN
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pulseboard';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const result = await db.collection('incidents').updateMany(
      { status: 'INVESTIGATING' },
      { $set: { status: 'OPEN' } }
    );

    console.log(`Migration complete: ${result.modifiedCount} incidents updated from INVESTIGATING to OPEN`);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
