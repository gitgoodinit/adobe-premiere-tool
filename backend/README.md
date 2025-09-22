# Audio Tools Backend Service

Backend service for the Audio Tools Premiere Plugin, designed to handle large file processing with parallel chunking and real-time progress updates.

## Features

- **Parallel Processing**: Process up to 5 audio chunks simultaneously
- **Real-time Updates**: WebSocket-based progress tracking
- **Job Queue**: Bull queue with Redis for reliable job processing
- **Large File Support**: Handle files up to 10GB
- **OpenAI Integration**: Whisper API for audio transcription
- **FFmpeg Integration**: Audio extraction and conversion
- **Progress Persistence**: Resume interrupted processing

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
cp env.example .env
# Edit .env with your OpenAI API key and Redis configuration
```

### 3. Start Redis Server

```bash
# On macOS with Homebrew
brew install redis
brew services start redis

# On Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# On Windows
# Download and install Redis from https://redis.io/download
```

### 4. Start the Backend Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on:
- **HTTP API**: http://localhost:3001
- **WebSocket**: ws://localhost:3002
- **Health Check**: http://localhost:3001/health

## API Endpoints

### Upload and Process Audio

```bash
POST /process-audio
Content-Type: multipart/form-data

# Form data:
# - audioFile: The audio/video file to process
# - options: JSON string with processing options (optional)

# Response:
{
  "success": true,
  "jobId": "uuid-here",
  "message": "Audio processing job started",
  "websocketUrl": "ws://localhost:3002?jobId=uuid-here"
}
```

### Get Job Status

```bash
GET /job/:jobId/status

# Response:
{
  "jobId": "uuid-here",
  "state": "active",
  "progress": 45,
  "data": { ... },
  "result": null,
  "error": null
}
```

### Get Job Result

```bash
GET /job/:jobId/result

# Response:
{
  "success": true,
  "result": {
    "words": [...],
    "segments": [...],
    "silenceSegments": [...],
    "totalDuration": 3600,
    "totalChunks": 120,
    "successRate": 100
  }
}
```

### Cancel Job

```bash
DELETE /job/:jobId

# Response:
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

### List Active Jobs

```bash
GET /jobs

# Response:
{
  "jobs": [
    {
      "id": 1,
      "jobId": "uuid-here",
      "state": "active",
      "progress": 45,
      "data": { ... }
    }
  ]
}
```

## WebSocket Integration

Connect to the WebSocket server to receive real-time progress updates:

```javascript
const ws = new WebSocket('ws://localhost:3002?jobId=your-job-id');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'progress') {
    console.log(`Progress: ${data.progress}% - ${data.message}`);
  }
};
```

## Frontend Integration

Update your frontend to use the backend service for large files:

```javascript
// Check if file is large enough for backend processing
const shouldUseBackend = file.size > 50 * 1024 * 1024; // 50MB

if (shouldUseBackend) {
  // Use backend processing
  const formData = new FormData();
  formData.append('audioFile', file);
  formData.append('options', JSON.stringify(options));
  
  const response = await fetch('http://localhost:3001/process-audio', {
    method: 'POST',
    body: formData
  });
  
  const { jobId, websocketUrl } = await response.json();
  
  // Connect to WebSocket for progress updates
  const ws = new WebSocket(websocketUrl);
  // ... handle progress updates
} else {
  // Use frontend processing (existing implementation)
  // ... existing code
}
```

## Performance Optimizations

### Current Settings
- **Chunk Size**: 25MB (optimized for fewer API calls)
- **Concurrent Chunks**: 5 (increased from 3)
- **Rate Limiting**: 2 seconds between batches
- **Retry Logic**: 3 attempts per failed chunk

### Expected Performance
- **15.8GB File**: ~3 hours (down from 4.4 hours)
- **Success Rate**: 100% with graceful error handling
- **Memory Usage**: Optimized for large files
- **API Efficiency**: Intelligent rate limiting

## Configuration

### Environment Variables

```bash
# OpenAI API
OPENAI_API_KEY=your_api_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=development

# Processing
CHUNK_SIZE=26214400  # 25MB
MAX_CONCURRENT_CHUNKS=5
RATE_LIMIT_DELAY=2000
```

### Processing Options

```javascript
const options = {
  chunkSize: 25 * 1024 * 1024,        // 25MB chunks
  maxConcurrent: 5,                    // 5 concurrent chunks
  rateLimitDelay: 2000,                // 2s between batches
  silenceThreshold: 2.0,               // 2s silence detection
  audioFormat: 'wav',                  // Output format
  sampleRate: 16000,                   // Sample rate
  channels: 1                          // Mono audio
};
```

## Monitoring and Logs

### Health Check
```bash
curl http://localhost:3001/health
```

### View Active Jobs
```bash
curl http://localhost:3001/jobs
```

### Logs
The service logs all processing activities to the console. For production, consider using a logging service like Winston or Morgan.

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis is running: `redis-cli ping`
   - Check Redis configuration in `.env`

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and rate limits

3. **FFmpeg Errors**
   - Ensure FFmpeg is installed: `ffmpeg -version`
   - Check file format compatibility

4. **Memory Issues**
   - Reduce `MAX_CONCURRENT_CHUNKS` for large files
   - Increase system memory or use swap

### Performance Tuning

1. **For Very Large Files (>100GB)**
   - Increase `CHUNK_SIZE` to 50MB
   - Reduce `MAX_CONCURRENT_CHUNKS` to 3
   - Use SSD storage for temp files

2. **For Faster Processing**
   - Increase `MAX_CONCURRENT_CHUNKS` to 8
   - Reduce `RATE_LIMIT_DELAY` to 1000ms
   - Use faster Redis instance

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── server.js              # Main server file
├── services/
│   └── AudioProcessor.js  # Audio processing logic
├── uploads/               # Uploaded files
├── temp/                  # Temporary files
└── package.json
```

### Adding New Features

1. **New Processing Options**: Modify `AudioProcessor.js`
2. **New API Endpoints**: Add routes to `server.js`
3. **New WebSocket Events**: Update WebSocket handling
4. **New Job Types**: Add new Bull queue processors

## Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001 3002
CMD ["npm", "start"]
```

### Environment Setup
- Use Redis Cloud or AWS ElastiCache
- Set up proper logging and monitoring
- Configure reverse proxy (nginx)
- Set up SSL certificates
- Configure firewall rules

## License

MIT License - see LICENSE file for details.

