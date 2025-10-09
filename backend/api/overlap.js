/**
 * Overlap Detection Serverless Function
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

app.use(express.json({ limit: '50mb' }));

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Detect overlaps
app.post('/detect', upload.single('audio'), async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        requestId
      });
    }

    // Mock overlap detection results
    const mockOverlaps = [
      {
        startTime: 5.2,
        endTime: 6.8,
        duration: 1.6,
        severity: 0.75,
        type: 'frequency_collision',
        confidence: 0.88,
        description: 'Frequency collision detected in mid-range',
        recommendation: 'Adjust EQ or reduce overlapping frequencies'
      },
      {
        startTime: 12.1,
        endTime: 13.5,
        duration: 1.4,
        severity: 0.65,
        type: 'background_noise',
        confidence: 0.82,
        description: 'Background noise interference',
        recommendation: 'Apply noise reduction or adjust levels'
      }
    ];

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      requestId,
      processingTime: `${processingTime}ms`,
      audioInfo: {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      overlaps: mockOverlaps,
      summary: {
        totalOverlaps: mockOverlaps.length,
        averageSeverity: mockOverlaps.reduce((sum, o) => sum + o.severity, 0) / mockOverlaps.length,
        totalDuration: mockOverlaps.reduce((sum, o) => sum + o.duration, 0)
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Overlap detection failed',
      message: error.message,
      requestId,
      processingTime: `${Date.now() - startTime}ms`
    });
  }
});

module.exports = app;
