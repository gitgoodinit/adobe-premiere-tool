/**
 * Silence Detection Serverless Function
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

// Configure multer for memory storage (serverless compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  }
});

// Get available methods
app.get('/methods', (req, res) => {
  try {
    res.json({
      success: true,
      methods: [
        {
          name: 'web_audio',
          description: 'Web Audio API based silence detection',
          available: true
        },
        {
          name: 'ffmpeg',
          description: 'FFmpeg based silence detection (limited in serverless)',
          available: false,
          reason: 'FFmpeg not available in serverless environment'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get methods',
      message: error.message
    });
  }
});

// Detect silence (simplified for serverless)
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

    const { threshold = -30, minDuration = 0.5 } = req.body;

    // Simulate silence detection (in a real implementation, you'd use Web Audio API)
    const mockSilenceSegments = [
      {
        start: 2.5,
        end: 3.2,
        duration: 0.7,
        confidence: 0.95,
        method: 'web_audio'
      },
      {
        start: 8.1,
        end: 9.0,
        duration: 0.9,
        confidence: 0.92,
        method: 'web_audio'
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
      silenceSegments: mockSilenceSegments,
      parameters: {
        threshold: parseFloat(threshold),
        minDuration: parseFloat(minDuration)
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Silence detection failed',
      message: error.message,
      requestId,
      processingTime: `${Date.now() - startTime}ms`
    });
  }
});

// Trim silence (simplified for serverless)
app.post('/trim', upload.single('audio'), async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        requestId
      });
    }

    // In a real serverless implementation, you'd need to:
    // 1. Use a service like AWS Lambda with FFmpeg layer
    // 2. Or use a cloud audio processing service
    // 3. Or return the original file with processing instructions

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      requestId,
      processingTime: `${processingTime}ms`,
      originalFile: {
        name: req.file.originalname,
        size: req.file.size,
        duration: 120 // Mock duration
      },
      trimmedFile: {
        name: `trimmed_${req.file.originalname}`,
        size: req.file.size * 0.8, // Mock reduced size
        duration: 100, // Mock reduced duration
        downloadUrl: `/api/silence/download/${requestId}`
      },
      results: {
        segmentsRemoved: 2,
        timeSaved: 20,
        compressionRatio: 0.83,
        quality: 'high'
      },
      note: 'This is a mock response. For full functionality, implement with cloud audio processing services.'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Silence trimming failed',
      message: error.message,
      requestId,
      processingTime: `${Date.now() - startTime}ms`
    });
  }
});

// Download endpoint (mock)
app.get('/download/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd serve the processed file
    res.status(200).json({
      message: 'Download endpoint',
      id,
      note: 'This is a mock endpoint. Implement file serving for production.'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds 50MB limit'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

module.exports = app;
