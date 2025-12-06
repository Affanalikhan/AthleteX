const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectToDatabase, closeDatabase } = require('./config/database');
const usersRouter = require('./routes/users');
const trainersRouter = require('./routes/trainers');
const athletesRouter = require('./routes/athletes');
const assessmentsRouter = require('./routes/assessments');
const performanceRouter = require('./routes/performance');
const saiRouter = require('./routes/sai');
const sessionsRouter = require('./routes/sessions');
const socialRouter = require('./routes/social');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AthleteX API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/trainers', trainersRouter);
app.use('/api/athletes', athletesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/sai', saiRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/social', socialRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
