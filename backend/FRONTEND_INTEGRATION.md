# 🔗 Frontend Integration Guide

This guide shows you how to integrate the Audio Tools Pro Backend API with your existing Adobe Premiere Pro CEP plugin frontend.

## 🚀 Quick Integration

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Update Your Frontend Code

Replace your existing audio processing functions with API calls to the backend.

## 📝 Integration Examples

### Silence Detection Integration

**Before (Frontend-only):**
```javascript
// Old frontend code
async detectSilence() {
    // Complex frontend processing
    const results = await this.runBasicSilenceDetection();
    this.displayResults(results);
}
```

**After (Backend API):**
```javascript
// New backend-integrated code
async detectSilence() {
    try {
        this.updateStatus('Analyzing audio...', 'processing');
        
        // Create form data
        const formData = new FormData();
        formData.append('audio', this.currentAudioFile);
        formData.append('methods', JSON.stringify(['ffmpeg', 'webAudio', 'transcript']));
        formData.append('noiseThreshold', this.settings.noiseThreshold);
        formData.append('minDuration', this.settings.minDuration);
        formData.append('enableAI', this.settings.enableAI);
        
        // Call backend API
        const response = await fetch('http://localhost:3000/api/silence/detect', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.displaySilenceResults(result.results);
            this.log(`✅ Silence detection completed in ${result.processingTime}`, 'success');
        } else {
            throw new Error(result.error.message);
        }
        
    } catch (error) {
        this.log(`❌ Silence detection failed: ${error.message}`, 'error');
        this.updateStatus('Silence detection failed', 'error');
    }
}
```

### Overlap Detection Integration

**Before:**
```javascript
async detectOverlaps() {
    // Frontend overlap detection
    const overlaps = await this.runComprehensiveOverlapDetection();
    this.displayOverlapResults(overlaps);
}
```

**After:**
```javascript
async detectOverlaps() {
    try {
        this.updateStatus('Detecting overlaps...', 'processing');
        
        const formData = new FormData();
        
        // Add multiple audio files
        this.audioTracks.forEach(track => {
            formData.append('audio', track.file);
        });
        
        formData.append('sensitivity', this.overlapDetectionConfig.sensitivity);
        formData.append('frequencyRange', this.overlapDetectionConfig.frequencyRange);
        formData.append('enableML', this.overlapDetectionConfig.advancedFeatures.enableML);
        
        const response = await fetch('http://localhost:3000/api/overlap/detect', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.displayOverlapResults(result.results);
            this.log(`✅ Found ${result.results.totalOverlaps} overlaps`, 'success');
        } else {
            throw new Error(result.error.message);
        }
        
    } catch (error) {
        this.log(`❌ Overlap detection failed: ${error.message}`, 'error');
    }
}
```

### Multi-Track Analysis Integration

**Before:**
```javascript
async analyzeMultiTrack() {
    // Frontend multi-track processing
    const results = await this.runMultiTrackAnalysis();
    this.displayMultiTrackResults(results);
}
```

**After:**
```javascript
async analyzeMultiTrack() {
    try {
        this.updateStatus('Analyzing multi-track audio...', 'processing');
        
        const formData = new FormData();
        
        // Add all tracks
        Object.values(this.multiTrackConfig.tracks).forEach(track => {
            if (track.audioFile) {
                formData.append('audio', track.audioFile);
            }
        });
        
        formData.append('analysisTypes', JSON.stringify(['silence', 'overlap', 'sync']));
        formData.append('trackTypes', JSON.stringify(this.getTrackTypes()));
        formData.append('submixRouting', 'auto');
        
        const response = await fetch('http://localhost:3000/api/multitrack/analyze', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.displayMultiTrackResults(result.results);
            this.updateMultiTrackUI(result.results);
        } else {
            throw new Error(result.error.message);
        }
        
    } catch (error) {
        this.log(`❌ Multi-track analysis failed: ${error.message}`, 'error');
    }
}
```

### Rhythm Analysis Integration

**Before:**
```javascript
async analyzeRhythm() {
    // Frontend rhythm analysis
    const results = await this.analyzeRhythm();
    this.displayRhythmResults(results);
}
```

**After:**
```javascript
async analyzeRhythm() {
    try {
        this.updateStatus('Analyzing rhythm and timing...', 'processing');
        
        const formData = new FormData();
        formData.append('audio', this.currentAudioFile);
        formData.append('analysisTypes', JSON.stringify(['speech', 'silence', 'pacing', 'flow']));
        formData.append('timingTolerance', this.rhythmTimingConfig.timingTolerance);
        formData.append('enableGPTAnalysis', this.rhythmTimingConfig.enableGPTAnalysis);
        formData.append('enableFlowAnalysis', this.rhythmTimingConfig.enableFlowAnalysis);
        formData.append('language', 'en');
        
        const response = await fetch('http://localhost:3000/api/rhythm/analyze', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.displayRhythmResults(result.results);
            this.generateTimingCorrections(result.results);
        } else {
            throw new Error(result.error.message);
        }
        
    } catch (error) {
        this.log(`❌ Rhythm analysis failed: ${error.message}`, 'error');
    }
}
```

## 🔧 API Client Class

Create a dedicated API client class for better organization:

```javascript
class AudioToolsAPI {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.requestId = 0;
    }

    async request(endpoint, options = {}) {
        const requestId = ++this.requestId;
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'X-Request-ID': `frontend_${requestId}`,
                    ...options.headers
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error?.message || `HTTP ${response.status}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Silence Detection
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
        
        return this.request('/silence/detect', {
            method: 'POST',
            body: formData
        });
    }

    async trimSilence(audioFile, silenceSegments, options = {}) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('silenceSegments', JSON.stringify(silenceSegments));
        
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request('/silence/trim', {
            method: 'POST',
            body: formData
        });
    }

    // Overlap Detection
    async detectOverlaps(audioFiles, options = {}) {
        const formData = new FormData();
        audioFiles.forEach(file => formData.append('audio', file));
        
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request('/overlap/detect', {
            method: 'POST',
            body: formData
        });
    }

    async resolveOverlaps(audioFiles, overlaps, options = {}) {
        const formData = new FormData();
        audioFiles.forEach(file => formData.append('audio', file));
        formData.append('overlaps', JSON.stringify(overlaps));
        
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request('/overlap/resolve', {
            method: 'POST',
            body: formData
        });
    }

    // Multi-Track Operations
    async analyzeMultiTrack(audioFiles, options = {}) {
        const formData = new FormData();
        audioFiles.forEach(file => formData.append('audio', file));
        
        Object.entries(options).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });
        
        return this.request('/multitrack/analyze', {
            method: 'POST',
            body: formData
        });
    }

    async syncTracks(audioFiles, options = {}) {
        const formData = new FormData();
        audioFiles.forEach(file => formData.append('audio', file));
        
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request('/multitrack/sync', {
            method: 'POST',
            body: formData
        });
    }

    // Rhythm Analysis
    async analyzeRhythm(audioFile, options = {}) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        Object.entries(options).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });
        
        return this.request('/rhythm/analyze', {
            method: 'POST',
            body: formData
        });
    }

    async applyTimingCorrections(audioFile, corrections, options = {}) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('corrections', JSON.stringify(corrections));
        
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.request('/rhythm/correct', {
            method: 'POST',
            body: formData
        });
    }

    // Settings Management
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    }

    async exportSettings(options = {}) {
        return this.request('/settings/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });
    }

    async importSettings(settingsData, options = {}) {
        return this.request('/settings/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: settingsData, ...options })
        });
    }

    // Health Check
    async getHealth() {
        return this.request('/health');
    }

    async getDetailedHealth() {
        return this.request('/health/detailed');
    }
}
```

## 🔄 Integration in Your Main Class

Update your main `AudioToolsPro` class to use the API client:

```javascript
class AudioToolsPro {
    constructor() {
        // ... existing initialization ...
        
        // Initialize API client
        this.api = new AudioToolsAPI();
        
        // Check backend connectivity
        this.checkBackendConnection();
    }

    async checkBackendConnection() {
        try {
            const health = await this.api.getHealth();
            if (health.success) {
                this.log('✅ Backend API connected', 'success');
                this.updateConnectionStatus('connected');
            } else {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            this.log('⚠️ Backend API not available, using fallback methods', 'warning');
            this.updateConnectionStatus('disconnected');
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.className = `connection-status ${status}`;
            statusElement.querySelector('.status-text').textContent = 
                status === 'connected' ? 'Backend Connected' : 'Backend Disconnected';
        }
    }

    // Replace existing methods with API calls
    async detectSilence() {
        if (!this.currentAudioFile) {
            this.showUIMessage('Please load an audio file first', 'error');
            return;
        }

        try {
            this.updateStatus('Analyzing audio for silence...', 'processing');
            
            const options = {
                methods: ['ffmpeg', 'webAudio', 'transcript'],
                noiseThreshold: this.settings.noiseThreshold || -30,
                minDuration: this.settings.minDuration || 0.5,
                enableAI: this.settings.enableAI !== false,
                confidenceThreshold: this.settings.confidenceThreshold || 0.7
            };

            const result = await this.api.detectSilence(this.currentAudioFile, options);
            
            if (result.success) {
                this.lastSilenceResults = result.results;
                this.displaySilenceResults(result.results);
                this.log(`✅ Silence detection completed in ${result.processingTime}`, 'success');
                this.showUIMessage(`Found ${result.results.silenceSegments.length} silence segments`, 'success');
            }
            
        } catch (error) {
            this.log(`❌ Silence detection failed: ${error.message}`, 'error');
            this.showUIMessage('Silence detection failed', 'error');
        }
    }

    async detectOverlaps() {
        const audioFiles = this.getAudioFilesForOverlapDetection();
        if (audioFiles.length < 2) {
            this.showUIMessage('At least 2 audio files required for overlap detection', 'error');
            return;
        }

        try {
            this.updateStatus('Detecting audio overlaps...', 'processing');
            
            const options = {
                sensitivity: this.overlapDetectionConfig.sensitivity || 5,
                frequencyRange: this.overlapDetectionConfig.frequencyRange || 'full',
                enableML: this.overlapDetectionConfig.advancedFeatures.enableML !== false,
                enableCrossCorrelation: this.overlapDetectionConfig.advancedFeatures.enableCrossCorrelation !== false
            };

            const result = await this.api.detectOverlaps(audioFiles, options);
            
            if (result.success) {
                this.lastOverlapResults = result.results;
                this.displayOverlapResults(result.results);
                this.log(`✅ Found ${result.results.totalOverlaps} overlaps`, 'success');
            }
            
        } catch (error) {
            this.log(`❌ Overlap detection failed: ${error.message}`, 'error');
            this.showUIMessage('Overlap detection failed', 'error');
        }
    }

    // ... continue with other methods
}
```

## 🎛️ Settings Integration

Update your settings management to use the backend:

```javascript
async loadSettings() {
    try {
        const result = await this.api.getSettings();
        if (result.success) {
            this.settings = result.settings;
            this.applySettingsToUI();
            this.log('✅ Settings loaded from backend', 'success');
        }
    } catch (error) {
        this.log('⚠️ Failed to load settings from backend, using defaults', 'warning');
        this.settings = this.getDefaultSettings();
    }
}

async saveSettings() {
    try {
        const result = await this.api.updateSettings(this.settings);
        if (result.success) {
            this.log('✅ Settings saved to backend', 'success');
        }
    } catch (error) {
        this.log(`❌ Failed to save settings: ${error.message}`, 'error');
    }
}

async exportSettings() {
    try {
        const result = await this.api.exportSettings({
            format: 'json',
            includeSecrets: false
        });
        
        if (result.success) {
            // Download the settings file
            const blob = new Blob([result.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio-tools-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.log('✅ Settings exported successfully', 'success');
        }
    } catch (error) {
        this.log(`❌ Failed to export settings: ${error.message}`, 'error');
    }
}
```

## 🔄 Error Handling & Fallbacks

Implement proper error handling with fallbacks to frontend methods:

```javascript
async detectSilenceWithFallback() {
    try {
        // Try backend first
        return await this.detectSilence();
    } catch (error) {
        this.log('⚠️ Backend unavailable, using frontend fallback', 'warning');
        
        // Fallback to existing frontend method
        return await this.runBasicSilenceDetection();
    }
}

async detectOverlapsWithFallback() {
    try {
        // Try backend first
        return await this.detectOverlaps();
    } catch (error) {
        this.log('⚠️ Backend unavailable, using frontend fallback', 'warning');
        
        // Fallback to existing frontend method
        return await this.runComprehensiveOverlapDetection();
    }
}
```

## 📊 Progress Tracking

Implement progress tracking for long-running operations:

```javascript
async detectSilenceWithProgress() {
    try {
        this.updateStatus('Starting silence detection...', 'processing');
        this.updateProgressBar(0, 'Initializing...');
        
        const result = await this.api.detectSilence(this.currentAudioFile, {
            methods: ['ffmpeg', 'webAudio', 'transcript'],
            noiseThreshold: -30,
            minDuration: 0.5
        });
        
        this.updateProgressBar(100, 'Complete');
        this.updateStatus('Silence detection completed', 'success');
        
        return result;
        
    } catch (error) {
        this.updateProgressBar(0, 'Failed');
        this.updateStatus('Silence detection failed', 'error');
        throw error;
    }
}
```

## 🚀 Testing Your Integration

1. **Start the backend server:**
```bash
cd backend
npm start
```

2. **Test the connection:**
```javascript
// In your frontend console
const api = new AudioToolsAPI();
api.getHealth().then(console.log);
```

3. **Test silence detection:**
```javascript
// Load an audio file and test
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

api.detectSilence(file, {
    noiseThreshold: -25,
    minDuration: 0.5
}).then(result => {
    console.log('Silence detection result:', result);
});
```

## 🔧 Configuration

Add backend configuration to your settings:

```javascript
const defaultSettings = {
    // ... existing settings ...
    
    backend: {
        enabled: true,
        baseURL: 'http://localhost:3000/api',
        timeout: 30000,
        retryAttempts: 3,
        fallbackToFrontend: true
    }
};
```

## 📝 Migration Checklist

- [ ] Install and start the backend server
- [ ] Create the `AudioToolsAPI` client class
- [ ] Update silence detection to use backend API
- [ ] Update overlap detection to use backend API
- [ ] Update multi-track analysis to use backend API
- [ ] Update rhythm analysis to use backend API
- [ ] Update settings management to use backend API
- [ ] Implement error handling and fallbacks
- [ ] Test all functionality with backend
- [ ] Update UI to show backend connection status
- [ ] Add progress tracking for long operations
- [ ] Test with various audio file formats
- [ ] Verify settings persistence
- [ ] Test error scenarios and recovery

## 🎯 Benefits of Backend Integration

1. **Better Performance:** Server-side processing with more resources
2. **Advanced Features:** AI integration, complex algorithms
3. **Scalability:** Handle larger files and more complex operations
4. **Reliability:** Robust error handling and recovery
5. **Maintainability:** Centralized processing logic
6. **Extensibility:** Easy to add new features and algorithms

Your frontend will now leverage the powerful backend API while maintaining the same user experience!
