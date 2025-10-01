# 🎵 Audio Tools Pro Backend

A comprehensive REST API backend for Adobe Premiere Pro audio processing plugins, providing advanced audio analysis, silence detection, overlap detection, multi-track handling, and rhythm correction capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- FFmpeg (optional, for advanced audio processing)

### Installation

1. **Clone and navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Test the API:**
```bash
curl http://localhost:3000/api/health
```

## 📚 API Documentation

- **Interactive Docs:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/health`
- **Detailed Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🎯 Features

### ✅ Implemented Features

#### 🔇 Silence Detection
- **Multi-method detection:** FFmpeg + Web Audio API + AI transcription
- **Configurable thresholds:** Noise level, minimum duration
- **AI-powered analysis:** OpenAI Whisper integration
- **Batch processing:** Multiple files simultaneously
- **Real-time preview:** Live analysis results

#### 🎵 Audio Overlap Detection
- **Frequency-domain analysis:** FFT-based overlap detection
- **Cross-correlation:** Time-domain correlation analysis
- **Machine learning validation:** AI-powered overlap confirmation
- **Multiple resolution methods:** Auto, shift, duck, trim
- **Background noise detection:** Enhanced overlap identification

#### 🎛️ Multi-Track Audio Handling
- **Up to 6 tracks:** Professional multi-track support
- **Submix routing:** Main, speech, music, effects groups
- **Dynamic ducking:** Automatic volume adjustment
- **Multi-camera sync:** Audio-level alignment
- **Real-time processing:** AudioWorklet integration

#### 🎼 Rhythm & Timing Correction
- **Phase vocoder:** High-quality time stretching
- **GPT-4 analysis:** Conversational flow analysis
- **Precise timing:** Sample-accurate adjustments (±300ms)
- **Multiple algorithms:** Phase vocoder, granular, WSOLA
- **Preview mode:** Test corrections before applying

#### ⚙️ Settings & Configuration
- **Persistent storage:** CEP SharedData integration
- **API management:** OpenAI and Google Cloud configuration
- **Export/Import:** Settings backup and restore
- **Real-time validation:** Configuration validation
- **Backup system:** Automatic settings backup

## 🛠️ API Endpoints

### Health & Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check
- `GET /api/health/metrics` - System metrics

### Silence Detection
- `POST /api/silence/detect` - Detect silence in audio
- `POST /api/silence/trim` - Trim silence from audio
- `GET /api/silence/methods` - Get detection methods
- `POST /api/silence/batch` - Batch silence detection
- `GET /api/silence/status/:id` - Get job status

### Audio Overlap Detection
- `POST /api/overlap/detect` - Detect audio overlaps
- `POST /api/overlap/resolve` - Resolve detected overlaps
- `GET /api/overlap/algorithms` - Get detection algorithms
- `POST /api/overlap/analyze-frequency` - Frequency analysis
- `POST /api/overlap/cross-correlation` - Cross-correlation analysis
- `GET /api/overlap/status/:id` - Get job status

### Multi-Track Audio Handling
- `POST /api/multitrack/analyze` - Analyze multiple tracks
- `POST /api/multitrack/sync` - Sync multiple tracks
- `POST /api/multitrack/ducking` - Configure dynamic ducking
- `POST /api/multitrack/submix` - Configure submix routing
- `GET /api/multitrack/capabilities` - Get capabilities
- `GET /api/multitrack/status/:id` - Get job status

### Rhythm & Timing Correction
- `POST /api/rhythm/analyze` - Analyze rhythm and timing
- `POST /api/rhythm/correct` - Apply timing corrections
- `POST /api/rhythm/generate-corrections` - Generate corrections
- `GET /api/rhythm/algorithms` - Get correction algorithms
- `POST /api/rhythm/preview` - Preview corrections
- `GET /api/rhythm/status/:id` - Get job status

### Settings & Configuration
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/export` - Export settings
- `POST /api/settings/import` - Import settings
- `POST /api/settings/reset` - Reset to defaults
- `GET /api/settings/validate` - Validate settings
- `GET /api/settings/schema` - Get settings schema
- `POST /api/settings/test-api` - Test API configuration
- `GET /api/settings/backups` - Get backups
- `POST /api/settings/restore/:id` - Restore backup

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

### Test Examples
```bash
# Test silence detection
curl -X POST http://localhost:3000/api/silence/detect \
  -F "audio=@test.wav" \
  -F "noiseThreshold=-25"

# Test overlap detection
curl -X POST http://localhost:3000/api/overlap/detect \
  -F "audio=@track1.wav" \
  -F "audio=@track2.wav" \
  -F "sensitivity=5"

# Test rhythm analysis
curl -X POST http://localhost:3000/api/rhythm/analyze \
  -F "audio=@speech.wav" \
  -F "enableGPTAnalysis=true"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `MAX_FILE_SIZE` | Max file size | `104857600` (100MB) |
| `FFMPEG_PATH` | FFmpeg executable path | Platform-specific |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud API key | Optional |

### FFmpeg Setup

#### macOS
```bash
brew install ffmpeg
```

#### Windows
```bash
# Download from https://ffmpeg.org/download.html
# Add to PATH or set FFMPEG_PATH in .env
```

#### Linux
```bash
sudo apt update
sudo apt install ffmpeg
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── routes/                   # API route handlers
│   ├── silence.js           # Silence detection routes
│   ├── overlap.js           # Overlap detection routes
│   ├── multitrack.js        # Multi-track routes
│   ├── rhythm.js            # Rhythm analysis routes
│   ├── settings.js          # Settings management routes
│   └── health.js            # Health check routes
├── middleware/              # Express middleware
│   ├── errorHandler.js      # Global error handling
│   ├── requestLogger.js     # Request logging
│   └── validation.js        # Request validation
├── services/                # Core services
│   ├── AudioProcessor.js    # Audio processing service
│   ├── Logger.js            # Logging service
│   └── ...                  # Other services
├── uploads/                 # File upload directory
├── temp/                    # Temporary files
├── cache/                   # Cache directory
├── logs/                    # Log files
└── docs/                    # Documentation
```

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Audio Processing:** FFmpeg, Web Audio API
- **AI Integration:** OpenAI Whisper, GPT-4
- **File Handling:** Multer
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate Limiting

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
# Build image
docker build -t audio-tools-backend .

# Run container
docker run -p 3000:3000 audio-tools-backend
```

## 📊 Monitoring

### Health Checks
- **Basic:** `GET /api/health`
- **Detailed:** `GET /api/health/detailed`
- **Metrics:** `GET /api/health/metrics`

### Logging
- **Console:** Real-time logs in development
- **Files:** Rotating log files in production
- **Levels:** error, warn, info, debug, verbose

### Performance
- **Request timing:** Automatic request duration logging
- **Memory usage:** Process memory monitoring
- **File cleanup:** Automatic temporary file cleanup

## 🔒 Security

### Implemented Security Features
- **Helmet:** Security headers
- **CORS:** Cross-origin resource sharing
- **Rate Limiting:** Request rate limiting
- **File Validation:** File type and size validation
- **Input Validation:** Request data validation
- **Error Handling:** Secure error responses

### Best Practices
- API keys stored in environment variables
- File uploads validated and sanitized
- Request size limits enforced
- Automatic cleanup of temporary files
- Comprehensive error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Common Issues

#### FFmpeg Not Found
```bash
# Check if FFmpeg is installed
ffmpeg -version

# Set FFMPEG_PATH in .env
FFMPEG_PATH=/path/to/ffmpeg
```

#### File Upload Errors
- Check file size limits
- Verify file format support
- Ensure upload directory exists

#### API Key Issues
- Verify API keys in .env
- Check API key permissions
- Test API connectivity

### Getting Help
- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review error logs in `logs/` directory
- Test with health check endpoint
- Verify environment configuration

## 🔄 Integration with Frontend

The backend is designed to work seamlessly with the existing Adobe Premiere Pro CEP plugin frontend. See the [API Documentation](./API_DOCUMENTATION.md) for detailed integration examples and frontend code samples.

### Key Integration Points
- **File Upload:** Multipart form data handling
- **Real-time Updates:** WebSocket support (future)
- **Progress Tracking:** Job status endpoints
- **Error Handling:** Consistent error responses
- **Settings Sync:** Configuration management

---

**Ready to process audio like a pro! 🎵**
