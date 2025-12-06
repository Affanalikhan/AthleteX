const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const { connectToDatabase, closeDatabase } = require('./config/database');
const { securityHeaders, corsOptions, sanitizeInput, apiLimiter } = require('./middleware/security');

// Import routes
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const trainersRouter = require('./routes/trainers');
const athletesRouter = require('./routes/athletes');
const assessmentsRouter = require('./routes/assessments');
const performanceRouter = require('./routes/performance');
const saiRouter = require('./routes/sai');
const sessionsRouter = require('./routes/sessions');
const socialRouter = require('./routes/social');
const paymentsRouter = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'athletex-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes (with rate limiting)
app.use('/api/', apiLimiter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/trainers', trainersRouter);
app.use('/api/athletes', athletesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/sai', saiRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/social', socialRouter);
app.use('/api/payments', paymentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 AthleteX API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Enabled`);
      console.log(`💳 Payments: Configured`);
      console.log(`🔑 JWT Auth: Enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
