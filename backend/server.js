require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const checkinRoutes = require('./routes/checkins');
const goalRoutes = require('./routes/goals');
const analyticsRoutes = require('./routes/analytics');
const predictionRoutes = require('./routes/predictions');

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// API Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ProgressIQ Node.js Backend',
    timestamp: new Date().toISOString(),
    ml_service_url: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictions', predictionRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server after DB connection
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[ProgressIQ Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
