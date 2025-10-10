/**
 * Settings Serverless Function
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

// Get settings
app.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        silenceDetection: {
          defaultThreshold: -30,
          defaultMinDuration: 0.5,
          methods: ['web_audio']
        },
        overlapDetection: {
          defaultSensitivity: 5,
          frequencyRange: 'full',
          fftSize: 2048
        },
        processing: {
          maxFileSize: '50MB',
          supportedFormats: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'],
          timeout: 30000
        },
        environment: {
          platform: 'serverless',
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get settings',
      message: error.message
    });
  }
});

// Update settings (mock)
app.post('/', (req, res) => {
  try {
    const { settings } = req.body;
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

module.exports = app;
