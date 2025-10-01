# 🚀 Postman Testing Guide for Audio Tools Pro Backend

This guide shows you how to test all the Audio Tools Pro Backend API endpoints using Postman.

## 📋 Prerequisites

1. **Start the Backend Server:**
```bash
cd backend
npm install
npm start
```

2. **Install Postman** (if not already installed)
3. **Prepare Test Audio Files** (MP3, WAV, M4A, OGG formats)

## 🔧 Postman Setup

### 1. Create a New Collection
- Open Postman
- Click "New" → "Collection"
- Name it "Audio Tools Pro API"
- Set base URL: `http://localhost:3000/api`

### 2. Set Environment Variables
Create a new environment with these variables:
```
base_url: http://localhost:3000/api
request_id: {{$randomUUID}}
```

## 🏥 Health Check Endpoints

### GET Health Check
```
Method: GET
URL: {{base_url}}/health
Headers: None
Body: None
```

**Expected Response:**
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

### GET Detailed Health Check
```
Method: GET
URL: {{base_url}}/health/detailed
Headers: None
Body: None
```

### GET System Metrics
```
Method: GET
URL: {{base_url}}/health/metrics
Headers: None
Body: None
```

## 🔇 Silence Detection Endpoints

### POST Detect Silence
```
Method: POST
URL: {{base_url}}/silence/detect
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select audio file] | Audio file to analyze |
| methods | Text | ["ffmpeg","webAudio","transcript"] | Detection methods |
| noiseThreshold | Text | -30 | Noise threshold in dB |
| minDuration | Text | 0.5 | Minimum silence duration |
| confidenceThreshold | Text | 0.7 | AI confidence threshold |
| enableAI | Text | true | Enable AI analysis |
| enablePreprocessing | Text | true | Enable preprocessing |

**Expected Response:**
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
  }
}
```

### POST Trim Silence
```
Method: POST
URL: {{base_url}}/silence/trim
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select audio file] | Audio file to process |
| silenceSegments | Text | [{"start":5.2,"end":7.8,"duration":2.6}] | Silence segments to trim |
| trimMode | Text | remove | Trim mode (remove/fade/compress) |
| fadeInDuration | Text | 0.1 | Fade in duration |
| fadeOutDuration | Text | 0.1 | Fade out duration |
| outputFormat | Text | mp3 | Output format |
| quality | Text | high | Quality level |

### GET Silence Detection Methods
```
Method: GET
URL: {{base_url}}/silence/methods
Headers: None
Body: None
```

### POST Batch Silence Detection
```
Method: POST
URL: {{base_url}}/silence/batch
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select multiple files] | Multiple audio files |
| methods | Text | ["ffmpeg","webAudio"] | Detection methods |
| noiseThreshold | Text | -30 | Noise threshold |
| minDuration | Text | 0.5 | Minimum duration |
| parallel | Text | true | Process in parallel |

## 🎵 Audio Overlap Detection Endpoints

### POST Detect Overlaps
```
Method: POST
URL: {{base_url}}/overlap/detect
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select 2+ files] | Multiple audio files |
| sensitivity | Text | 5 | Detection sensitivity (1-10) |
| frequencyRange | Text | full | Frequency range |
| fftSize | Text | 2048 | FFT window size |
| analysisMode | Text | hybrid | Analysis mode |
| overlapThreshold | Text | 0.3 | Overlap threshold |
| enableML | Text | true | Enable ML validation |
| enableCrossCorrelation | Text | true | Enable cross-correlation |

**Expected Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_ghi789",
  "processingTime": "4.1s",
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
  }
}
```

### POST Resolve Overlaps
```
Method: POST
URL: {{base_url}}/overlap/resolve
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select 2+ files] | Multiple audio files |
| resolutionMethod | Text | auto | Resolution method |
| overlaps | Text | [{"start":12.5,"end":15.2,"duration":2.7,"tracks":[0,1]}] | Overlap segments |
| shiftAmount | Text | 0.1 | Time shift amount |
| duckingRatio | Text | 0.3 | Ducking ratio |
| outputFormat | Text | mp3 | Output format |

### GET Overlap Detection Algorithms
```
Method: GET
URL: {{base_url}}/overlap/algorithms
Headers: None
Body: None
```

### POST Frequency Analysis
```
Method: POST
URL: {{base_url}}/overlap/analyze-frequency
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select files] | Audio files to analyze |
| fftSize | Text | 2048 | FFT window size |
| frequencyRange | Text | full | Frequency range |
| enableHarmonicAnalysis | Text | false | Enable harmonic analysis |

## 🎛️ Multi-Track Audio Handling Endpoints

### POST Analyze Multi-Track
```
Method: POST
URL: {{base_url}}/multitrack/analyze
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select 2-6 files] | Multiple audio files |
| analysisTypes | Text | ["silence","overlap","sync"] | Analysis types |
| trackTypes | Text | ["speech","music","effects"] | Track types |
| submixRouting | Text | auto | Submix routing |
| silenceThreshold | Text | -30 | Silence threshold |
| overlapThreshold | Text | 0.3 | Overlap threshold |
| syncTolerance | Text | 0.1 | Sync tolerance |

**Expected Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_jkl012",
  "processingTime": "5.8s",
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
    }
  }
}
```

### POST Sync Tracks
```
Method: POST
URL: {{base_url}}/multitrack/sync
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select 2+ files] | Multiple audio files |
| syncMethod | Text | auto | Sync method |
| referenceTrack | Text | 0 | Reference track index |
| syncTolerance | Text | 0.1 | Sync tolerance |
| enableMultiCamSync | Text | false | Enable multi-cam sync |
| outputFormat | Text | mp3 | Output format |

### POST Configure Ducking
```
Method: POST
URL: {{base_url}}/multitrack/ducking
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select 2+ files] | Multiple audio files |
| primaryTrack | Text | 0 | Primary track index |
| secondaryTracks | Text | [1,2] | Secondary track indices |
| duckingRatio | Text | 0.3 | Ducking ratio |
| attackTime | Text | 0.01 | Attack time |
| releaseTime | Text | 0.1 | Release time |
| threshold | Text | -20 | Ducking threshold |

### POST Configure Submix
```
Method: POST
URL: {{base_url}}/multitrack/submix
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select files] | Multiple audio files |
| submixGroups | Text | {"main":{"tracks":[0,1,2],"gain":1.0}} | Submix groups |
| trackAssignments | Text | [{"trackId":0,"submix":"speech"}] | Track assignments |
| enableAutoRouting | Text | true | Enable auto routing |

### GET Multi-Track Capabilities
```
Method: GET
URL: {{base_url}}/multitrack/capabilities
Headers: None
Body: None
```

## 🎼 Rhythm & Timing Correction Endpoints

### POST Analyze Rhythm
```
Method: POST
URL: {{base_url}}/rhythm/analyze
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select audio file] | Audio file to analyze |
| analysisTypes | Text | ["speech","silence","pacing","flow"] | Analysis types |
| timingTolerance | Text | 150 | Timing tolerance in ms |
| enableGPTAnalysis | Text | true | Enable GPT analysis |
| enableFlowAnalysis | Text | true | Enable flow analysis |
| enablePreciseTiming | Text | true | Enable precise timing |
| language | Text | en | Language code |
| confidenceThreshold | Text | 0.7 | Confidence threshold |

**Expected Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890_mno345",
  "processingTime": "6.2s",
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
    }
  }
}
```

### POST Apply Timing Corrections
```
Method: POST
URL: {{base_url}}/rhythm/correct
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select audio file] | Audio file to process |
| corrections | Text | [{"type":"long_pause","timestamp":8.2,"originalDuration":2.3,"suggestedDuration":1.0,"confidence":0.9,"apply":true}] | Timing corrections |
| stretchAlgorithm | Text | phase_vocoder | Stretch algorithm |
| timingTolerance | Text | 150 | Timing tolerance |
| enablePreciseTiming | Text | true | Enable precise timing |
| outputFormat | Text | mp3 | Output format |
| quality | Text | high | Quality level |

### POST Generate Corrections
```
Method: POST
URL: {{base_url}}/rhythm/generate-corrections
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "analysisResults": {
    "speechRegions": [
      {
        "start": 0.5,
        "end": 8.2,
        "duration": 7.7
      }
    ],
    "silenceRegions": [
      {
        "start": 8.2,
        "end": 10.5,
        "duration": 2.3
      }
    ]
  },
  "correctionTypes": ["long_pause", "short_segment", "pacing"],
  "timingTolerance": 150,
  "enableGPTAnalysis": true,
  "confidenceThreshold": 0.7,
  "maxCorrections": 50
}
```

### GET Timing Correction Algorithms
```
Method: GET
URL: {{base_url}}/rhythm/algorithms
Headers: None
Body: None
```

### POST Preview Corrections
```
Method: POST
URL: {{base_url}}/rhythm/preview
Headers: None
Body: form-data
```

**Form Data:**
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| audio | File | [Select audio file] | Audio file to process |
| corrections | Text | [{"type":"long_pause","timestamp":8.2,"originalDuration":2.3,"suggestedDuration":1.0}] | Timing corrections |
| stretchAlgorithm | Text | phase_vocoder | Stretch algorithm |
| previewDuration | Text | 30 | Preview duration in seconds |
| previewStartTime | Text | 0 | Preview start time |

## ⚙️ Settings & Configuration Endpoints

### GET Current Settings
```
Method: GET
URL: {{base_url}}/settings
Headers: None
Body: None
```

**Expected Response:**
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
      }
    },
    "processing": {
      "audioBufferSize": 4096,
      "processingQuality": "high"
    },
    "audio": {
      "defaultFormat": "mp3",
      "sampleRate": 44100,
      "channels": 2
    }
  }
}
```

### PUT Update Settings
```
Method: PUT
URL: {{base_url}}/settings
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "api": {
    "openai": {
      "apiKey": "sk-your-new-key",
      "enabled": true
    }
  },
  "processing": {
    "processingQuality": "high"
  },
  "audio": {
    "defaultFormat": "mp3",
    "sampleRate": 44100
  }
}
```

### POST Export Settings
```
Method: POST
URL: {{base_url}}/settings/export
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "format": "json",
  "includeSecrets": false,
  "includeDefaults": false
}
```

### POST Import Settings
```
Method: POST
URL: {{base_url}}/settings/import
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "data": {
    "api": {
      "openai": {
        "apiKey": "sk-new-key",
        "enabled": true
      }
    },
    "processing": {
      "processingQuality": "high"
    }
  },
  "format": "json",
  "merge": true,
  "validate": true,
  "backup": true
}
```

### POST Reset Settings
```
Method: POST
URL: {{base_url}}/settings/reset
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "sections": ["all"],
  "backup": true
}
```

### GET Validate Settings
```
Method: GET
URL: {{base_url}}/settings/validate
Headers: None
Body: None
```

### GET Settings Schema
```
Method: GET
URL: {{base_url}}/settings/schema
Headers: None
Body: None
```

### POST Test API Configuration
```
Method: POST
URL: {{base_url}}/settings/test-api
Headers: Content-Type: application/json
Body: JSON
```

**JSON Body:**
```json
{
  "apiType": "all",
  "timeout": 10000
}
```

### GET Settings Backups
```
Method: GET
URL: {{base_url}}/settings/backups
Headers: None
Body: None
```

### POST Restore Backup
```
Method: POST
URL: {{base_url}}/settings/restore/{{backup_id}}
Headers: None
Body: None
```

## 📊 Status & Monitoring Endpoints

### GET Job Status (Silence)
```
Method: GET
URL: {{base_url}}/silence/status/{{request_id}}
Headers: None
Body: None
```

### GET Job Status (Overlap)
```
Method: GET
URL: {{base_url}}/overlap/status/{{request_id}}
Headers: None
Body: None
```

### GET Job Status (Multi-Track)
```
Method: GET
URL: {{base_url}}/multitrack/status/{{request_id}}
Headers: None
Body: None
```

### GET Job Status (Rhythm)
```
Method: GET
URL: {{base_url}}/rhythm/status/{{request_id}}
Headers: None
Body: None
```

## 🧪 Testing Workflow

### 1. Health Check First
Always start by testing the health endpoint to ensure the server is running:
```
GET {{base_url}}/health
```

### 2. Test Basic Functionality
Test the core features in this order:
1. **Silence Detection** - Upload a single audio file
2. **Overlap Detection** - Upload 2+ audio files
3. **Multi-Track Analysis** - Upload multiple files
4. **Rhythm Analysis** - Upload a speech file
5. **Settings Management** - Test configuration

### 3. Test Error Scenarios
- Upload invalid file types
- Send requests without required parameters
- Test with very large files
- Test with malformed JSON

### 4. Test Performance
- Upload large audio files
- Test batch operations
- Monitor response times
- Check memory usage

## 🔧 Postman Collection Setup

### Create Pre-Request Scripts
Add this to your collection's pre-request script:
```javascript
// Set random request ID
pm.environment.set("request_id", pm.variables.replaceIn('{{$randomUUID}}'));

// Set timestamp
pm.environment.set("timestamp", new Date().toISOString());
```

### Create Test Scripts
Add this to your collection's test script:
```javascript
// Test response structure
pm.test("Response is successful", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has request ID", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('requestId');
});

// Log response time
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(30000); // 30 seconds
    console.log("Response time: " + pm.response.responseTime + "ms");
});
```

## 📝 Testing Checklist

### Basic Functionality
- [ ] Health check endpoint works
- [ ] Silence detection with single file
- [ ] Overlap detection with multiple files
- [ ] Multi-track analysis
- [ ] Rhythm analysis
- [ ] Settings management

### Error Handling
- [ ] Invalid file types are rejected
- [ ] Missing parameters return validation errors
- [ ] Large files are handled properly
- [ ] Malformed requests are handled gracefully

### Performance
- [ ] Response times are acceptable (< 30 seconds)
- [ ] Memory usage is reasonable
- [ ] Concurrent requests work
- [ ] File cleanup happens automatically

### Security
- [ ] CORS headers are present
- [ ] Rate limiting works
- [ ] File uploads are validated
- [ ] API keys are handled securely

## 🚨 Common Issues & Solutions

### Issue: "Connection refused"
**Solution:** Make sure the backend server is running on port 3000

### Issue: "File too large"
**Solution:** Check the file size limit (default 100MB) or use smaller test files

### Issue: "Invalid file type"
**Solution:** Use supported audio formats: MP3, WAV, M4A, OGG

### Issue: "Validation failed"
**Solution:** Check that all required parameters are provided with correct types

### Issue: "Processing timeout"
**Solution:** Use smaller files or increase timeout settings

## 📊 Expected Response Times

| Endpoint | Expected Time | Notes |
|----------|---------------|-------|
| Health Check | < 100ms | Very fast |
| Silence Detection | 2-10s | Depends on file size |
| Overlap Detection | 3-15s | Depends on number of files |
| Multi-Track Analysis | 5-20s | Complex processing |
| Rhythm Analysis | 5-30s | AI processing takes time |
| Settings Operations | < 1s | Fast operations |

## 🎯 Pro Tips

1. **Use Environment Variables** - Set up different environments for dev/staging/prod
2. **Save Responses** - Save successful responses as examples
3. **Use Collection Runner** - Run all tests automatically
4. **Monitor Performance** - Track response times and memory usage
5. **Test Edge Cases** - Try unusual inputs and error conditions
6. **Document Results** - Keep notes on what works and what doesn't

Happy testing! 🚀
