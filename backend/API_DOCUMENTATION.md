# 🎵 Audio Tools Pro Backend API Documentation

## 📋 Overview

The Audio Tools Pro Backend API provides comprehensive audio processing capabilities for Adobe Premiere Pro plugins. This RESTful API supports silence detection, overlap analysis, multi-track handling, rhythm correction, and advanced audio processing.

**Base URL:** `http://localhost:3000/api`  
**Version:** 1.0.0  
**Content-Type:** `application/json`  
**File Upload:** `multipart/form-data`

---

## 🚀 Quick Start

### 1. Start the Server
```bash
cd backend
npm install
npm start
```

### 2. Test the API
```bash
curl http://localhost:3000/api/health
```

### 3. View Documentation
Visit: `http://localhost:3000/api/docs`

---

## 📚 API Endpoints

### 🏥 Health & Status

#### GET `/api/health`
Basic health check endpoint.

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "development",
    "responseTime": "2ms"
  }
}
```

#### GET `/api/health/detailed`
Detailed system health information.

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "system": {
      "platform": "darwin",
      "arch": "x64",
      "nodeVersion": "v18.17.0",
      "cpuCount": 8,
      "totalMemory": 17179869184,
      "freeMemory": 8589934592
    },
    "services": {
      "audioProcessor": { "status": "healthy", "available": true },
      "cacheService": { "status": "healthy", "available": true }
    }
  }
}
```

---

## 🔇 Silence Detection API

### POST `/api/silence/detect`
Detect silence segments in an audio file.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (file): Audio file to analyze
  - `methods` (array, optional): Detection methods `["ffmpeg", "webAudio", "transcript"]`
  - `noiseThreshold` (number, optional): Noise threshold in dB (default: -30)
  - `minDuration` (number, optional): Minimum silence duration in seconds (default: 0.5)
  - `confidenceThreshold` (number, optional): AI confidence threshold (default: 0.7)
  - `enableAI` (boolean, optional): Enable AI analysis (default: true)
  - `enablePreprocessing` (boolean, optional): Enable audio preprocessing (default: true)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/silence/detect \
  -F "audio=@sample.wav" \
  -F "methods=[\"ffmpeg\",\"webAudio\"]" \
  -F "noiseThreshold=-25" \
  -F "minDuration=0.3"
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_abc123",
  "processingTime": "2.5s",
  "audioFile": {
    "originalName": "sample.wav",
    "size": 1048576,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "detectionOptions": {
    "methods": ["ffmpeg", "webAudio"],
    "noiseThreshold": -25,
    "minDuration": 0.3
  },
  "results": {
    "silenceSegments": [
      {
        "start": 5.2,
        "end": 7.8,
        "duration": 2.6,
        "confidence": 0.95,
        "method": "ffmpeg"
      }
    ],
    "totalSilenceDuration": 12.4,
    "silencePercentage": 15.2,
    "confidence": 0.89
  },
  "metadata": {
    "audioDuration": 81.5,
    "sampleRate": 44100,
    "channels": 2,
    "bitDepth": 16
  }
}
```

### POST `/api/silence/trim`
Trim silence from an audio file.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (file): Audio file to process
  - `silenceSegments` (array): Array of silence segments to trim
  - `trimMode` (string, optional): `"remove"`, `"fade"`, or `"compress"` (default: "remove")
  - `fadeInDuration` (number, optional): Fade in duration in seconds (default: 0.1)
  - `fadeOutDuration` (number, optional): Fade out duration in seconds (default: 0.1)
  - `outputFormat` (string, optional): Output format `"mp3"`, `"wav"`, `"m4a"`, `"ogg"` (default: "mp3")
  - `quality` (string, optional): Quality level `"low"`, `"medium"`, `"high"` (default: "high")

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/silence/trim \
  -F "audio=@sample.wav" \
  -F "trimMode=remove" \
  -F "outputFormat=mp3" \
  -F "quality=high" \
  -F 'silenceSegments=[{"start":5.2,"end":7.8,"duration":2.6}]'
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_def456",
  "processingTime": "3.2s",
  "originalFile": {
    "name": "sample.wav",
    "size": 1048576,
    "duration": 81.5
  },
  "trimmedFile": {
    "name": "sample_trimmed.mp3",
    "size": 892160,
    "duration": 69.1,
    "downloadUrl": "/temp/sample_trimmed.mp3"
  },
  "results": {
    "segmentsRemoved": 1,
    "timeSaved": 2.6,
    "compressionRatio": 0.85,
    "quality": "high"
  }
}
```

### GET `/api/silence/methods`
Get available silence detection methods.

**Response:**
```json
{
  "success": true,
  "methods": [
    {
      "id": "ffmpeg",
      "name": "FFmpeg Silence Detection",
      "description": "High-accuracy silence detection using FFmpeg",
      "accuracy": "high",
      "speed": "fast",
      "requirements": ["ffmpeg"],
      "supportedFormats": ["mp3", "wav", "m4a", "ogg"]
    },
    {
      "id": "webAudio",
      "name": "Web Audio API Analysis",
      "description": "Real-time audio analysis using Web Audio API",
      "accuracy": "medium",
      "speed": "very_fast",
      "requirements": ["browser"],
      "supportedFormats": ["wav", "mp3"]
    }
  ]
}
```

### POST `/api/silence/batch`
Process multiple audio files for silence detection.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files (max 10)
  - `methods` (array, optional): Detection methods
  - `noiseThreshold` (number, optional): Noise threshold
  - `minDuration` (number, optional): Minimum silence duration
  - `parallel` (boolean, optional): Process files in parallel (default: true)

---

## 🎵 Audio Overlap Detection API

### POST `/api/overlap/detect`
Detect audio overlaps between multiple tracks.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files (2-10 files)
  - `sensitivity` (number, optional): Detection sensitivity 1-10 (default: 5)
  - `frequencyRange` (string, optional): `"full"`, `"speech"`, `"music"` (default: "full")
  - `fftSize` (number, optional): FFT window size (default: 2048)
  - `analysisMode` (string, optional): `"realtime"`, `"batch"`, `"hybrid"` (default: "hybrid")
  - `overlapThreshold` (number, optional): Overlap detection threshold (default: 0.3)
  - `enableML` (boolean, optional): Enable machine learning validation (default: true)
  - `enableCrossCorrelation` (boolean, optional): Enable cross-correlation analysis (default: true)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/overlap/detect \
  -F "audio=@track1.wav" \
  -F "audio=@track2.wav" \
  -F "sensitivity=7" \
  -F "frequencyRange=speech" \
  -F "enableML=true"
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_ghi789",
  "processingTime": "4.1s",
  "audioFiles": [
    {
      "originalName": "track1.wav",
      "size": 1048576,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "originalName": "track2.wav",
      "size": 1048576,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "results": {
    "overlaps": [
      {
        "start": 12.5,
        "end": 15.2,
        "duration": 2.7,
        "tracks": [0, 1],
        "severity": "medium",
        "confidence": 0.87,
        "type": "frequency_overlap"
      }
    ],
    "totalOverlaps": 3,
    "overlapDuration": 8.4,
    "severity": "medium",
    "confidence": 0.82
  },
  "analysis": {
    "frequencyAnalysis": {
      "dominantFrequencies": [440, 880, 1320],
      "spectralCentroid": 1200
    },
    "crossCorrelation": {
      "maxCorrelation": 0.75,
      "correlationPeaks": [12.5, 18.3, 25.1]
    }
  }
}
```

### POST `/api/overlap/resolve`
Resolve detected audio overlaps.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files
  - `resolutionMethod` (string, optional): `"auto"`, `"shift"`, `"duck"`, `"trim"` (default: "auto")
  - `overlaps` (array): Array of overlap segments to resolve
  - `shiftAmount` (number, optional): Time shift amount in seconds (default: 0.1)
  - `duckingRatio` (number, optional): Ducking ratio 0-1 (default: 0.3)
  - `outputFormat` (string, optional): Output format (default: "mp3")

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/overlap/resolve \
  -F "audio=@track1.wav" \
  -F "audio=@track2.wav" \
  -F "resolutionMethod=duck" \
  -F "duckingRatio=0.4" \
  -F 'overlaps=[{"start":12.5,"end":15.2,"duration":2.7,"tracks":[0,1]}]'
```

### GET `/api/overlap/algorithms`
Get available overlap detection algorithms.

**Response:**
```json
{
  "success": true,
  "algorithms": [
    {
      "id": "frequency_domain",
      "name": "Frequency Domain Analysis",
      "description": "FFT-based frequency analysis for overlap detection",
      "accuracy": "high",
      "speed": "medium",
      "parameters": {
        "fftSize": [512, 1024, 2048, 4096],
        "frequencyRange": ["full", "speech", "music"]
      }
    },
    {
      "id": "cross_correlation",
      "name": "Cross-Correlation Analysis",
      "description": "Time-domain cross-correlation for overlap detection",
      "accuracy": "medium",
      "speed": "fast",
      "parameters": {
        "windowSize": [512, 1024, 2048],
        "hopSize": [256, 512, 1024]
      }
    }
  ]
}
```

---

## 🎛️ Multi-Track Audio Handling API

### POST `/api/multitrack/analyze`
Analyze multiple audio tracks for silence, overlaps, and sync.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files (2-6 files)
  - `analysisTypes` (array, optional): `["silence", "overlap", "sync"]` (default: all)
  - `trackTypes` (array, optional): Track types `["speech", "music", "effects"]`
  - `submixRouting` (string, optional): `"auto"` or `"manual"` (default: "auto")
  - `silenceThreshold` (number, optional): Silence detection threshold (default: -30)
  - `overlapThreshold` (number, optional): Overlap detection threshold (default: 0.3)
  - `syncTolerance` (number, optional): Sync tolerance in seconds (default: 0.1)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/multitrack/analyze \
  -F "audio=@voice.wav" \
  -F "audio=@music.wav" \
  -F "audio=@effects.wav" \
  -F 'trackTypes=["speech","music","effects"]' \
  -F "submixRouting=auto"
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_jkl012",
  "processingTime": "5.8s",
  "audioTracks": [
    {
      "trackId": 0,
      "originalName": "voice.wav",
      "size": 1048576,
      "trackType": "speech"
    },
    {
      "trackId": 1,
      "originalName": "music.wav",
      "size": 2097152,
      "trackType": "music"
    },
    {
      "trackId": 2,
      "originalName": "effects.wav",
      "size": 524288,
      "trackType": "effects"
    }
  ],
  "results": {
    "tracksAnalyzed": 3,
    "silenceAnalysis": {
      "totalSilenceDuration": 15.2,
      "silenceSegments": 8
    },
    "overlapAnalysis": {
      "totalOverlaps": 2,
      "overlapDuration": 4.1
    },
    "syncAnalysis": {
      "syncIssues": 1,
      "averageOffset": 0.05
    },
    "submixRouting": {
      "main": {"tracks": [0, 1, 2], "gain": 1.0},
      "speech": {"tracks": [0], "gain": 1.2},
      "music": {"tracks": [1], "gain": 0.8},
      "effects": {"tracks": [2], "gain": 1.0}
    }
  }
}
```

### POST `/api/multitrack/sync`
Sync multiple audio tracks.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files
  - `syncMethod` (string, optional): `"auto"`, `"manual"`, `"cross-correlation"` (default: "auto")
  - `referenceTrack` (number, optional): Reference track index (default: 0)
  - `syncTolerance` (number, optional): Sync tolerance in seconds (default: 0.1)
  - `manualOffsets` (array, optional): Manual offset values for each track
  - `enableMultiCamSync` (boolean, optional): Enable multi-camera sync (default: false)

### POST `/api/multitrack/ducking`
Configure dynamic ducking for multiple tracks.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files
  - `primaryTrack` (number, optional): Primary track index (default: 0)
  - `secondaryTracks` (array, optional): Secondary track indices
  - `duckingRatio` (number, optional): Ducking ratio 0-1 (default: 0.3)
  - `attackTime` (number, optional): Attack time in seconds (default: 0.01)
  - `releaseTime` (number, optional): Release time in seconds (default: 0.1)
  - `threshold` (number, optional): Ducking threshold in dB (default: -20)

### POST `/api/multitrack/submix`
Configure submix routing for multiple tracks.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (files): Multiple audio files
  - `submixGroups` (object, optional): Submix group configuration
  - `trackAssignments` (array, optional): Track to submix assignments
  - `enableAutoRouting` (boolean, optional): Enable automatic routing (default: true)

### GET `/api/multitrack/capabilities`
Get multi-track processing capabilities.

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "maxTracks": 6,
    "supportedFormats": ["mp3", "wav", "m4a", "ogg"],
    "analysisTypes": ["silence", "overlap", "sync"],
    "syncMethods": ["auto", "manual", "cross-correlation"],
    "submixGroups": ["main", "speech", "music", "effects"],
    "duckingAlgorithms": ["dynamic", "static", "adaptive"],
    "realTimeProcessing": true,
    "audioWorkletSupport": true
  }
}
```

---

## 🎼 Rhythm & Timing Correction API

### POST `/api/rhythm/analyze`
Analyze rhythm and timing patterns in audio.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (file): Audio file to analyze
  - `analysisTypes` (array, optional): `["speech", "silence", "pacing", "flow"]` (default: all)
  - `timingTolerance` (number, optional): Timing tolerance in ms (default: 150)
  - `enableGPTAnalysis` (boolean, optional): Enable GPT-4 analysis (default: true)
  - `enableFlowAnalysis` (boolean, optional): Enable flow analysis (default: true)
  - `enablePreciseTiming` (boolean, optional): Enable precise timing (default: true)
  - `language` (string, optional): Language code (default: "en")
  - `confidenceThreshold` (number, optional): Confidence threshold (default: 0.7)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/rhythm/analyze \
  -F "audio=@speech.wav" \
  -F "analysisTypes=[\"speech\",\"pacing\"]" \
  -F "timingTolerance=100" \
  -F "enableGPTAnalysis=true" \
  -F "language=en"
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_mno345",
  "processingTime": "6.2s",
  "audioFile": {
    "originalName": "speech.wav",
    "size": 2097152,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "results": {
    "speechRegions": [
      {
        "start": 0.5,
        "end": 8.2,
        "duration": 7.7,
        "confidence": 0.95,
        "pacing": "normal"
      }
    ],
    "silenceRegions": [
      {
        "start": 8.2,
        "end": 10.5,
        "duration": 2.3,
        "confidence": 0.89,
        "type": "pause"
      }
    ],
    "pacingAnalysis": {
      "averagePace": 1.2,
      "paceVariation": 0.3,
      "rhythmConsistency": 0.85
    },
    "flowAnalysis": {
      "flowScore": 0.78,
      "flowIssues": 2,
      "recommendations": ["Reduce pause at 8.2s", "Improve pacing at 15.3s"]
    }
  },
  "analysis": {
    "totalDuration": 45.2,
    "speechDuration": 38.1,
    "silenceDuration": 7.1,
    "averagePace": 1.2,
    "flowScore": 0.78,
    "rhythmConsistency": 0.85,
    "confidence": 0.89
  },
  "gptAnalysis": {
    "conversationalFlow": "good",
    "timingIssues": ["Long pause at 8.2s", "Rushed delivery at 15.3s"],
    "recommendations": ["Consider shortening the pause", "Add emphasis at key points"]
  }
}
```

### POST `/api/rhythm/correct`
Apply timing corrections to audio.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (file): Audio file to process
  - `corrections` (array): Array of timing corrections
  - `stretchAlgorithm` (string, optional): `"phase_vocoder"`, `"granular"`, `"wsola"` (default: "phase_vocoder")
  - `timingTolerance` (number, optional): Timing tolerance in ms (default: 150)
  - `enablePreciseTiming` (boolean, optional): Enable precise timing (default: true)
  - `enableValidation` (boolean, optional): Enable validation (default: true)
  - `outputFormat` (string, optional): Output format (default: "mp3")
  - `quality` (string, optional): Quality level (default: "high")

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/rhythm/correct \
  -F "audio=@speech.wav" \
  -F "stretchAlgorithm=phase_vocoder" \
  -F "quality=high" \
  -F 'corrections=[{"type":"long_pause","timestamp":8.2,"originalDuration":2.3,"suggestedDuration":1.0,"confidence":0.9,"apply":true}]'
```

### POST `/api/rhythm/generate-corrections`
Generate timing corrections from analysis results.

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  - `analysisResults` (object): Analysis results from rhythm analysis
  - `correctionTypes` (array, optional): Types of corrections to generate
  - `timingTolerance` (number, optional): Timing tolerance in ms
  - `enableGPTAnalysis` (boolean, optional): Enable GPT analysis
  - `confidenceThreshold` (number, optional): Confidence threshold
  - `maxCorrections` (number, optional): Maximum number of corrections (default: 50)

### GET `/api/rhythm/algorithms`
Get available timing correction algorithms.

**Response:**
```json
{
  "success": true,
  "algorithms": [
    {
      "id": "phase_vocoder",
      "name": "Phase Vocoder",
      "description": "High-quality time stretching without pitch change",
      "quality": "high",
      "speed": "medium",
      "pitchPreservation": "excellent",
      "artifacts": "minimal",
      "useCases": ["speech", "music", "general"],
      "parameters": {
        "windowSize": [1024, 2048, 4096],
        "hopSize": [256, 512, 1024]
      }
    },
    {
      "id": "granular",
      "name": "Granular Synthesis",
      "description": "Fast time stretching with good quality",
      "quality": "medium",
      "speed": "fast",
      "pitchPreservation": "good",
      "artifacts": "low",
      "useCases": ["real-time", "batch processing"],
      "parameters": {
        "grainSize": [64, 128, 256],
        "overlap": [0.5, 0.75, 0.9]
      }
    }
  ]
}
```

### POST `/api/rhythm/preview`
Preview timing corrections without applying them.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `audio` (file): Audio file to process
  - `corrections` (array): Array of timing corrections
  - `stretchAlgorithm` (string, optional): Stretch algorithm
  - `previewDuration` (number, optional): Preview duration in seconds (default: 30)
  - `previewStartTime` (number, optional): Preview start time in seconds (default: 0)

---

## ⚙️ Settings & Configuration API

### GET `/api/settings`
Get current settings configuration.

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_pqr678",
  "settings": {
    "api": {
      "openai": {
        "apiKey": "sk-***",
        "model": "gpt-4o-mini",
        "enabled": true
      },
      "google": {
        "apiKey": "AIza***",
        "enabled": false
      }
    },
    "processing": {
      "audioBufferSize": 4096,
      "processingQuality": "high",
      "enableRealtimePreview": true
    },
    "audio": {
      "defaultFormat": "mp3",
      "defaultQuality": "high",
      "sampleRate": 44100,
      "channels": 2
    },
    "ui": {
      "theme": "dark",
      "language": "en",
      "enableVisualFeedback": true
    },
    "advanced": {
      "enableDebugMode": false,
      "logLevel": "info",
      "maxFileSize": 104857600
    }
  },
  "metadata": {
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

### PUT `/api/settings`
Update settings configuration.

**Request:**
- **Method:** PUT
- **Content-Type:** application/json
- **Body:** Settings object with updated values

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "api": {
      "openai": {
        "apiKey": "sk-your-new-key",
        "enabled": true
      }
    },
    "processing": {
      "processingQuality": "high"
    }
  }'
```

### POST `/api/settings/export`
Export current settings configuration.

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  - `format` (string, optional): Export format `"json"`, `"yaml"`, `"env"` (default: "json")
  - `includeSecrets` (boolean, optional): Include API keys (default: false)
  - `includeDefaults` (boolean, optional): Include default values (default: false)

### POST `/api/settings/import`
Import settings configuration.

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  - `data` (object): Settings data to import
  - `format` (string, optional): Import format (default: "json")
  - `merge` (boolean, optional): Merge with existing settings (default: true)
  - `validate` (boolean, optional): Validate imported settings (default: true)
  - `backup` (boolean, optional): Create backup before import (default: true)

### POST `/api/settings/reset`
Reset settings to default values.

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  - `sections` (array, optional): Sections to reset `["all", "api", "processing", "audio", "ui", "advanced"]` (default: ["all"])
  - `backup` (boolean, optional): Create backup before reset (default: true)

### GET `/api/settings/validate`
Validate current settings configuration.

**Response:**
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Google API key not configured"
    ],
    "score": 85
  }
}
```

### GET `/api/settings/schema`
Get settings schema and validation rules.

### POST `/api/settings/test-api`
Test API configuration.

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  - `apiType` (string, optional): API type to test `"all"`, `"openai"`, `"google"` (default: "all")
  - `timeout` (number, optional): Test timeout in ms (default: 10000)

### GET `/api/settings/backups`
Get list of settings backups.

### POST `/api/settings/restore/:backupId`
Restore settings from backup.

---

## 📊 Status & Monitoring

### GET `/api/{service}/status/:requestId`
Get status of long-running jobs.

**Services:** `silence`, `overlap`, `multitrack`, `rhythm`

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_stu901",
  "status": "completed",
  "progress": 100,
  "results": {
    "processingTime": "5.2s",
    "segmentsFound": 12
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:12.000Z"
}
```

---

## 🔧 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_vwx234"
  }
}
```

### Common Error Codes
- `400` - Bad Request (validation errors, invalid parameters)
- `413` - Payload Too Large (file size exceeds limit)
- `415` - Unsupported Media Type (invalid file format)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (processing errors)
- `503` - Service Unavailable (system overloaded)

---

## 🧪 Testing Examples

### Test Silence Detection
```bash
# Basic silence detection
curl -X POST http://localhost:3000/api/silence/detect \
  -F "audio=@test.wav" \
  -F "noiseThreshold=-25" \
  -F "minDuration=0.5"

# Advanced silence detection with AI
curl -X POST http://localhost:3000/api/silence/detect \
  -F "audio=@test.wav" \
  -F "methods=[\"ffmpeg\",\"webAudio\",\"transcript\"]" \
  -F "enableAI=true" \
  -F "confidenceThreshold=0.8"
```

### Test Overlap Detection
```bash
# Basic overlap detection
curl -X POST http://localhost:3000/api/overlap/detect \
  -F "audio=@track1.wav" \
  -F "audio=@track2.wav" \
  -F "sensitivity=5"

# Advanced overlap detection
curl -X POST http://localhost:3000/api/overlap/detect \
  -F "audio=@track1.wav" \
  -F "audio=@track2.wav" \
  -F "frequencyRange=speech" \
  -F "enableML=true" \
  -F "enableCrossCorrelation=true"
```

### Test Multi-Track Analysis
```bash
# Multi-track analysis
curl -X POST http://localhost:3000/api/multitrack/analyze \
  -F "audio=@voice.wav" \
  -F "audio=@music.wav" \
  -F "audio=@effects.wav" \
  -F 'trackTypes=["speech","music","effects"]' \
  -F "submixRouting=auto"
```

### Test Rhythm Analysis
```bash
# Rhythm analysis with GPT
curl -X POST http://localhost:3000/api/rhythm/analyze \
  -F "audio=@speech.wav" \
  -F "enableGPTAnalysis=true" \
  -F "language=en" \
  -F "timingTolerance=100"
```

### Test Settings Management
```bash
# Get current settings
curl http://localhost:3000/api/settings

# Update settings
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"processing":{"processingQuality":"high"}}'

# Export settings
curl -X POST http://localhost:3000/api/settings/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json","includeSecrets":false}'
```

---

## 🚀 Integration Guide

### Frontend Integration
```javascript
// Example frontend integration
class AudioToolsAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }

  async detectSilence(audioFile, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    Object.entries(options).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${this.baseURL}/silence/detect`, {
      method: 'POST',
      body: formData
    });

    return response.json();
  }

  async detectOverlaps(audioFiles, options = {}) {
    const formData = new FormData();
    audioFiles.forEach(file => formData.append('audio', file));
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseURL}/overlap/detect`, {
      method: 'POST',
      body: formData
    });

    return response.json();
  }

  async analyzeRhythm(audioFile, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseURL}/rhythm/analyze`, {
      method: 'POST',
      body: formData
    });

    return response.json();
  }
}

// Usage
const api = new AudioToolsAPI();

// Detect silence
const silenceResult = await api.detectSilence(audioFile, {
  noiseThreshold: -25,
  minDuration: 0.5,
  enableAI: true
});

// Detect overlaps
const overlapResult = await api.detectOverlaps([track1, track2], {
  sensitivity: 7,
  enableML: true
});

// Analyze rhythm
const rhythmResult = await api.analyzeRhythm(audioFile, {
  enableGPTAnalysis: true,
  language: 'en'
});
```

### Node.js Integration
```javascript
// Example Node.js integration
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class AudioToolsClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.client = axios.create({ baseURL });
  }

  async detectSilence(filePath, options = {}) {
    const form = new FormData();
    form.append('audio', fs.createReadStream(filePath));
    
    Object.entries(options).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await this.client.post('/silence/detect', form, {
      headers: form.getHeaders()
    });

    return response.data;
  }

  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Usage
const client = new AudioToolsClient();

// Check health
const health = await client.getHealth();
console.log('API Health:', health);

// Detect silence
const result = await client.detectSilence('./audio.wav', {
  noiseThreshold: -30,
  minDuration: 0.5
});
console.log('Silence Detection Result:', result);
```

---

## 📝 Notes

1. **File Size Limits:** Maximum file size is 100MB per file
2. **Rate Limiting:** 100 requests per 15 minutes per IP
3. **Supported Formats:** MP3, WAV, M4A, OGG, FLAC, AAC
4. **Processing Time:** Most operations complete within 5-10 seconds
5. **Temporary Files:** Processed files are automatically cleaned up after 1 hour
6. **Error Handling:** All endpoints return consistent error responses
7. **Request IDs:** All requests include unique request IDs for tracking

---

## 🔗 Additional Resources

- **API Documentation:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/health`
- **System Status:** `http://localhost:3000/api/health/detailed`
- **Metrics:** `http://localhost:3000/api/health/metrics`

For more information or support, please refer to the project documentation or contact the development team.
