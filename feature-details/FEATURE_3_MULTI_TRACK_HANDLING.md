# 🎵 Feature 3: Multi-Track Audio Handling & Processing

## Overview

The Multi-Track Audio Handling feature provides professional-grade multi-track audio processing capabilities, supporting up to 6 simultaneous audio tracks with real-time analysis, submix routing, and multi-camera synchronization. It's designed for complex audio workflows requiring sophisticated track management and processing.

## 🎯 Key Capabilities

### Track Management
- **Up to 6 Audio Tracks**: Simultaneous processing and analysis
- **Real-time Processing**: AudioWorklet-based low-latency processing
- **Submix Routing**: Professional audio routing architecture
- **Dynamic Ducking**: Automatic level adjustment between tracks
- **Multi-Camera Sync**: Audio synchronization for multi-cam productions

### Advanced Features
- **AudioWorklet Integration**: Real-time audio processing without blocking
- **Submix Architecture**: Professional routing with gain staging
- **Cross-Track Analysis**: Silence and overlap detection across all tracks
- **Auto-Trim Calculation**: Intelligent trim point suggestions
- **Performance Monitoring**: Real-time processing statistics

## 🔧 How It Works

### 1. System Initialization
```javascript
// Initialize multi-track audio handler
const audioHandler = new MultiTrackAudioHandler({
    maxTracks: 6,
    sampleRate: 44100,
    bufferSize: 512,
    enableWorklet: true,
    enableSubmixRouting: true,
    enableAnalysis: true,
    enableMultiCam: true
});

await audioHandler.initialize();
```

### 2. Track Management

#### Adding Tracks
```javascript
// Add audio tracks with configuration
await audioHandler.addTrack(0, audioBuffer, {
    name: 'Dialog Track',
    type: 'speech',
    submix: 'speech',
    gain: 1.0,
    offset: 0
});

await audioHandler.addTrack(1, audioBuffer, {
    name: 'Music Track',
    type: 'music',
    submix: 'music',
    gain: 0.8,
    offset: 0
});
```

#### Track Configuration
```javascript
// Configure track properties
audioHandler.setTrackGain(trackId, 0.9);
audioHandler.muteTrack(trackId, false);
audioHandler.soloTrack(trackId, true);
audioHandler.routeTrackToSubmix(trackId, 'main');
```

### 3. AudioWorklet Processing

#### Real-time Processing
```javascript
// AudioWorklet processes audio in real-time
class MultiTrackAudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.maxTracks = 6;
        this.sampleRate = options.processorOptions?.sampleRate || 44100;
        this.bufferSize = options.processorOptions?.bufferSize || 512;
        
        // Track management
        this.tracks = new Array(this.maxTracks).fill(null).map((_, index) => ({
            id: index,
            active: false,
            buffer: new Float32Array(this.bufferSize),
            level: 0,
            isSilent: true,
            silenceThreshold: -40, // dB
            overlapDetected: false,
            duckingAmount: 0,
            gainReduction: 1.0
        }));
    }
}
```

#### Processing Pipeline
```javascript
// Real-time audio processing
process(inputs, outputs, parameters) {
    const numInputs = Math.min(inputs.length, this.maxTracks);
    const output = outputs[0];
    
    // Process each active track
    for (let trackId = 0; trackId < numInputs; trackId++) {
        const track = this.tracks[trackId];
        const input = inputs[trackId];
        
        if (!track.active || !input || input.length === 0) {
            continue;
        }
        
        // Analyze audio level for silence detection
        this.analyzeTrack(trackId, input);
        
        // Apply dynamic ducking if configured
        const processedAudio = this.applyDucking(trackId, input);
        
        // Add to output (submix routing)
        this.addToSubmixOutput(trackId, processedAudio, output);
    }
    
    // Detect overlaps across all active tracks
    this.detectOverlaps();
    
    return true;
}
```

### 4. Submix Routing

#### Routing Architecture
```javascript
// Submix configuration
this.submixes = {
    main: { tracks: [], gain: 1.0 },
    speech: { tracks: [], gain: 1.0 },
    music: { tracks: [], gain: 1.0 },
    effects: { tracks: [], gain: 1.0 }
};
```

#### Dynamic Routing
```javascript
// Route tracks to submixes
audioHandler.routeTrackToSubmix(0, 'speech');
audioHandler.routeTrackToSubmix(1, 'music');
audioHandler.routeTrackToSubmix(2, 'effects');

// Set submix gains
audioHandler.setSubmixGain('speech', 1.2);
audioHandler.setSubmixGain('music', 0.8);
audioHandler.setSubmixGain('effects', 0.6);
```

### 5. Cross-Track Analysis

#### Silence Detection
```javascript
// Run silence detection across all tracks
const silenceResults = await audioHandler.runSilenceDetection();

// Results structure
{
    0: [ // Track 0 silence regions
        { start: 1.5, end: 2.0, duration: 0.5, confidence: 0.9 },
        { start: 3.2, end: 3.8, duration: 0.6, confidence: 0.8 }
    ],
    1: [ // Track 1 silence regions
        { start: 0.8, end: 1.2, duration: 0.4, confidence: 0.95 }
    ]
}
```

#### Overlap Detection
```javascript
// Detect overlaps between tracks
const overlaps = await audioHandler.runOverlapDetection();

// Results structure
[
    {
        tracks: [0, 1],
        start: 2.5,
        end: 3.0,
        duration: 0.5,
        type: 'frequency_overlap',
        severity: 'medium',
        confidence: 0.8
    }
]
```

### 6. Dynamic Ducking

#### Ducking Configuration
```javascript
// Setup dynamic ducking
audioHandler.setupDynamicDucking(
    0, // Primary track (speech)
    [1, 2], // Secondary tracks (music, effects)
    {
        threshold: -20,
        ratio: 4,
        attackTime: 0.01,
        releaseTime: 0.1
    }
);
```

#### Real-time Ducking
```javascript
// Apply ducking in real-time
applyDucking(trackId, input) {
    const track = this.tracks[trackId];
    
    if (track.duckingAmount > 0) {
        // Apply gain reduction
        const gainReduction = 1.0 - (track.duckingAmount * this.duckingRatio);
        track.gainReduction = Math.max(gainReduction, 0.1);
        
        // Apply to audio
        for (let i = 0; i < input.length; i++) {
            input[i] *= track.gainReduction;
        }
    }
    
    return input;
}
```

### 7. Multi-Camera Synchronization

#### Camera Track Setup
```javascript
// Add camera tracks
await audioHandler.addTrack(0, audioBuffer, {
    name: 'Camera A',
    type: 'camera',
    metadata: {
        frameRate: 23.976,
        timecode: '01:00:00:00'
    }
});

await audioHandler.addTrack(1, audioBuffer, {
    name: 'Camera B',
    type: 'camera',
    metadata: {
        frameRate: 23.976,
        timecode: '01:00:00:00'
    }
});
```

#### Sync Detection
```javascript
// Create sync group
const syncGroup = await audioHandler.createSyncGroup([0, 1], {
    method: 'audio_correlation',
    tolerance: 0.1
});

// Detect synchronization
const syncResults = await audioHandler.detectCameraSync(syncGroup.id);
```

## 📊 Configuration Options

### System Configuration
```javascript
const config = {
    maxTracks: 6,
    sampleRate: 44100,
    bufferSize: 512,
    enableWorklet: true,
    enableSubmixRouting: true,
    enableAnalysis: true,
    enableMultiCam: true
};
```

### Track Configuration
```javascript
const trackConfig = {
    name: 'Track Name',
    type: 'speech', // 'speech', 'music', 'effects', 'camera'
    submix: 'main', // 'main', 'speech', 'music', 'effects'
    gain: 1.0,
    offset: 0,
    metadata: {}
};
```

## 🚀 Usage Examples

### Basic Multi-Track Setup
```javascript
// Initialize handler
const audioHandler = new MultiTrackAudioHandler();
await audioHandler.initialize();

// Add tracks
await audioHandler.addTrack(0, dialogAudio, { name: 'Dialog', type: 'speech' });
await audioHandler.addTrack(1, musicAudio, { name: 'Music', type: 'music' });
await audioHandler.addTrack(2, effectsAudio, { name: 'Effects', type: 'effects' });

// Start processing
audioHandler.startProcessing();
```

### Advanced Workflow
```javascript
// Run comprehensive analysis
const silenceResults = await audioHandler.runSilenceDetection();
const overlaps = await audioHandler.runOverlapDetection();

// Setup dynamic ducking
audioHandler.setupDynamicDucking(0, [1, 2], {
    threshold: -20,
    ratio: 4,
    attackTime: 0.01,
    releaseTime: 0.1
});

// Calculate auto-trim points
const trimPoints = audioHandler.calculateAutoTrimPoints(0);
```

### Multi-Camera Workflow
```javascript
// Add camera tracks
await audioHandler.addTrack(0, cameraAAudio, { type: 'camera', name: 'Camera A' });
await audioHandler.addTrack(1, cameraBAudio, { type: 'camera', name: 'Camera B' });

// Create sync group
const syncGroup = await audioHandler.createSyncGroup([0, 1]);

// Detect sync
const syncResults = await audioHandler.detectCameraSync(syncGroup.id);

// Apply manual offset if needed
audioHandler.setManualCameraOffset(1, 0.5); // 0.5 second offset
```

## 📈 Performance Metrics

### Processing Performance
- **Latency**: < 10ms (AudioWorklet processing)
- **CPU Usage**: 15-25% for 6 tracks
- **Memory Usage**: ~50MB for 6 tracks
- **Real-time Capability**: Yes, with AudioWorklet

### Analysis Performance
- **Silence Detection**: 2-5 seconds per track
- **Overlap Detection**: 5-10 seconds for all tracks
- **Sync Detection**: 10-30 seconds for camera pairs
- **Ducking Response**: < 10ms attack time

## 🎨 User Interface

### Track Visualization
- **Track List**: Shows all active tracks with status
- **Level Meters**: Real-time level monitoring
- **Submix Routing**: Visual routing diagram
- **Processing Status**: Real-time processing indicators

### Control Panel
- **Track Controls**: Gain, mute, solo, routing
- **Submix Controls**: Master gain, routing configuration
- **Analysis Controls**: Start/stop analysis, view results
- **Sync Controls**: Multi-camera synchronization tools

## 🔧 Technical Implementation

### Core Classes
- **`MultiTrackAudioHandler`**: Main integration layer
- **`MultiTrackAudioProcessor`**: AudioWorklet processor
- **`SubmixRouter`**: Audio routing architecture
- **`AudioAnalyzer`**: Cross-track analysis
- **`MultiCamAudioAligner`**: Camera synchronization

### Dependencies
- **Web Audio API**: AudioWorklet, AudioContext
- **AudioWorklet**: Real-time processing
- **FFmpeg**: Audio analysis and processing
- **OpenAI Whisper**: Speech analysis

## 🎯 Use Cases

### Podcast Production
- Multiple microphone tracks
- Background music and effects
- Dynamic ducking for clean speech
- Cross-track silence detection

### Video Production
- Multi-camera audio synchronization
- Dialog, music, and effects tracks
- Professional submix routing
- Real-time level monitoring

### Live Streaming
- Multiple audio sources
- Real-time processing
- Dynamic level adjustment
- Cross-track analysis

## ⚙️ Settings & Configuration

### Track Settings
- **Gain**: -60dB to +12dB
- **Mute/Solo**: Individual track control
- **Routing**: Submix assignment
- **Offset**: Time alignment

### Submix Settings
- **Gain**: -60dB to +12dB
- **Routing**: Track assignment
- **Processing**: Compression, limiting
- **Monitoring**: Level meters

### Analysis Settings
- **Silence Threshold**: -60dB to -10dB
- **Overlap Threshold**: 0.1 to 1.0
- **Sync Tolerance**: 0.01 to 1.0 seconds
- **Ducking Ratio**: 1:1 to 1:20

## 🚨 Troubleshooting

### Common Issues
1. **AudioWorklet not loading**: Check browser compatibility
2. **High CPU usage**: Reduce buffer size or disable worklet
3. **Sync detection fails**: Check audio quality and levels
4. **Ducking not working**: Verify track routing and levels

### Performance Optimization
- Use smaller buffer sizes for lower latency
- Disable unnecessary analysis features
- Optimize submix routing
- Monitor CPU usage and adjust settings

## 📚 API Reference

### Main Methods
```javascript
// Track management
audioHandler.addTrack(trackId, audioSource, options)
audioHandler.removeTrack(trackId)
audioHandler.setTrackGain(trackId, gain)

// Analysis
audioHandler.runSilenceDetection(trackIds, options)
audioHandler.runOverlapDetection(trackIds, options)

// Submix control
audioHandler.routeTrackToSubmix(trackId, submixName)
audioHandler.setSubmixGain(submixName, gain)

// Multi-camera sync
audioHandler.createSyncGroup(trackIds, options)
audioHandler.detectCameraSync(groupId, options)
```

### Configuration
```javascript
// Update settings
audioHandler.updateConfig({
    maxTracks: 8,
    bufferSize: 256,
    enableWorklet: true
});
```

## 🎉 Benefits

- **Professional Workflow**: Industry-standard multi-track processing
- **Real-time Performance**: Low-latency AudioWorklet processing
- **Flexible Routing**: Professional submix architecture
- **Cross-track Analysis**: Comprehensive audio analysis
- **Multi-camera Support**: Synchronization for complex productions

---

*This feature provides professional multi-track audio handling capabilities, enabling complex audio workflows with real-time processing, sophisticated routing, and comprehensive analysis tools.*
