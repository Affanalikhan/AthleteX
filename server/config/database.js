const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'athletex';

let client;
let db;

async function connectToDatabase() {
  try {
    if (db) {
      return db;
    }

    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    db = client.db(dbName);
    
    // Create indexes for better performance
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes(database) {
  try {
    // Users collection indexes
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('users').createIndex({ role: 1 });
    
    // Trainers collection indexes
    await database.collection('trainers').createIndex({ email: 1 }, { unique: true });
    await database.collection('trainers').createIndex({ 'verification.status': 1 });
    await database.collection('trainers').createIndex({ 'sportsExpertise.primarySport': 1 });
    
    // Athletes collection indexes
    await database.collection('athletes').createIndex({ userId: 1 });
    await database.collection('athletes').createIndex({ email: 1 });
    
    // Assessments collection indexes
    await database.collection('assessments').createIndex({ userId: 1 });
    await database.collection('assessments').createIndex({ createdAt: -1 });
    
    // Sessions collection indexes
    await database.collection('sessions').createIndex({ trainerId: 1 });
    await database.collection('sessions').createIndex({ athleteId: 1 });
    await database.collection('sessions').createIndex({ scheduledDate: 1 });
    
    // KYC collection indexes
    await database.collection('kyc_verifications').createIndex({ trainerId: 1 });
    await database.collection('kyc_verifications').createIndex({ 'aadharCard.number': 1 });
    await database.collection('kyc_verifications').createIndex({ 'panCard.number': 1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('⚠️ Error creating indexes:', error.message);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabase,
};
