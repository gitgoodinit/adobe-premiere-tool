/**
 * Vercel Serverless Function Entry Point
 * Main API handler for Audio Tools Pro Backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import route modules
const silenceRoutes = require('../src/api/routes/silenceRoutes');
const overlapRoutes = require('../src/api/routes/overlapRoutes');
const multitrackRoutes = require('../src/api/routes/multitrackRoutes');
const rhythmRoutes = require('../src/api/routes/rhythmRoutes');
const settingsRoutes = require('../src/api/routes/settingsRoutes');
const healthRoutes = require('../src/api/routes/healthRoutes');

// Import middleware
const errorHandler = require('../src/middleware/errorHandler');
const requestLogger = require('../src/middleware/requestLogger');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://adobe-premiere-tool-1zkx.vercel.app',
    /\.vercel\.app$/,
    /\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/silence', silenceRoutes);
app.use('/api/overlap', overlapRoutes);
app.use('/api/multitrack', multitrackRoutes);
app.use('/api/rhythm', rhythmRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Audio Tools Pro API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      silence: '/api/silence',
      overlap: '/api/overlap',
      multitrack: '/api/multitrack',
      rhythm: '/api/rhythm',
      settings: '/api/settings'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/health',
      '/api/silence',
      '/api/overlap',
      '/api/multitrack',
      '/api/rhythm',
      '/api/settings'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// Export for Vercel
module.exports = app;
