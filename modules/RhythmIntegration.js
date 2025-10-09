/**
 * RhythmIntegration Module
 * Handles all API interactions for rhythm analysis and timing corrections with the backend
 * Replaces frontend rhythm processing with backend API calls
 */

class RhythmIntegration {
    constructor(audioToolsPro) {
        this.audioToolsPro = audioToolsPro;
        this.baseURL = this.getBackendURL();
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Request tracking
        this.activeRequests = new Map();
        this.requestHistory = [];
        
        this.log('🎵 Rhythm Integration module initialized', 'info');
    }

    /**
     * Get backend URL from configuration or environment
     */
    getBackendURL() {
        // Use centralized environment configuration
        if (window.envConfig) {
            return window.envConfig.getApiEndpoint('rhythm');
        }
        
        // Fallback for when envConfig is not available
        const storedPort = localStorage.getItem('audioToolsBackendPort');
        const port = storedPort || '3000';
        return `http://localhost:${port}/api/rhythm`;
    }

    /**
     * Analyze rhythm and timing patterns in audio
     * @param {string|Blob} audioData - Audio file path or blob to analyze
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeRhythm(audioData, options = {}) {
        try {
            this.log('🎵 Starting rhythm analysis via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🎵 Analyzing rhythm and timing patterns via backend...', 'processing');

            // Validate audio data
            if (!audioData) {
                throw new Error('No audio data provided for rhythm analysis');
            }

            // Prepare FormData for upload
            const formData = new FormData();
            
            // Handle both file paths and blobs
            if (audioData instanceof Blob) {
                // Audio data is a blob - this is preferred for backend API
                formData.append('audio', audioData, 'audio.wav');
                this.log('📊 Using audio blob data', 'info');
            } else if (typeof audioData === 'string') {
                // Audio data is a file path - backend needs to handle file reading
                const fileName = audioData.split(/[\\/]/).pop() || 'audio.wav';
                
                // Send file path for server-side file reading
                formData.append('filePath', audioData);
                formData.append('fileName', fileName);
                this.log(`� Using audio file path for server processing: ${fileName}`, 'info');
            } else {
                throw new Error('Invalid audio data format. Expected Blob or file path string.');
            }
            
            // Add analysis options to form data
            formData.append('options', JSON.stringify(options));

            this.log(`📤 Prepared rhythm analysis request`, 'info');

            // Make API request
            const requestId = `rhythm_analysis_${Date.now()}`;
            this.activeRequests.set(requestId, { type: 'analyze', startTime: Date.now() });

            const response = await this.makeRequest('/analyze', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Rhythm analysis completed successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Rhythm analysis completed!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Rhythm analysis failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Rhythm analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Apply timing corrections to audio
     * @param {Blob} audioBlob - Original audio blob
     * @param {Array} corrections - Array of timing corrections
     * @param {Object} options - Correction options
     * @returns {Promise<Object>} Correction results
     */
    async correctTiming(audioBlob, corrections, options = {}) {
        try {
            this.log('🔧 Starting timing correction via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🔧 Applying timing corrections via backend...', 'processing');

            if (!audioBlob) {
                throw new Error('No audio data provided for timing correction');
            }

            if (!corrections || corrections.length === 0) {
                throw new Error('No corrections provided');
            }

            // Prepare FormData for upload
            const formData = new FormData();
            
            // Add audio file
            const fileName = `timing_correction_${Date.now()}.${this.getFileExtension(audioBlob.type)}`;
            formData.append('audio', audioBlob, fileName);
            
            // Add corrections
            formData.append('corrections', JSON.stringify(corrections));
            
            // Add correction options
            formData.append('method', options.method || 'time_stretching');
            formData.append('speedAdjustment', options.speedAdjustment || 1.0);
            formData.append('preservePitch', options.preservePitch !== false);
            formData.append('outputFormat', options.outputFormat || 'mp3');
            formData.append('quality', options.quality || 'high');
            
            if (options.targetSpeechRate) {
                formData.append('targetSpeechRate', options.targetSpeechRate);
            }
            if (options.targetPauseDuration) {
                formData.append('targetPauseDuration', options.targetPauseDuration);
            }

            this.log(`📤 Prepared timing correction request with ${corrections.length} corrections`, 'info');

            // Make API request
            const response = await this.makeRequest('/correct', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Timing correction completed successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Timing corrections applied!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Timing correction failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Timing correction failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get available timing correction algorithms
     * @returns {Promise<Object>} Available algorithms
     */
    async getAlgorithms() {
        try {
            this.log('📋 Fetching available timing correction algorithms...', 'info');

            const response = await this.makeRequest('/algorithms', {
                method: 'GET'
            });

            this.log(`✅ Retrieved ${response.algorithms?.length || 0} available algorithms`, 'success');
            return response;

        } catch (error) {
            this.log(`❌ Failed to get algorithms: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Test rhythm analysis with backend
     * @param {Object} options - Test options
     * @returns {Promise<Object>} Test results
     */
    async testRhythmAnalysis(options = {}) {
        try {
            this.log('🧪 Running rhythm analysis test...', 'info');
            this.audioToolsPro.showUIMessage('🧪 Testing rhythm analysis...', 'processing');

            const formData = new FormData();
            formData.append('sampleDuration', options.sampleDuration || 30.0);
            formData.append('language', options.language || 'en');

            const response = await this.makeRequest('/test', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Rhythm analysis test completed', 'success');
            this.audioToolsPro.showUIMessage('✅ Test completed successfully!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Test failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get job status for long-running operations
     * @param {string} requestId - Request ID to check
     * @returns {Promise<Object>} Job status
     */
    async getJobStatus(requestId) {
        try {
            const response = await this.makeRequest(`/status/${requestId}`, {
                method: 'GET'
            });

            return response;

        } catch (error) {
            this.log(`❌ Failed to get job status: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`🌐 Making request to: ${url} (attempt ${attempt}/${this.maxRetries})`, 'info');

                // Check backend health first
                if (attempt === 1) {
                    await this.checkBackendHealth();
                }

                const response = await fetch(url, {
                    method: options.method || 'GET',
                    body: options.body,
                    headers: {
                        ...options.headers
                        // Don't set Content-Type for FormData - let browser set it with boundary
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText };
                    }
                    throw new Error(`HTTP ${response.status}: ${errorData.message || errorData.error || 'Unknown error'}`);
                }

                const data = await response.json();
                
                // Track successful request
                this.requestHistory.push({
                    url,
                    method: options.method || 'GET',
                    timestamp: Date.now(),
                    success: true,
                    attempt
                });

                return data;

            } catch (error) {
                lastError = error;
                this.log(`❌ Request attempt ${attempt} failed: ${error.message}`, 'error');

                if (attempt < this.maxRetries) {
                    this.log(`⏳ Retrying in ${this.retryDelay}ms...`, 'info');
                    await this.delay(this.retryDelay);
                    this.retryDelay *= 1.5; // Exponential backoff
                }
            }
        }

        // Track failed request
        this.requestHistory.push({
            url,
            method: options.method || 'GET',
            timestamp: Date.now(),
            success: false,
            error: lastError.message,
            attempts: this.maxRetries
        });

        throw lastError;
    }

    /**
     * Check if backend server is running
     * @returns {Promise<void>}
     */
    async checkBackendHealth() {
        try {
            const healthURL = 'http://localhost:3000/api/health';
            const response = await fetch(healthURL, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            
            this.log('✅ Backend health check passed', 'info');
            
        } catch (error) {
            this.log('❌ Backend appears to be offline. Please start the backend server.', 'error');
            this.audioToolsPro.showUIMessage('❌ Backend server offline. Please start the backend server and try again.', 'error');
            throw new Error('Backend server is not running. Please start the server and try again.');
        }
    }

    /**
     * Get file extension from MIME type
     * @param {string} mimeType - MIME type
     * @returns {string} File extension
     */
    getFileExtension(mimeType) {
        const mimeToExt = {
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/x-wav': 'wav',
            'audio/wave': 'wav',
            'audio/mp4': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/aac': 'aac',
            'audio/ogg': 'ogg',
            'audio/flac': 'flac',
            'video/mp4': 'mp4',
            'video/webm': 'webm'
        };
        
        return mimeToExt[mimeType] || 'mp3';
    }

    /**
     * Get MIME type from file extension
     * @param {string} fileName - File name with extension
     * @returns {string} MIME type
     */
    getAudioMimeType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const extToMime = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
        };
        
        return extToMime[ext] || 'audio/mpeg';
    }

    /**
     * Delay execution for specified time
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log message with AudioToolsPro logging system
     * @param {string} message - Message to log
     * @param {string} level - Log level
     */
    log(message, level = 'info') {
        if (this.audioToolsPro && this.audioToolsPro.log) {
            this.audioToolsPro.log(message, level);
        } else {
            console.log(`[RhythmIntegration] ${message}`);
        }
    }

    /**
     * Get request history for debugging
     * @returns {Array} Request history
     */
    getRequestHistory() {
        return this.requestHistory;
    }

    /**
     * Clear request history
     */
    clearRequestHistory() {
        this.requestHistory = [];
    }

    /**
     * Get active requests
     * @returns {Map} Active requests
     */
    getActiveRequests() {
        return this.activeRequests;
    }

    /**
     * Display rhythm analysis results in UI
     * @param {Object} results - Rhythm analysis results from backend
     */
    displayRhythmResults(results) {
        try {
            this.log('📊 Displaying rhythm analysis results...', 'info');
            
            // Show results panel
            this.showRhythmResults(results);
            
            // Update summary cards
            this.updateRhythmSummary(results);
            
            // Update speech segments list
            this.updateSpeechSegmentsList(results.speechSegments || []);
            
            this.log('✅ Rhythm results displayed successfully', 'success');
            
        } catch (error) {
            this.log(`❌ Failed to display rhythm results: ${error.message}`, 'error');
        }
    }

    /**
     * Show rhythm results panel
     * @param {Object} results - Results data
     */
    showRhythmResults(results) {
        try {
            const rhythmEmptyState = document.getElementById('rhythmEmptyState');
            const rhythmResults = document.getElementById('rhythmResults');

            if (rhythmEmptyState) {
                rhythmEmptyState.style.display = 'none';
            }

            if (rhythmResults) {
                rhythmResults.style.display = 'block';
                
                // Setup clear button
                const clearRhythmResults = document.getElementById('clearRhythmResults');
                if (clearRhythmResults) {
                    clearRhythmResults.onclick = () => {
                        rhythmResults.style.display = 'none';
                        if (rhythmEmptyState) {
                            rhythmEmptyState.style.display = 'block';
                        }
                    };
                }
            } else {
                // Fallback: use main rhythm analysis container
                const rhythmAnalysis = document.getElementById('rhythmAnalysis');
                if (rhythmAnalysis) {
                    this.log('🔄 Using rhythm analysis container as fallback', 'info');
                } else {
                    this.log('⚠️ Rhythm results container not found', 'warning');
                }
            }

        } catch (error) {
            this.log(`❌ Failed to show rhythm results: ${error.message}`, 'error');
        }
    }

    /**
     * Update rhythm analysis summary cards
     * @param {Object} results - Analysis results
     */
    updateRhythmSummary(results) {
        try {
            // Update speech segment count
            const speechSegmentCount = document.getElementById('speechSegmentCount');
            if (speechSegmentCount && results.speechSegments) {
                speechSegmentCount.textContent = results.speechSegments.length;
            }

            // Update average pitch
            const averagePitch = document.getElementById('averagePitch');
            if (averagePitch && results.averagePitch) {
                averagePitch.textContent = `${Math.round(results.averagePitch)} Hz`;
            }

            // Update speech rate
            const speechRate = document.getElementById('speechRate');
            if (speechRate && results.averageSpeechRate) {
                speechRate.textContent = `${results.averageSpeechRate.toFixed(1)} wps`;
            }

            // Update average intensity
            const averageIntensity = document.getElementById('averageIntensity');
            if (averageIntensity && results.averageIntensity) {
                averageIntensity.textContent = `${Math.round(results.averageIntensity * 100)}%`;
            }

            this.log('✅ Rhythm summary updated', 'success');

        } catch (error) {
            this.log(`❌ Failed to update rhythm summary: ${error.message}`, 'error');
        }
    }

    /**
     * Update speech segments list
     * @param {Array} speechSegments - Array of speech segments
     */
    updateSpeechSegmentsList(speechSegments) {
        try {
            let speechSegmentsList = document.getElementById('speechSegmentsList');
            if (!speechSegmentsList) {
                // Try to find or create the container
                const rhythmResults = document.getElementById('rhythmResults');
                if (rhythmResults) {
                    // Look for existing segments container
                    speechSegmentsList = rhythmResults.querySelector('.segments-list');
                    if (!speechSegmentsList) {
                        // Create the container if it doesn't exist
                        speechSegmentsList = document.createElement('div');
                        speechSegmentsList.id = 'speechSegmentsList';
                        speechSegmentsList.className = 'segments-list';
                        rhythmResults.appendChild(speechSegmentsList);
                        this.log('✅ Created speech segments list container', 'info');
                    }
                } else {
                    this.log('⚠️ Speech segments list container not found', 'warning');
                    return;
                }
            }

            // Clear existing segments
            speechSegmentsList.innerHTML = '';

            if (!speechSegments || speechSegments.length === 0) {
                speechSegmentsList.innerHTML = `
                    <div class="no-segments">
                        <p>No speech segments found</p>
                    </div>
                `;
                return;
            }

            // Add each speech segment
            speechSegments.forEach((segment, index) => {
                const segmentItem = document.createElement('div');
                segmentItem.className = 'segment-item';
                segmentItem.innerHTML = `
                    <div class="segment-time">
                        ${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}
                    </div>
                    <div class="segment-stats">
                        <div class="segment-stat">
                            <div class="segment-stat-value">${Math.round(segment.pitch || 0)}</div>
                            <div class="segment-stat-label">Pitch (Hz)</div>
                        </div>
                        <div class="segment-stat">
                            <div class="segment-stat-value">${(segment.speechRate || 0).toFixed(1)}</div>
                            <div class="segment-stat-label">Rate (wps)</div>
                        </div>
                        <div class="segment-stat">
                            <div class="segment-stat-value">${Math.round((segment.intensity || 0) * 100)}</div>
                            <div class="segment-stat-label">Intensity %</div>
                        </div>
                    </div>
                `;
                speechSegmentsList.appendChild(segmentItem);
            });

            this.log(`✅ Updated speech segments list with ${speechSegments.length} segments`, 'success');

        } catch (error) {
            this.log(`❌ Failed to update speech segments list: ${error.message}`, 'error');
        }
    }

    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return '0:00';
        }
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Clear rhythm results and return to empty state
     */
    clearRhythmResults() {
        try {
            const rhythmResults = document.getElementById('rhythmResults');
            const rhythmEmptyState = document.getElementById('rhythmEmptyState');

            if (rhythmResults) {
                rhythmResults.style.display = 'none';
            }

            if (rhythmEmptyState) {
                rhythmEmptyState.style.display = 'block';
            }

            this.log('✅ Rhythm results cleared', 'success');

        } catch (error) {
            this.log(`❌ Failed to clear rhythm results: ${error.message}`, 'error');
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RhythmIntegration = RhythmIntegration;
}