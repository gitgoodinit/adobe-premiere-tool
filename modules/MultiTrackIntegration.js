/**
 * MultiTrackIntegration Module
 * Handles all API interactions for multitrack processing with the backend
 * Replaces frontend processing with backend API calls
 */

class MultiTrackIntegration {
    constructor(audioToolsPro) {
        this.audioToolsPro = audioToolsPro;
        this.baseURL = this.getBackendURL();
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Request tracking
        this.activeRequests = new Map();
        this.requestHistory = [];
        
        this.log('🔗 MultiTrack Integration module initialized', 'info');
    }

    /**
     * Get backend URL from configuration or environment
     */
    getBackendURL() {
        // Use centralized environment configuration
        if (window.envConfig) {
            return window.envConfig.getApiEndpoint('multitrack');
        }
        
        // Fallback for when envConfig is not available
        const storedPort = localStorage.getItem('audioToolsBackendPort');
        const port = storedPort || '3000';
        return `http://localhost:${port}/api/multitrack`;
    }

    /**
     * Analyze multiple audio tracks for silence, overlaps, and sync
     * @param {Map} tracks - Map of track data from multiTrackConfig.tracks
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeTracks(tracks, options = {}) {
        try {
            this.log('🔍 Starting multitrack analysis via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🔍 Sending tracks to backend for analysis...', 'processing');

            // Validate tracks
            if (!tracks || tracks.size < 2) {
                throw new Error('At least 2 tracks required for analysis');
            }

            // Prepare FormData for upload
            const formData = new FormData();
            const trackArray = Array.from(tracks.values());

            // Add audio files
            for (let i = 0; i < trackArray.length; i++) {
                const track = trackArray[i];
                const audioBlob = this.audioToolsPro.multiTrackConfig.loadedFiles.get(track.id);
                
                if (audioBlob) {
                    this.log(`📦 Adding track ${i}: ${track.name} (${audioBlob.size} bytes, ${audioBlob.type})`, 'info');
                    formData.append('audio', audioBlob, track.name);
                } else {
                    this.log(`⚠️ No audio blob found for track: ${track.name}`, 'warning');
                }
            }
            
            this.log(`📤 Prepared FormData with ${trackArray.length} audio files`, 'info');

            // Add analysis options
            formData.append('analysisTypes', JSON.stringify(options.analysisTypes || ['silence', 'overlap', 'sync']));
            formData.append('trackTypes', JSON.stringify(trackArray.map(t => t.type || 'audio')));
            formData.append('submixRouting', options.submixRouting || 'auto');
            formData.append('silenceThreshold', options.silenceThreshold || -30);
            formData.append('overlapThreshold', options.overlapThreshold || 0.3);
            formData.append('syncTolerance', options.syncTolerance || 0.1);
            formData.append('enableRealTimeProcessing', options.enableRealTimeProcessing !== false);
            formData.append('enableSubmixRouting', options.enableSubmixRouting !== false);

            // Make API request
            const response = await this.makeRequest('/analyze', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Multitrack analysis completed successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Backend analysis completed!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Multitrack analysis failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Analysis failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Sync multiple audio tracks
     * @param {Map} tracks - Map of track data
     * @param {Object} options - Sync options
     * @returns {Promise<Object>} Sync results
     */
    async syncTracks(tracks, options = {}) {
        try {
            this.log('🔄 Starting multitrack sync via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🔄 Syncing tracks via backend...', 'processing');

            if (!tracks || tracks.size < 2) {
                throw new Error('At least 2 tracks required for sync');
            }

            const formData = new FormData();
            const trackArray = Array.from(tracks.values());

            // Add audio files
            for (let i = 0; i < trackArray.length; i++) {
                const track = trackArray[i];
                const audioBlob = this.audioToolsPro.multiTrackConfig.loadedFiles.get(track.id);
                
                if (audioBlob) {
                    formData.append('audio', audioBlob, track.name);
                }
            }

            // Add sync options
            formData.append('syncMethod', options.syncMethod || 'auto');
            formData.append('referenceTrack', options.referenceTrack || 0);
            formData.append('syncTolerance', options.syncTolerance || 0.1);
            formData.append('manualOffsets', JSON.stringify(options.manualOffsets || []));
            formData.append('enableMultiCamSync', options.enableMultiCamSync || false);
            formData.append('outputFormat', options.outputFormat || 'mp3');
            formData.append('quality', options.quality || 'high');

            const response = await this.makeRequest('/sync', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Multitrack sync completed successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Tracks synced successfully!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Multitrack sync failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Sync failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Configure dynamic ducking for multiple tracks
     * @param {Map} tracks - Map of track data
     * @param {Object} options - Ducking options
     * @returns {Promise<Object>} Ducking results
     */
    async configureDucking(tracks, options = {}) {
        try {
            this.log('🔇 Starting dynamic ducking via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🔇 Configuring dynamic ducking...', 'processing');

            if (!tracks || tracks.size < 2) {
                throw new Error('At least 2 tracks required for ducking');
            }

            const formData = new FormData();
            const trackArray = Array.from(tracks.values());

            // Add audio files
            for (let i = 0; i < trackArray.length; i++) {
                const track = trackArray[i];
                const audioBlob = this.audioToolsPro.multiTrackConfig.loadedFiles.get(track.id);
                
                if (audioBlob) {
                    formData.append('audio', audioBlob, track.name);
                }
            }

            // Add ducking options
            formData.append('primaryTrack', options.primaryTrack || 0);
            formData.append('secondaryTracks', JSON.stringify(options.secondaryTracks || []));
            formData.append('duckingRatio', options.duckingRatio || 0.3);
            formData.append('attackTime', options.attackTime || 0.01);
            formData.append('releaseTime', options.releaseTime || 0.1);
            formData.append('threshold', options.threshold || -20);
            formData.append('enableAutoDucking', options.enableAutoDucking !== false);
            formData.append('outputFormat', options.outputFormat || 'mp3');
            formData.append('quality', options.quality || 'high');

            const response = await this.makeRequest('/ducking', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Dynamic ducking configured successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Dynamic ducking applied!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Dynamic ducking failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Ducking failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Configure submix routing for multiple tracks
     * @param {Map} tracks - Map of track data
     * @param {Object} options - Submix options
     * @returns {Promise<Object>} Submix results
     */
    async configureSubmixRouting(tracks, options = {}) {
        try {
            this.log('🎚️ Starting submix routing via backend API...', 'info');
            this.audioToolsPro.showUIMessage('🎚️ Configuring submix routing...', 'processing');

            if (!tracks || tracks.size === 0) {
                throw new Error('No tracks available for submix routing');
            }

            const formData = new FormData();
            const trackArray = Array.from(tracks.values());

            // Add audio files
            for (let i = 0; i < trackArray.length; i++) {
                const track = trackArray[i];
                const audioBlob = this.audioToolsPro.multiTrackConfig.loadedFiles.get(track.id);
                
                if (audioBlob) {
                    formData.append('audio', audioBlob, track.name);
                }
            }

            // Add submix options
            const defaultSubmixGroups = {
                main: { tracks: [], gain: 1.0 },
                speech: { tracks: [], gain: 1.0 },
                music: { tracks: [], gain: 1.0 },
                effects: { tracks: [], gain: 1.0 }
            };

            formData.append('submixGroups', JSON.stringify(options.submixGroups || defaultSubmixGroups));
            formData.append('trackAssignments', JSON.stringify(options.trackAssignments || []));
            formData.append('enableAutoRouting', options.enableAutoRouting !== false);
            formData.append('outputFormat', options.outputFormat || 'mp3');
            formData.append('quality', options.quality || 'high');

            const response = await this.makeRequest('/submix', {
                method: 'POST',
                body: formData
            });

            this.log('✅ Submix routing configured successfully', 'success');
            this.audioToolsPro.showUIMessage('✅ Submix routing applied!', 'success');

            return response;

        } catch (error) {
            this.log(`❌ Submix routing failed: ${error.message}`, 'error');
            this.audioToolsPro.showUIMessage(`❌ Submix routing failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get backend capabilities
     * @returns {Promise<Object>} Capabilities object
     */
    async getCapabilities() {
        try {
            this.log('📋 Fetching backend capabilities...', 'info');

            const response = await this.makeRequest('/capabilities', {
                method: 'GET'
            });

            this.log('✅ Backend capabilities retrieved', 'success');
            return response;

        } catch (error) {
            this.log(`❌ Failed to get capabilities: ${error.message}`, 'error');
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
     * Make HTTP request with retry logic and error handling
     * @private
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`🌐 Making request to: ${url} (attempt ${attempt}/${this.maxRetries})`, 'info');

                // Check if backend is running
                if (attempt === 1) {
                    await this.checkBackendHealth();
                }

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        // Don't set Content-Type for FormData - let browser set it
                        ...options.headers
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

                const result = await response.json();
                
                // Track successful request
                this.requestHistory.push({
                    url,
                    method: options.method || 'GET',
                    timestamp: Date.now(),
                    success: true
                });

                return result;

            } catch (error) {
                lastError = error;
                this.log(`❌ Request attempt ${attempt} failed: ${error.message}`, 'error');

                // Track failed request
                this.requestHistory.push({
                    url,
                    method: options.method || 'GET',
                    timestamp: Date.now(),
                    success: false,
                    error: error.message
                });

                // Don't retry for certain errors
                if (error.message.includes('HTTP 400') || error.message.includes('HTTP 404')) {
                    break;
                }

                // Wait before retry
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * Check if backend is running
     * @private
     */
    async checkBackendHealth() {
        try {
            const healthUrl = this.baseURL.replace('/multitrack', '/health');
            const response = await fetch(healthUrl, { method: 'GET' });
            
            if (!response.ok) {
                throw new Error('Backend health check failed');
            }
            
            this.log('✅ Backend health check passed', 'info');
            
        } catch (error) {
            this.log('❌ Backend appears to be offline. Please start the backend server.', 'error');
            this.audioToolsPro.showUIMessage('❌ Backend server offline. Please start the backend server and try again.', 'error');
            throw new Error('Backend server is not running. Please start the server and try again.');
        }
    }

    /**
     * Utility delay function
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get request statistics
     */
    getRequestStats() {
        const total = this.requestHistory.length;
        const successful = this.requestHistory.filter(req => req.success).length;
        const failed = total - successful;

        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0.0',
            recentRequests: this.requestHistory.slice(-10) // Last 10 requests
        };
    }

    /**
     * Clear request history
     */
    clearRequestHistory() {
        this.requestHistory = [];
        this.log('🧹 Request history cleared', 'info');
    }

    /**
     * Update UI with track visualization
     * @param {Map} tracks - Loaded tracks
     */
    updateTracksVisualization(tracks) {
        try {
            const multiTrackVisualization = document.getElementById('multiTrackVisualization');
            const tracksContainer = document.getElementById('tracksContainer');
            const loadedTrackCount = document.getElementById('loadedTrackCount');

            if (!multiTrackVisualization || !tracksContainer) {
                this.log('⚠️ Multi-track visualization container not found', 'warning');
                return;
            }

            // Show visualization container
            multiTrackVisualization.style.display = 'block';
            
            // Update track count
            if (loadedTrackCount) {
                loadedTrackCount.textContent = tracks.size;
            }

            // Clear existing tracks
            tracksContainer.innerHTML = '';

            // Add track items
            tracks.forEach((track, trackId) => {
                const trackItem = document.createElement('div');
                trackItem.className = 'track-item';
                trackItem.innerHTML = `
                    <div class="track-info">
                        <div class="track-icon">
                            <i class="fas fa-volume-up"></i>
                        </div>
                        <div class="track-details">
                            <h5>${track.name}</h5>
                            <p>${this.formatDuration(track.duration)} • ${track.channels} ch • ${track.sampleRate} Hz</p>
                        </div>
                    </div>
                    <div class="track-status-badge">Loaded</div>
                `;
                tracksContainer.appendChild(trackItem);
            });

            this.log(`✅ Updated visualization for ${tracks.size} tracks`, 'success');

        } catch (error) {
            this.log(`❌ Failed to update tracks visualization: ${error.message}`, 'error');
        }
    }

    /**
     * Update tracks with silence detection results
     * @param {Object} results - Silence analysis results from backend
     */
    updateTracksWithSilenceResults(results) {
        try {
            this.log('📊 Updating tracks with silence results...', 'info');

            // Accept either a wrapped API response (with .results) or a bare object
            const payload = results && results.results ? results.results : results || {};

            // Normalize to a flat list of silence segments and a total duration
            let totalSilenceDuration = payload.totalSilenceDuration || 0;
            let silenceSegments = payload.silenceSegments || [];

            // If backend returned per-track analysis, flatten it
            if ((!silenceSegments || silenceSegments.length === 0) && payload.silenceAnalysis) {
                const flattened = [];
                let runningTotal = 0;
                let trackIndex = 0;
                Object.keys(payload.silenceAnalysis).forEach((trackKey) => {
                    const track = payload.silenceAnalysis[trackKey];
                    const segments = Array.isArray(track.segments) ? track.segments : [];
                    segments.forEach((seg) => {
                        const start = seg.start ?? seg.startTime ?? 0;
                        const end = seg.end ?? seg.endTime ?? (start + (seg.duration || 0));
                        const duration = seg.duration ?? Math.max(0, end - start);
                        flattened.push({ start, end, duration, trackIndex });
                        runningTotal += duration;
                    });
                    trackIndex += 1;
                });
                silenceSegments = flattened;
                if (!totalSilenceDuration) totalSilenceDuration = runningTotal;
            }

            // Update the UI container visibility first
            this.showMultitrackResults('silence', { silenceSegments, totalSilenceDuration });

            // Update summary values
            const totalSilenceFound = document.getElementById('totalSilenceFound');
            const silenceSegmentCount = document.getElementById('silenceSegmentCount');
            const silenceDetailsList = document.getElementById('silenceDetailsList');

            if (totalSilenceFound) {
                const total = typeof totalSilenceDuration === 'number' ? totalSilenceDuration : 0;
                totalSilenceFound.textContent = `${total.toFixed(2)}s`;
            }

            if (silenceSegmentCount) {
                silenceSegmentCount.textContent = silenceSegments ? silenceSegments.length : 0;
            }

            // Add silence segment details
            if (silenceDetailsList) {
                silenceDetailsList.innerHTML = '';
                (silenceSegments || []).forEach((segment) => {
                    const segmentItem = document.createElement('div');
                    segmentItem.className = 'result-item';
                    segmentItem.innerHTML = `
                        <div class="segment-time">${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}</div>
                        <div class="segment-duration">${(segment.duration).toFixed(2)}s</div>
                        <div class="segment-track">Track ${(segment.trackIndex ?? 0) + 1}</div>
                    `;
                    silenceDetailsList.appendChild(segmentItem);
                });
            }

            this.log(`✅ Silence results updated (${(silenceSegments || []).length} segments)`, 'success');

        } catch (error) {
            this.log(`❌ Failed to update silence results: ${error.message}`, 'error');
        }
    }

    /**
     * Update tracks with overlap detection results
     * @param {Object} results - Overlap analysis results from backend
     */
    updateTracksWithOverlapResults(results) {
        try {
            this.log('📊 Updating tracks with overlap results...', 'info');

            const payload = results && results.results ? results.results : results || {};

            // Normalize overlaps to a flat list
            let overlaps = payload.overlaps || [];
            if ((!overlaps || overlaps.length === 0) && payload.overlapAnalysis) {
                const flattened = [];
                Object.values(payload.overlapAnalysis).forEach((pair) => {
                    const pairOverlaps = Array.isArray(pair.overlaps) ? pair.overlaps : [];
                    pairOverlaps.forEach((o) => {
                        const start = o.start ?? o.startTime ?? 0;
                        const end = o.end ?? o.endTime ?? (start + (o.duration || 0));
                        const intensity = typeof o.intensity === 'number' ? o.intensity : 0.5;
                        const tracks = [pair.track1, pair.track2].filter(Boolean);
                        flattened.push({ start, end, intensity, tracks });
                    });
                });
                overlaps = flattened;
            }

            this.showMultitrackResults('overlap', { overlaps });

            // Update summary values
            const totalOverlapsFound = document.getElementById('totalOverlapsFound');
            const syncIssuesFound = document.getElementById('syncIssuesFound');
            const overlapDetailsList = document.getElementById('overlapDetailsList');

            if (totalOverlapsFound) {
                totalOverlapsFound.textContent = overlaps ? overlaps.length : 0;
            }

            if (syncIssuesFound) {
                // Not available from backend yet; default to 0
                syncIssuesFound.textContent = payload.syncIssues?.length || 0;
            }

            // Add overlap details
            if (overlapDetailsList) {
                overlapDetailsList.innerHTML = '';
                (overlaps || []).forEach((overlap) => {
                    const overlapItem = document.createElement('div');
                    overlapItem.className = 'result-item';
                    overlapItem.innerHTML = `
                        <div class="overlap-time">${this.formatTime(overlap.start)} - ${this.formatTime(overlap.end)}</div>
                        <div class="overlap-tracks">${Array.isArray(overlap.tracks) ? overlap.tracks.join(' vs ') : ''}</div>
                        <div class="overlap-severity">${((overlap.intensity || 0) * 100).toFixed(1)}%</div>
                    `;
                    overlapDetailsList.appendChild(overlapItem);
                });
            }

            this.log(`✅ Overlap results updated (${(overlaps || []).length} overlaps)`, 'success');

        } catch (error) {
            this.log(`❌ Failed to update overlap results: ${error.message}`, 'error');
        }
    }

    /**
     * Update tracks with auto-trim results
     * @param {Object} results - Auto-trim results from backend
     */
    updateTracksWithTrimResults(results) {
        try {
            this.log('📊 Updating tracks with trim results...', 'info');
            this.showMultitrackResults('trim', results);
            
            // Update summary values
            const totalTimeTrimmed = document.getElementById('totalTimeTrimmed');
            const trimSegmentCount = document.getElementById('trimSegmentCount');
            const trimDetailsList = document.getElementById('trimDetailsList');

            if (totalTimeTrimmed && results.totalTrimmed) {
                totalTimeTrimmed.textContent = `${results.totalTrimmed.toFixed(2)}s`;
            }

            if (trimSegmentCount && results.trimSegments) {
                trimSegmentCount.textContent = results.trimSegments.length;
            }

            // Add trim details
            if (trimDetailsList && results.trimSegments) {
                trimDetailsList.innerHTML = '';
                results.trimSegments.forEach(segment => {
                    const trimItem = document.createElement('div');
                    trimItem.className = 'result-item';
                    trimItem.innerHTML = `
                        <div class="trim-range">${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}</div>
                        <div class="trim-duration">${segment.duration.toFixed(2)}s removed</div>
                        <div class="trim-track">Track ${segment.trackIndex + 1}</div>
                    `;
                    trimDetailsList.appendChild(trimItem);
                });
            }

        } catch (error) {
            this.log(`❌ Failed to update trim results: ${error.message}`, 'error');
        }
    }

    /**
     * Update tracks with ducking results
     * @param {Object} results - Ducking results from backend
     */
    updateTracksWithDuckingResults(results) {
        try {
            this.log('📊 Updating tracks with ducking results...', 'info');
            this.showMultitrackResults('ducking', results);
            
            // Update summary values
            const duckingApplied = document.getElementById('duckingApplied');
            const duckingTracksCount = document.getElementById('duckingTracksCount');
            const duckingDetailsList = document.getElementById('duckingDetailsList');

            if (duckingApplied && results.applied) {
                duckingApplied.textContent = results.applied ? 'Yes' : 'No';
            }

            if (duckingTracksCount && results.affectedTracks) {
                duckingTracksCount.textContent = results.affectedTracks.length;
            }

            // Add ducking details
            if (duckingDetailsList && results.duckingEvents) {
                duckingDetailsList.innerHTML = '';
                results.duckingEvents.forEach(event => {
                    const duckingItem = document.createElement('div');
                    duckingItem.className = 'result-item';
                    duckingItem.innerHTML = `
                        <div class="ducking-time">${this.formatTime(event.start)} - ${this.formatTime(event.end)}</div>
                        <div class="ducking-reduction">${(event.reduction * 100).toFixed(1)}% reduction</div>
                        <div class="ducking-tracks">Tracks ${event.tracks.join(', ')}</div>
                    `;
                    duckingDetailsList.appendChild(duckingItem);
                });
            }

        } catch (error) {
            this.log(`❌ Failed to update ducking results: ${error.message}`, 'error');
        }
    }

    /**
     * Show multitrack results panel with specific tab
     * @param {string} tabName - Tab to show ('silence', 'overlap', 'trim', 'ducking')
     * @param {Object} results - Results data
     */
    showMultitrackResults(tabName, results) {
        try {
            const multitrackResults = document.getElementById('multitrackResults');
            const resultTabs = document.querySelectorAll('.result-tab');
            const resultPanels = document.querySelectorAll('.result-panel');

            if (!multitrackResults) {
                this.log('⚠️ Multitrack results container not found', 'warning');
                return;
            }

            // Show results panel
            multitrackResults.style.display = 'block';

            // Switch to specific tab
            resultTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });

            resultPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === `${tabName}Results`);
            });

            this.log(`✅ Showing results for: ${tabName}`, 'success');

        } catch (error) {
            this.log(`❌ Failed to show results: ${error.message}`, 'error');
        }
    }

    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format duration for display
     * @param {number} duration - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(duration) {
        if (duration < 60) {
            return `${duration.toFixed(1)}s`;
        } else if (duration < 3600) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        }
    }

    /**
     * Setup result tab switching functionality
     */
    setupResultTabSwitching() {
        try {
            const resultTabs = document.querySelectorAll('.result-tab');
            const resultPanels = document.querySelectorAll('.result-panel');

            resultTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.dataset.tab;

                    // Update tab states
                    resultTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Update panel states
                    resultPanels.forEach(panel => {
                        panel.classList.toggle('active', panel.id === `${tabName}Results`);
                    });
                });
            });

            // Setup clear results button
            const clearMultitrackResults = document.getElementById('clearMultitrackResults');
            if (clearMultitrackResults) {
                clearMultitrackResults.addEventListener('click', () => {
                    const multitrackResults = document.getElementById('multitrackResults');
                    if (multitrackResults) {
                        multitrackResults.style.display = 'none';
                    }
                });
            }

            this.log('✅ Result tab switching setup complete', 'success');

        } catch (error) {
            this.log(`❌ Failed to setup result tabs: ${error.message}`, 'error');
        }
    }

    /**
     * Log helper method
     * @private
     */
    log(message, level = 'info') {
        if (this.audioToolsPro && this.audioToolsPro.log) {
            this.audioToolsPro.log(message, level);
        } else {
            console.log(`[MultiTrackIntegration] ${message}`);
        }
    }
}

// Export for use in index.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiTrackIntegration;
} else {
    window.MultiTrackIntegration = MultiTrackIntegration;
}