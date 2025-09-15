/**
 * AI-Enhanced Silence Detection UI
 * Modern, intuitive interface with AI insights and smart recommendations
 */

class AIEnhancedSilenceUI {
    constructor(containerId, audioToolsPro) {
        this.container = document.getElementById(containerId);
        this.app = audioToolsPro;
        this.aiDetector = null;
        this.currentResults = null;
        this.isProcessing = false;
        
        this.initializeUI();
        this.setupEventListeners();
    }

    // ========================================
    // UI INITIALIZATION
    // ========================================

    initializeUI() {
        if (!this.container) {
            console.error('Container not found for AIEnhancedSilenceUI');
            return;
        }

        this.container.innerHTML = `
            <div class="ai-enhanced-silence-ui">
                <!-- Header Section -->
                <div class="ui-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h2><i class="fas fa-robot"></i> AI-Enhanced Silence Detection</h2>
                            <p class="header-subtitle">Intelligent audio analysis with AI-powered insights</p>
                        </div>
                        <div class="header-right">
                            <div class="ai-status-indicator">
                                <div class="status-dot" id="aiStatusDot"></div>
                                <span class="status-text" id="aiStatusText">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Control Panel -->
                <div class="main-control-panel">
                    <div class="control-section">
                        <div class="section-header">
                            <h3><i class="fas fa-cog"></i> Detection Settings</h3>
                            <div class="settings-toggle">
                                <button class="toggle-btn" id="advancedSettingsToggle">
                                    <i class="fas fa-sliders-h"></i> Advanced
                                </button>
                            </div>
                        </div>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <label for="silenceThreshold">Silence Threshold</label>
                                <div class="input-group">
                                    <input type="range" id="silenceThreshold" min="-60" max="-10" value="-30" step="1">
                                    <span class="value-display" id="thresholdValue">-30 dB</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="minSilenceDuration">Minimum Duration</label>
                                <div class="input-group">
                                    <input type="range" id="minSilenceDuration" min="0.1" max="5.0" value="0.5" step="0.1">
                                    <span class="value-display" id="durationValue">0.5s</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="aiConfidenceThreshold">AI Confidence</label>
                                <div class="input-group">
                                    <input type="range" id="aiConfidenceThreshold" min="0.5" max="1.0" value="0.7" step="0.05">
                                    <span class="value-display" id="confidenceValue">70%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="advanced-settings" id="advancedSettings" style="display: none;">
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <label for="whisperModel">Whisper Model</label>
                                    <select id="whisperModel">
                                        <option value="whisper-1">Whisper-1 (Fast)</option>
                                        <option value="whisper-2">Whisper-2 (Accurate)</option>
                                    </select>
                                </div>
                                
                                <div class="setting-item">
                                    <label for="analysisMode">Analysis Mode</label>
                                    <select id="analysisMode">
                                        <option value="balanced">Balanced (Recommended)</option>
                                        <option value="fast">Fast (Less Accurate)</option>
                                        <option value="thorough">Thorough (Most Accurate)</option>
                                    </select>
                                </div>
                                
                                <div class="setting-item">
                                    <label for="autoApplyThreshold">Auto-Apply Threshold</label>
                                    <div class="input-group">
                                        <input type="range" id="autoApplyThreshold" min="0.7" max="1.0" value="0.9" step="0.05">
                                        <span class="value-display" id="autoApplyValue">90%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-section">
                        <div class="primary-actions">
                            <button class="action-btn primary large" id="startAIAnalysis">
                                <div class="btn-content">
                                    <i class="fas fa-robot"></i>
                                    <span class="btn-text">Start AI Analysis</span>
                                    <span class="btn-subtitle">Intelligent silence detection</span>
                                </div>
                                <div class="btn-progress" id="analysisProgress" style="display: none;">
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="progressFill"></div>
                                    </div>
                                    <span class="progress-text" id="progressText">0%</span>
                                </div>
                            </button>
                        </div>
                        
                        <div class="secondary-actions">
                            <button class="action-btn secondary" id="loadMediaBtn">
                                <i class="fas fa-folder-open"></i>
                                <span>Load Media</span>
                            </button>
                            <button class="action-btn secondary" id="previewAudio">
                                <i class="fas fa-play"></i>
                                <span>Preview</span>
                            </button>
                            <button class="action-btn secondary" id="exportResults">
                                <i class="fas fa-download"></i>
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="results-section" id="resultsSection" style="display: none;">
                    <div class="results-header">
                        <h3><i class="fas fa-chart-bar"></i> AI Analysis Results</h3>
                        <div class="results-summary" id="resultsSummary">
                            <!-- Summary will be populated here -->
                        </div>
                    </div>
                    
                    <div class="results-content">
                        <!-- AI Insights Panel -->
                        <div class="ai-insights-panel">
                            <div class="insights-header">
                                <h4><i class="fas fa-lightbulb"></i> AI Insights & Recommendations</h4>
                            </div>
                            <div class="insights-content" id="aiInsights">
                                <!-- AI insights will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Timeline Visualization -->
                        <div class="timeline-panel">
                            <div class="timeline-header">
                                <h4><i class="fas fa-chart-line"></i> Audio Timeline</h4>
                                <div class="timeline-controls">
                                    <button class="timeline-btn" id="zoomIn">
                                        <i class="fas fa-search-plus"></i>
                                    </button>
                                    <button class="timeline-btn" id="zoomOut">
                                        <i class="fas fa-search-minus"></i>
                                    </button>
                                    <button class="timeline-btn" id="fitToWindow">
                                        <i class="fas fa-expand-arrows-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="timeline-container">
                                <div class="timeline-ruler" id="timelineRuler"></div>
                                <div class="timeline-track" id="timelineTrack"></div>
                                <div class="timeline-playhead" id="timelinePlayhead"></div>
                            </div>
                        </div>
                        
                        <!-- Segment Details -->
                        <div class="segments-panel">
                            <div class="segments-header">
                                <h4><i class="fas fa-list"></i> Detected Silence Segments</h4>
                                <div class="segments-actions">
                                    <button class="segments-btn" id="selectAll">
                                        <i class="fas fa-check-square"></i> Select All
                                    </button>
                                    <button class="segments-btn" id="deselectAll">
                                        <i class="fas fa-square"></i> Deselect All
                                    </button>
                                </div>
                            </div>
                            <div class="segments-list" id="segmentsList">
                                <!-- Segments will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Panel -->
                    <div class="action-panel">
                        <div class="action-buttons">
                            <button class="action-btn primary large" id="applySilenceCuts">
                                <div class="btn-content">
                                    <i class="fas fa-cut"></i>
                                    <span class="btn-text">Apply Silence Cuts</span>
                                    <span class="btn-subtitle">Remove selected silence segments</span>
                                </div>
                            </button>
                            
                            <button class="action-btn secondary" id="previewCuts">
                                <i class="fas fa-eye"></i>
                                <span>Preview Cuts</span>
                            </button>
                            
                            <button class="action-btn secondary" id="saveProject">
                                <i class="fas fa-save"></i>
                                <span>Save Project</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="status-bar">
                    <div class="status-left">
                        <span class="status-item" id="currentStatus">Ready</span>
                        <span class="status-separator">•</span>
                        <span class="status-item" id="aiConfidence">AI: Ready</span>
                    </div>
                    <div class="status-right">
                        <span class="status-item" id="processingTime">0ms</span>
                        <span class="status-separator">•</span>
                        <span class="status-item" id="segmentsCount">0 segments</span>
                    </div>
                </div>
            </div>
        `;

        this.initializeComponents();
    }

    // ========================================
    // COMPONENT INITIALIZATION
    // ========================================

    initializeComponents() {
        // Initialize AI detector
        this.aiDetector = new AIEnhancedSilenceDetector(this.app);
        
        // Initialize range sliders
        this.initializeRangeSliders();
        
        // Initialize timeline
        this.initializeTimeline();
        
        // Initialize status indicators
        this.updateAIStatus('ready', 'AI Engine Ready');
    }

    initializeRangeSliders() {
        const sliders = [
            { id: 'silenceThreshold', display: 'thresholdValue', suffix: ' dB', transform: (v) => v },
            { id: 'minSilenceDuration', display: 'durationValue', suffix: 's', transform: (v) => v },
            { id: 'aiConfidenceThreshold', display: 'confidenceValue', suffix: '%', transform: (v) => Math.round(v * 100) },
            { id: 'autoApplyThreshold', display: 'autoApplyValue', suffix: '%', transform: (v) => Math.round(v * 100) }
        ];

        sliders.forEach(slider => {
            const input = document.getElementById(slider.id);
            const display = document.getElementById(slider.display);
            
            if (input && display) {
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    display.textContent = slider.transform(value) + slider.suffix;
                });
            }
        });
    }

    initializeTimeline() {
        // Timeline will be initialized when results are available
        this.timeline = {
            container: document.getElementById('timelineTrack'),
            ruler: document.getElementById('timelineRuler'),
            playhead: document.getElementById('timelinePlayhead'),
            zoom: 1.0,
            duration: 0
        };
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Primary action button
        const startAnalysisBtn = document.getElementById('startAIAnalysis');
        if (startAnalysisBtn) {
            startAnalysisBtn.addEventListener('click', () => this.startAIAnalysis());
        }

        // Advanced settings toggle
        const advancedToggle = document.getElementById('advancedSettingsToggle');
        const advancedSettings = document.getElementById('advancedSettings');
        if (advancedToggle && advancedSettings) {
            advancedToggle.addEventListener('click', () => {
                const isVisible = advancedSettings.style.display !== 'none';
                advancedSettings.style.display = isVisible ? 'none' : 'block';
                advancedToggle.classList.toggle('active', !isVisible);
            });
        }

        // Apply silence cuts
        const applyCutsBtn = document.getElementById('applySilenceCuts');
        if (applyCutsBtn) {
            applyCutsBtn.addEventListener('click', () => this.applySilenceCuts());
        }

        // Preview cuts
        const previewCutsBtn = document.getElementById('previewCuts');
        if (previewCutsBtn) {
            previewCutsBtn.addEventListener('click', () => this.previewCuts());
        }

        // Timeline controls
        this.setupTimelineControls();
        
        // Segment selection
        this.setupSegmentControls();
    }

    setupTimelineControls() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const fitToWindow = document.getElementById('fitToWindow');

        if (zoomIn) zoomIn.addEventListener('click', () => this.zoomTimeline(1.2));
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoomTimeline(0.8));
        if (fitToWindow) fitToWindow.addEventListener('click', () => this.fitTimelineToWindow());
    }

    setupSegmentControls() {
        const selectAll = document.getElementById('selectAll');
        const deselectAll = document.getElementById('deselectAll');

        if (selectAll) selectAll.addEventListener('click', () => this.selectAllSegments());
        if (deselectAll) deselectAll.addEventListener('click', () => this.deselectAllSegments());
    }

    // ========================================
    // MAIN ACTIONS
    // ========================================

    async startAIAnalysis() {
        if (this.isProcessing) {
            this.app.log('⚠️ Analysis already in progress', 'warning');
            return;
        }

        this.isProcessing = true;
        this.updateAIStatus('processing', 'AI Analysis in Progress...');
        this.showProgress(true);
        this.updateProgress(0, 'Initializing...');

        try {
            // Get settings
            const settings = this.getAnalysisSettings();
            
            // Get audio file
            const audioFile = await this.getAudioFile();
            if (!audioFile) {
                throw new Error('No audio file available');
            }

            // Run AI analysis
            const results = await this.aiDetector.detectSilenceWithAI(audioFile, settings);
            
            // Display results
            this.displayResults(results);
            
            this.updateAIStatus('success', 'Analysis Complete');
            this.app.log('✅ AI analysis completed successfully', 'success');
            
        } catch (error) {
            this.updateAIStatus('error', 'Analysis Failed');
            this.app.log(`❌ AI analysis failed: ${error.message}`, 'error');
            this.showErrorMessage(error.message);
        } finally {
            this.isProcessing = false;
            this.showProgress(false);
        }
    }

    async applySilenceCuts() {
        if (!this.currentResults) {
            this.app.log('❌ No results available to apply', 'error');
            return;
        }

        try {
            this.updateAIStatus('processing', 'Applying Silence Cuts...');
            
            // Get selected segments
            const selectedSegments = this.getSelectedSegments();
            if (selectedSegments.length === 0) {
                this.app.log('⚠️ No segments selected', 'warning');
                return;
            }

            // Apply cuts using the main app
            await this.app.applySilenceCuts();
            
            this.updateAIStatus('success', 'Silence Cuts Applied');
            this.app.log('✅ Silence cuts applied successfully', 'success');
            
        } catch (error) {
            this.updateAIStatus('error', 'Failed to Apply Cuts');
            this.app.log(`❌ Failed to apply silence cuts: ${error.message}`, 'error');
        }
    }

    // ========================================
    // RESULTS DISPLAY
    // ========================================

    displayResults(results) {
        this.currentResults = results;
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }

        // Update summary
        this.updateResultsSummary(results);
        
        // Display AI insights
        this.displayAIInsights(results);
        
        // Render timeline
        this.renderTimeline(results);
        
        // Display segments
        this.displaySegments(results);
        
        // Update status
        this.updateStatusBar(results);
    }

    updateResultsSummary(results) {
        const summary = document.getElementById('resultsSummary');
        if (!summary) return;

        const metadata = results.metadata;
        const confidence = Math.round(metadata.aiConfidence * 100);
        const quality = Math.round(metadata.audioQuality * 100);

        summary.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-icon">
                        <i class="fas fa-volume-mute"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${metadata.totalSegments}</div>
                        <div class="card-label">Silence Segments</div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${this.formatTime(metadata.totalSilenceTime)}</div>
                        <div class="card-label">Total Silence</div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${confidence}%</div>
                        <div class="card-label">AI Confidence</div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <div class="card-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-value">${quality}%</div>
                        <div class="card-label">Audio Quality</div>
                    </div>
                </div>
            </div>
        `;
    }

    displayAIInsights(results) {
        const insights = document.getElementById('aiInsights');
        if (!insights) return;

        const recommendations = results.recommendations || [];
        const confidence = results.confidence;

        let insightsHTML = `
            <div class="insights-grid">
                <div class="insight-card">
                    <div class="insight-header">
                        <i class="fas fa-robot"></i>
                        <h5>AI Confidence Analysis</h5>
                    </div>
                    <div class="insight-content">
                        <div class="confidence-meter">
                            <div class="meter-fill" style="width: ${confidence.overall * 100}%"></div>
                            <span class="meter-text">${Math.round(confidence.overall * 100)}%</span>
                        </div>
                        <p class="insight-text">
                            ${this.getConfidenceDescription(confidence.overall)}
                        </p>
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-header">
                        <i class="fas fa-lightbulb"></i>
                        <h5>AI Recommendations</h5>
                    </div>
                    <div class="insight-content">
                        ${recommendations.map(rec => `
                            <div class="recommendation-item ${rec.priority}">
                                <i class="fas fa-${this.getRecommendationIcon(rec.type)}"></i>
                                <span>${rec.message}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        insights.innerHTML = insightsHTML;
    }

    renderTimeline(results) {
        const track = document.getElementById('timelineTrack');
        const ruler = document.getElementById('timelineRuler');
        
        if (!track || !ruler) return;

        const segments = results.silenceSegments;
        const duration = this.getAudioDuration();
        
        // Clear existing content
        track.innerHTML = '';
        ruler.innerHTML = '';
        
        // Create ruler
        this.createTimelineRuler(ruler, duration);
        
        // Create audio track
        const audioTrack = document.createElement('div');
        audioTrack.className = 'audio-track';
        track.appendChild(audioTrack);
        
        // Add silence segments
        segments.forEach((segment, index) => {
            const segmentElement = this.createTimelineSegment(segment, index, duration);
            track.appendChild(segmentElement);
        });
    }

    displaySegments(results) {
        const segmentsList = document.getElementById('segmentsList');
        if (!segmentsList) return;

        const segments = results.silenceSegments;
        
        segmentsList.innerHTML = segments.map((segment, index) => `
            <div class="segment-item" data-index="${index}">
                <div class="segment-checkbox">
                    <input type="checkbox" id="segment-${index}" checked>
                    <label for="segment-${index}"></label>
                </div>
                
                <div class="segment-info">
                    <div class="segment-time">
                        <span class="start-time">${this.formatTime(segment.start)}</span>
                        <span class="time-separator">→</span>
                        <span class="end-time">${this.formatTime(segment.end)}</span>
                        <span class="duration">(${this.formatTime(segment.duration)})</span>
                    </div>
                    <div class="segment-details">
                        <span class="confidence">${Math.round(segment.finalConfidence * 100)}% confidence</span>
                        <span class="recommendation">${this.getRecommendationText(segment.aiRecommendation)}</span>
                    </div>
                </div>
                
                <div class="segment-actions">
                    <button class="segment-btn" onclick="this.previewSegment(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="segment-btn" onclick="this.editSegment(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    getAnalysisSettings() {
        return {
            threshold: parseFloat(document.getElementById('silenceThreshold')?.value || -30),
            minDuration: parseFloat(document.getElementById('minSilenceDuration')?.value || 0.5),
            confidenceThreshold: parseFloat(document.getElementById('aiConfidenceThreshold')?.value || 0.7),
            whisperModel: document.getElementById('whisperModel')?.value || 'whisper-1',
            analysisMode: document.getElementById('analysisMode')?.value || 'balanced',
            autoApplyThreshold: parseFloat(document.getElementById('autoApplyThreshold')?.value || 0.9)
        };
    }

    async getAudioFile() {
        // Try to get audio from current app state
        if (this.app.currentAudioBlob) {
            return this.app.currentAudioBlob;
        }
        
        if (this.app.currentAudioPath) {
            const response = await fetch(this.app.currentAudioPath);
            return await response.blob();
        }
        
        return null;
    }

    getSelectedSegments() {
        if (!this.currentResults) return [];
        
        const checkboxes = document.querySelectorAll('.segment-item input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => {
            const index = parseInt(cb.id.split('-')[1]);
            return this.currentResults.silenceSegments[index];
        });
    }

    selectAllSegments() {
        const checkboxes = document.querySelectorAll('.segment-item input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }

    deselectAllSegments() {
        const checkboxes = document.querySelectorAll('.segment-item input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }

    updateAIStatus(status, message) {
        const statusDot = document.getElementById('aiStatusDot');
        const statusText = document.getElementById('aiStatusText');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
    }

    showProgress(show) {
        const progress = document.getElementById('analysisProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = text || `${percentage}%`;
        }
    }

    updateStatusBar(results) {
        const processingTime = document.getElementById('processingTime');
        const segmentsCount = document.getElementById('segmentsCount');
        const aiConfidence = document.getElementById('aiConfidence');
        
        if (processingTime && results.metadata) {
            processingTime.textContent = `${Math.round(results.metadata.duration * 1000)}ms`;
        }
        
        if (segmentsCount && results.metadata) {
            segmentsCount.textContent = `${results.metadata.totalSegments} segments`;
        }
        
        if (aiConfidence && results.metadata) {
            aiConfidence.textContent = `AI: ${Math.round(results.metadata.aiConfidence * 100)}%`;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 100);
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        } else {
            return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}`;
        }
    }

    getConfidenceDescription(confidence) {
        if (confidence >= 0.9) return 'Excellent confidence - Auto-apply recommended';
        if (confidence >= 0.7) return 'Good confidence - Review and apply';
        if (confidence >= 0.5) return 'Moderate confidence - Manual review suggested';
        return 'Low confidence - Manual review required';
    }

    getRecommendationIcon(type) {
        const icons = {
            'auto_apply': 'check-circle',
            'review_apply': 'eye',
            'manual_review': 'exclamation-triangle',
            'quality_warning': 'exclamation-circle',
            'segment_count': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getRecommendationText(recommendation) {
        const texts = {
            'auto_apply': 'Auto-apply',
            'review_apply': 'Review & apply',
            'manual_review': 'Manual review'
        };
        return texts[recommendation] || 'Review';
    }

    createTimelineRuler(ruler, duration) {
        const intervals = this.calculateTimelineIntervals(duration);
        
        intervals.forEach(interval => {
            const tick = document.createElement('div');
            tick.className = 'timeline-tick';
            tick.style.left = `${(interval.time / duration) * 100}%`;
            tick.innerHTML = `
                <div class="tick-line"></div>
                <div class="tick-label">${this.formatTime(interval.time)}</div>
            `;
            ruler.appendChild(tick);
        });
    }

    calculateTimelineIntervals(duration) {
        const intervals = [];
        let interval = 1; // Start with 1 second intervals
        
        // Adjust interval based on duration
        if (duration > 300) interval = 30; // 30 seconds for long audio
        else if (duration > 60) interval = 10; // 10 seconds for medium audio
        else if (duration > 10) interval = 5; // 5 seconds for short audio
        
        for (let time = 0; time <= duration; time += interval) {
            intervals.push({ time });
        }
        
        return intervals;
    }

    createTimelineSegment(segment, index, duration) {
        const segmentElement = document.createElement('div');
        segmentElement.className = 'timeline-segment silence-segment';
        segmentElement.style.left = `${(segment.start / duration) * 100}%`;
        segmentElement.style.width = `${((segment.end - segment.start) / duration) * 100}%`;
        segmentElement.dataset.index = index;
        
        segmentElement.innerHTML = `
            <div class="segment-content">
                <div class="segment-label">${this.formatTime(segment.duration)}</div>
                <div class="segment-confidence">${Math.round(segment.finalConfidence * 100)}%</div>
            </div>
        `;
        
        return segmentElement;
    }

    zoomTimeline(factor) {
        this.timeline.zoom *= factor;
        // Implement timeline zoom logic
    }

    fitTimelineToWindow() {
        this.timeline.zoom = 1.0;
        // Implement fit to window logic
    }

    getAudioDuration() {
        return this.app.audioPlayer ? this.app.audioPlayer.duration : 0;
    }

    showErrorMessage(message) {
        // Show error message in UI
        this.app.showUIMessage(`❌ ${message}`, 'error');
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEnhancedSilenceUI;
} else if (typeof window !== 'undefined') {
    window.AIEnhancedSilenceUI = AIEnhancedSilenceUI;
    console.log('🎨 AIEnhancedSilenceUI loaded and available globally');
}
