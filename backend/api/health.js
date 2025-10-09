/**
 * Health Check Serverless Function
 */

const express = require('express');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://adobe-premiere-tool-1zkx.vercel.app',
    /\.vercel\.app$/,
    /\.netlify\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      service: 'Audio Tools Pro API'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API info endpoint
app.get('/info', (req, res) => {
  try {
    res.json({
      name: 'Audio Tools Pro API',
      version: '1.0.0',
      description: 'Backend API for Adobe Premiere Pro Audio Plugin',
      endpoints: {
        health: '/api/health',
        silence: '/api/silence',
        overlap: '/api/overlap',
        multitrack: '/api/multitrack',
        rhythm: '/api/rhythm',
        settings: '/api/settings'
      },
      supportedFormats: {
        input: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'],
        output: ['mp3', 'wav', 'm4a']
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get API info',
      message: error.message
    });
  }
});

module.exports = app;
