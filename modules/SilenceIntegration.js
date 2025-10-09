/**
 * Silence Integration Module
 * Handles communication with the backend Silence API
 * Provides methods for silence detection and trimming operations
 */

class SilenceIntegration {
    constructor(parentApp) {
        this.parentApp = parentApp;
        this.baseUrl = this.getBaseUrl();
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    getBaseUrl() {
        if (window.envConfig) {
            return window.envConfig.getApiEndpoint('silence');
        }
        
        // Fallback for when envConfig is not available
        const storedPort = localStorage.getItem('audioToolsBackendPort');
        const port = storedPort || '3000';
        return `http://localhost:${port}/api/silence`;
    }

    /**
     * Test backend connectivity
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/methods`);
            return response.ok;
        } catch (error) {
            console.error('Backend silence connection test failed:', error);
            return false;
        }
    }

    /**
     * Get available silence detection methods
     */
    async getDetectionMethods() {
        try {
            this.parentApp.log('🔍 Fetching available silence detection methods...', 'info');
            
            const response = await this.makeRequest('/methods', {
                method: 'GET'
            });

            if (response.success) {
                this.parentApp.log(`✅ Retrieved ${response.methods.length} detection methods`, 'success');
                return response;
            } else {
                throw new Error('Failed to get detection methods');
            }
        } catch (error) {
            this.parentApp.log(`❌ Failed to get detection methods: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Analyze audio for silence segments
     * @param {Blob} audioBlob - The audio file as a Blob
     * @param {Object} options - Analysis options
     */
    async detectSilence(audioBlob, options = {}) {
        try {
            this.parentApp.log('🔍 Starting backend silence detection...', 'info');
            this.parentApp.showUIMessage('🔍 Analyzing audio for silence...', 'processing');

            // Prepare form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.mp3');
            
            // Add detection options
            formData.append('methods', JSON.stringify(options.methods || ['ffmpeg', 'webAudio']));
            formData.append('noiseThreshold', options.noiseThreshold || -30);
            formData.append('minDuration', options.minDuration || 0.5);
            formData.append('confidenceThreshold', options.confidenceThreshold || 0.7);
            formData.append('enableAI', options.enableAI !== false);
            formData.append('enablePreprocessing', options.enablePreprocessing !== false);
            
            if (options.language) {
                formData.append('language', options.language);
            }

            this.parentApp.log(`📋 Detection options: threshold=${options.noiseThreshold}dB, minDuration=${options.minDuration}s`, 'info');

            const response = await this.makeRequest('/detect', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                this.parentApp.log(`✅ Backend silence detection completed in ${response.processingTime}`, 'success');
                this.parentApp.log(`   📊 Found ${response.results.silenceSegments.length} silence segments`, 'info');
                this.parentApp.log(`   🔇 Total silence: ${response.results.totalSilenceDuration.toFixed(2)}s (${response.results.silencePercentage.toFixed(1)}%)`, 'info');
                this.parentApp.log(`   🎯 Confidence: ${(response.results.confidence * 100).toFixed(1)}%`, 'info');

                return response;
            } else {
                throw new Error('Backend silence detection failed');
            }
        } catch (error) {
            this.parentApp.log(`❌ Silence detection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Trim silence from audio file
     * @param {Blob} audioBlob - The audio file as a Blob
     * @param {Array} silenceSegments - Array of silence segments to remove
     * @param {Object} options - Trimming options
     */
    async trimSilence(audioBlob, silenceSegments, options = {}) {
        try {
            this.parentApp.log('✂️ Starting backend silence trimming...', 'info');
            this.parentApp.showUIMessage('✂️ Trimming silence from audio...', 'processing');

            // Prepare form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.mp3');
            formData.append('silenceSegments', JSON.stringify(silenceSegments));
            
            // Add trimming options
            formData.append('trimMode', options.trimMode || 'remove');
            formData.append('fadeInDuration', options.fadeInDuration || 0.1);
            formData.append('fadeOutDuration', options.fadeOutDuration || 0.1);
            formData.append('compressionRatio', options.compressionRatio || 0.5);
            formData.append('outputFormat', options.outputFormat || 'mp3');
            formData.append('quality', options.quality || 'high');

            this.parentApp.log(`✂️ Trimming ${silenceSegments.length} silence segments with ${options.trimMode || 'remove'} mode`, 'info');

            const response = await this.makeRequest('/trim', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                this.parentApp.log(`✅ Backend silence trimming completed in ${response.processingTime}`, 'success');
                this.parentApp.log(`   📄 Original Duration: ${response.originalFile.duration.toFixed(2)}s`, 'info');
                this.parentApp.log(`   📄 Trimmed Duration: ${response.trimmedFile.duration.toFixed(2)}s`, 'info');
                this.parentApp.log(`   ⏱️ Time Saved: ${response.results.timeSaved.toFixed(2)}s`, 'info');
                this.parentApp.log(`   📁 Output File: ${response.trimmedFile.name}`, 'info');

                return response;
            } else {
                throw new Error('Backend silence trimming failed');
            }
        } catch (error) {
            this.parentApp.log(`❌ Silence trimming failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Process multiple audio files for silence detection
     * @param {Array} audioBlobs - Array of audio file Blobs
     * @param {Object} options - Detection options
     */
    async batchDetectSilence(audioBlobs, options = {}) {
        try {
            this.parentApp.log(`🔍 Starting batch silence detection for ${audioBlobs.length} files...`, 'info');
            this.parentApp.showUIMessage(`🔍 Analyzing ${audioBlobs.length} files for silence...`, 'processing');

            // Prepare form data
            const formData = new FormData();
            
            // Add all audio files
            audioBlobs.forEach((blob, index) => {
                formData.append('audio', blob, `audio_${index}.mp3`);
            });
            
            // Add detection options
            formData.append('methods', JSON.stringify(options.methods || ['ffmpeg', 'webAudio']));
            formData.append('noiseThreshold', options.noiseThreshold || -30);
            formData.append('minDuration', options.minDuration || 0.5);
            formData.append('parallel', options.parallel !== false);

            const response = await this.makeRequest('/batch-detect', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                this.parentApp.log(`✅ Batch silence detection completed in ${response.processingTime}`, 'success');
                this.parentApp.log(`   📊 Processed ${response.results.length} files`, 'info');
                
                return response;
            } else {
                throw new Error('Batch silence detection failed');
            }
        } catch (error) {
            this.parentApp.log(`❌ Batch silence detection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get job status for async operations
     * @param {string} requestId - The request ID to check
     */
    async getJobStatus(requestId) {
        try {
            const response = await this.makeRequest(`/status/${requestId}`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            this.parentApp.log(`❌ Failed to get job status: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Test silence detection with a sample file
     */
    async testSilenceDetection() {
        try {
            this.parentApp.log('🧪 Testing backend silence detection...', 'info');

            // Get current audio blob
            const audioBlob = await this.getAudioBlobFromPlayer();
            if (!audioBlob) {
                throw new Error('No audio available for testing');
            }

            const testOptions = {
                methods: ['ffmpeg'],
                noiseThreshold: -35,
                minDuration: 1.0,
                enableAI: false
            };

            const results = await this.detectSilence(audioBlob, testOptions);
            
            this.parentApp.log('✅ Backend silence detection test completed successfully', 'success');
            this.parentApp.showUIMessage('✅ Backend silence detection test passed!', 'success');
            
            return results;
        } catch (error) {
            this.parentApp.log(`❌ Backend silence detection test failed: ${error.message}`, 'error');
            this.parentApp.showUIMessage(`❌ Test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic
     * @private
     */
    async makeRequest(endpoint, options, retryCount = 0) {
        try {
            // Check backend health first
            if (retryCount === 0) {
                const isHealthy = await this.checkBackendHealth();
                if (!isHealthy) {
                    throw new Error('Backend silence service is not available. Please ensure the backend server is running.');
                }
            }

            const url = `${this.baseUrl}${endpoint}`;
            const requestOptions = {
                ...options,
                headers: {
                    ...options.headers
                }
            };

            // Don't set Content-Type for FormData - let browser set it with boundary
            if (options.body instanceof FormData) {
                delete requestOptions.headers['Content-Type'];
            }

            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                this.parentApp.log(`⚠️ Request failed, retrying... (${retryCount + 1}/${this.maxRetries})`, 'warning');
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.makeRequest(endpoint, options, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Check if backend silence service is healthy
     * @private
     */
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/methods`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Determine if error is retryable
     * @private
     */
    shouldRetry(error) {
        // Retry on network errors or server errors (5xx)
        return (
            error.name === 'TypeError' || // Network errors
            error.message.includes('Failed to fetch') ||
            error.message.includes('500') ||
            error.message.includes('502') ||
            error.message.includes('503') ||
            error.message.includes('504')
        );
    }

    /**
     * Delay execution
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get audio blob from the current player
     * @private
     */
    async getAudioBlobFromPlayer() {
        try {
            if (this.parentApp.currentAudioBlob) {
                return this.parentApp.currentAudioBlob;
            }
            
            if (this.parentApp.audioPlayer && this.parentApp.audioPlayer.src) {
                const response = await fetch(this.parentApp.audioPlayer.src);
                return await response.blob();
            }
            
            throw new Error('No audio source available');
        } catch (error) {
            this.parentApp.log(`❌ Failed to get audio blob: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SilenceIntegration;
}