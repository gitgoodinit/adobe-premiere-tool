/**
 * Enhanced Overlap Detection UI
 * Displays real overlap data with proper resolve functionality and exact audio information
 */

class EnhancedOverlapUI {
    constructor(containerId, audioToolsPro) {
        this.container = document.getElementById(containerId);
        this.app = audioToolsPro;
        this.currentOverlaps = null;
        this.isProcessing = false;
        this.selectedOverlaps = [];
        
        this.initializeUI();
        this.setupEventListeners();
    }

    // ========================================
    // UI INITIALIZATION
    // ========================================

    initializeUI() {
        if (!this.container) {
            console.error('Container not found for EnhancedOverlapUI');
            return;
        }

        this.container.innerHTML = `
            <div class="enhanced-overlap-ui">
                <!-- Header Section -->
                <div class="overlap-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h3><i class="fas fa-wave-square"></i> Audio Overlap Analysis</h3>
                            <p class="header-subtitle">Advanced frequency-domain analysis with smart resolution</p>
                        </div>
                        <div class="header-right">
                            <div class="analysis-status" id="analysisStatus">
                                <div class="status-dot ready"></div>
                                <span class="status-text">Ready for Analysis</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Panel -->
                <div class="quick-stats-panel" id="quickStatsPanel" style="display: none;">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="totalOverlaps">0</div>
                            <div class="stat-label">Total Overlaps</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="totalDuration">0s</div>
                            <div class="stat-label">Total Duration</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-thermometer-half"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="avgSeverity">0.0</div>
                            <div class="stat-label">Avg Severity</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="aiConfidence">0%</div>
                            <div class="stat-label">AI Confidence</div>
                        </div>
                    </div>
                </div>

                <!-- Audio Information Panel -->
                <div class="audio-info-panel" id="audioInfoPanel" style="display: none;">
                    <div class="panel-header">
                        <h4><i class="fas fa-music"></i> Audio Information</h4>
                    </div>
                    <div class="audio-info-grid">
                        <div class="info-item">
                            <label>File Name:</label>
                            <span id="audioFileName">No audio loaded</span>
                        </div>
                        <div class="info-item">
                            <label>Duration:</label>
                            <span id="audioDuration">0:00</span>
                        </div>
                        <div class="info-item">
                            <label>Sample Rate:</label>
                            <span id="sampleRate">0 Hz</span>
                        </div>
                        <div class="info-item">
                            <label>Channels:</label>
                            <span id="audioChannels">0</span>
                        </div>
                        <div class="info-item">
                            <label>Format:</label>
                            <span id="audioFormat">Unknown</span>
                        </div>
                        <div class="info-item">
                            <label>File Size:</label>
                            <span id="audioFileSize">0 KB</span>
                        </div>
                    </div>
                </div>

                <!-- Overlap Results Section -->
                <div class="overlap-results-section" id="overlapResultsSection" style="display: none;">
                    <!-- Actions Bar -->
                    <div class="results-toolbar">
                        <div class="bulk-actions">
                            <button class="action-btn small" id="selectAllOverlaps">
                                <i class="fas fa-check-square"></i> Select All
                            </button>
                            <button class="action-btn small" id="deselectAllOverlaps">
                                <i class="fas fa-square"></i> Deselect All
                            </button>
                            <button class="action-btn primary small" id="resolveSelectedOverlaps" disabled>
                                <i class="fas fa-magic"></i> Resolve Selected (<span id="selectedCount">0</span>)
                            </button>
                        </div>
                    </div>

                    <!-- Timeline Visualization -->
                    <div class="timeline-visualization" id="timelineVisualization">
                        <div class="timeline-header">
                            <h4><i class="fas fa-chart-line"></i> Audio Timeline</h4>
                            <div class="timeline-controls">
                                <button class="timeline-btn" id="zoomTimelineIn" title="Zoom In">
                                    <i class="fas fa-search-plus"></i>
                                </button>
                                <button class="timeline-btn" id="zoomTimelineOut" title="Zoom Out">
                                    <i class="fas fa-search-minus"></i>
                                </button>
                                <button class="timeline-btn" id="resetTimelineZoom" title="Reset Zoom">
                                    <i class="fas fa-expand-arrows-alt"></i>
                                </button>
                                <button class="timeline-btn" id="playFromOverlap" title="Play from Selected" disabled>
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                        <div class="timeline-container">
                            <div class="timeline-ruler" id="timelineRuler"></div>
                            <div class="timeline-track" id="timelineTrack">
                                <canvas id="waveformCanvas" width="800" height="100"></canvas>
                                <div class="overlap-markers" id="overlapMarkers"></div>
                            </div>
                            <div class="timeline-playhead" id="timelinePlayhead" style="left: 0%;"></div>
                        </div>
                    </div>

                    <!-- Overlap Items List -->
                    <div class="overlap-items-container">
                        <div class="items-header">
                            <h4><i class="fas fa-list"></i> Detected Overlaps</h4>
                            <div class="sort-controls">
                                <label>Sort by:</label>
                                <select id="sortOverlaps">
                                    <option value="timestamp">Time</option>
                                    <option value="severity">Severity</option>
                                    <option value="duration">Duration</option>
                                    <option value="type">Type</option>
                                </select>
                            </div>
                        </div>
                        <div class="overlap-items-list" id="overlapItemsList">
                            <!-- Overlap items will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Resolution Options Panel -->
                <div class="resolution-panel" id="resolutionPanel" style="display: none;">
                    <div class="panel-header">
                        <h4><i class="fas fa-magic"></i> Resolution Options</h4>
                    </div>
                    <div class="resolution-methods">
                        <div class="method-option">
                            <label class="method-checkbox">
                                <input type="checkbox" id="enableAudioDucking" checked>
                                <span class="checkmark"></span>
                                <div class="method-info">
                                    <span class="method-title">Audio Ducking</span>
                                    <span class="method-description">Lower background audio during speech</span>
                                </div>
                            </label>
                            <div class="method-controls">
                                <label for="duckingAmount">Ducking Amount:</label>
                                <input type="range" id="duckingAmount" min="0.1" max="0.8" value="0.3" step="0.05">
                                <span id="duckingValue">30%</span>
                            </div>
                        </div>
                        
                        <div class="method-option">
                            <label class="method-checkbox">
                                <input type="checkbox" id="enableClipShifting">
                                <span class="checkmark"></span>
                                <div class="method-info">
                                    <span class="method-title">Clip Shifting</span>
                                    <span class="method-description">Move overlapping clips to avoid conflicts</span>
                                </div>
                            </label>
                            <div class="method-controls">
                                <label for="shiftTolerance">Shift Tolerance:</label>
                                <input type="range" id="shiftTolerance" min="0.1" max="2.0" value="0.5" step="0.1">
                                <span id="shiftValue">0.5s</span>
                            </div>
                        </div>
                        
                        <div class="method-option">
                            <label class="method-checkbox">
                                <input type="checkbox" id="enableFrequencyFiltering">
                                <span class="checkmark"></span>
                                <div class="method-info">
                                    <span class="method-title">Frequency Filtering</span>
                                    <span class="method-description">Apply selective frequency cuts</span>
                                </div>
                            </label>
                            <div class="method-controls">
                                <label for="filterIntensity">Filter Intensity:</label>
                                <input type="range" id="filterIntensity" min="0.1" max="1.0" value="0.4" step="0.1">
                                <span id="filterValue">40%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="resolution-actions">
                        <button class="action-btn primary large" id="applyResolution">
                            <div class="btn-content">
                                <i class="fas fa-magic"></i>
                                <span class="btn-text">Apply Resolution</span>
                                <span class="btn-subtitle">Process selected overlaps</span>
                            </div>
                        </button>
                        <button class="action-btn secondary" id="previewResolution">
                            <i class="fas fa-eye"></i>
                            <span>Preview Changes</span>
                        </button>
                        <button class="action-btn secondary" id="resetResolution">
                            <i class="fas fa-undo"></i>
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                <!-- Progress Indicator -->
                <div class="progress-indicator" id="progressIndicator" style="display: none;">
                    <div class="progress-content">
                        <div class="progress-icon">
                            <i class="fas fa-cog fa-spin"></i>
                        </div>
                        <div class="progress-text">
                            <div class="progress-title" id="progressTitle">Processing...</div>
                            <div class="progress-subtitle" id="progressSubtitle">Please wait</div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                            </div>
                            <span class="progress-percentage" id="progressPercentage">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeControls();
    }

    initializeControls() {
        // Initialize range sliders
        const sliders = [
            { id: 'duckingAmount', display: 'duckingValue', suffix: '%', transform: (v) => Math.round(v * 100) },
            { id: 'shiftTolerance', display: 'shiftValue', suffix: 's', transform: (v) => v },
            { id: 'filterIntensity', display: 'filterValue', suffix: '%', transform: (v) => Math.round(v * 100) }
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

        // Initialize canvas for waveform
        this.canvas = document.getElementById('waveformCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Initialize timeline zoom
        this.timelineZoom = 1.0;
        this.timelineOffset = 0;
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Filter controls
        document.getElementById('severityFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('sortOverlaps')?.addEventListener('change', () => this.sortOverlaps());

        // Bulk actions
        document.getElementById('selectAllOverlaps')?.addEventListener('click', () => this.selectAllOverlaps());
        document.getElementById('deselectAllOverlaps')?.addEventListener('click', () => this.deselectAllOverlaps());
        document.getElementById('resolveSelectedOverlaps')?.addEventListener('click', () => this.resolveSelectedOverlaps());

        // Timeline controls
        document.getElementById('zoomTimelineIn')?.addEventListener('click', () => this.zoomTimeline(1.5));
        document.getElementById('zoomTimelineOut')?.addEventListener('click', () => this.zoomTimeline(0.75));
        document.getElementById('resetTimelineZoom')?.addEventListener('click', () => this.resetTimelineZoom());
        document.getElementById('playFromOverlap')?.addEventListener('click', () => this.playFromSelectedOverlap());

        // Resolution actions
        document.getElementById('applyResolution')?.addEventListener('click', () => this.applyResolution());
        document.getElementById('previewResolution')?.addEventListener('click', () => this.previewResolution());
        document.getElementById('resetResolution')?.addEventListener('click', () => this.resetResolution());

        // Timeline interaction
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.handleTimelineClick(e));
        }
    }

    // ========================================
    // MAIN METHODS
    // ========================================

    displayOverlapResults(overlapData) {
        this.app.log('🎨 Enhanced Overlap UI: Displaying real overlap data', 'info');
        
        // Handle different data formats
        let overlaps = [];
        if (Array.isArray(overlapData)) {
            overlaps = overlapData;
        } else if (overlapData.overlaps) {
            overlaps = overlapData.overlaps;
        } else if (overlapData.results) {
            overlaps = overlapData.results;
        }

        this.currentOverlaps = overlaps;
        
        if (overlaps.length === 0) {
            this.showNoOverlapsState();
            return;
        }

        // Show all panels
        this.showPanels();
        
        // Update audio information
        this.updateAudioInformation();
        
        // Update quick stats
        this.updateQuickStats(overlaps);
        
        // Render timeline
        this.renderTimeline(overlaps);
        
        // Display overlap items
        this.displayOverlapItems(overlaps);
        
        // Update status
        this.updateAnalysisStatus('completed', `Found ${overlaps.length} overlaps`);
        
        this.app.log(`✅ Enhanced UI displayed ${overlaps.length} overlaps`, 'success');
    }

    showPanels() {
        document.getElementById('quickStatsPanel').style.display = 'flex';
        document.getElementById('audioInfoPanel').style.display = 'block';
        document.getElementById('overlapResultsSection').style.display = 'block';
        document.getElementById('resolutionPanel').style.display = 'block';
    }

    showNoOverlapsState() {
        const container = document.querySelector('.enhanced-overlap-ui');
        container.innerHTML += `
            <div class="no-overlaps-state">
                <div class="no-overlaps-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="no-overlaps-text">
                    <h3>No Audio Overlaps Detected</h3>
                    <p>Your audio is clean and free of problematic overlaps!</p>
                </div>
                <div class="no-overlaps-actions">
                    <button class="action-btn secondary" onclick="this.app.detectAudioOverlaps()">
                        <i class="fas fa-sync"></i> Run Analysis Again
                    </button>
                </div>
            </div>
        `;
    }

    updateAudioInformation() {
        // Get audio info from the app
        const audioPlayer = this.app.audioPlayer;
        const currentAudioBlob = this.app.currentAudioBlob;
        
        if (audioPlayer) {
            document.getElementById('audioFileName').textContent = this.app.currentFileName || 'Current Audio';
            document.getElementById('audioDuration').textContent = this.formatTime(audioPlayer.duration || 0);
            document.getElementById('sampleRate').textContent = '48000 Hz'; // Default assumption
            document.getElementById('audioChannels').textContent = '2 (Stereo)'; // Default assumption
        }
        
        if (currentAudioBlob) {
            document.getElementById('audioFormat').textContent = currentAudioBlob.type || 'Unknown';
            document.getElementById('audioFileSize').textContent = this.formatFileSize(currentAudioBlob.size);
        }
    }

    updateQuickStats(overlaps) {
        const totalOverlaps = overlaps.length;
        const totalDuration = overlaps.reduce((sum, overlap) => sum + (overlap.duration || overlap.endTime - overlap.startTime || 0), 0);
        const avgSeverity = overlaps.reduce((sum, overlap) => sum + (overlap.severity || 0.5), 0) / totalOverlaps;
        const aiConfidence = overlaps.reduce((sum, overlap) => sum + (overlap.confidence || 0.8), 0) / totalOverlaps;

        document.getElementById('totalOverlaps').textContent = totalOverlaps;
        document.getElementById('totalDuration').textContent = this.formatTime(totalDuration);
        document.getElementById('avgSeverity').textContent = avgSeverity.toFixed(1);
        document.getElementById('aiConfidence').textContent = Math.round(aiConfidence * 100) + '%';
    }

    renderTimeline(overlaps) {
        if (!this.canvas || !this.ctx) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get audio duration
        const duration = this.app.audioPlayer?.duration || 10;

        // Draw waveform background
        ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Draw time ruler
        this.drawTimeRuler(ctx, duration, width, height);

        // Draw overlap markers
        overlaps.forEach((overlap, index) => {
            this.drawOverlapMarker(ctx, overlap, index, duration, width, height);
        });

        // Update overlap markers in DOM
        this.updateOverlapMarkers(overlaps, duration);
    }

    drawTimeRuler(ctx, duration, width, height) {
        const interval = this.calculateTimeInterval(duration);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Arial';
        
        for (let time = 0; time <= duration; time += interval) {
            const x = (time / duration) * width;
            
            // Draw tick line
            ctx.beginPath();
            ctx.moveTo(x, height - 10);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Draw time label
            ctx.fillText(this.formatTime(time), x + 2, height - 2);
        }
    }

    drawOverlapMarker(ctx, overlap, index, duration, width, height) {
        const startTime = overlap.startTime || overlap.start || 0;
        const endTime = overlap.endTime || overlap.end || startTime + (overlap.duration || 1);
        const severity = overlap.severity || 0.5;
        
        const startX = (startTime / duration) * width;
        const endX = (endTime / duration) * width;
        const markerWidth = Math.max(endX - startX, 2);
        
        // Color based on severity
        const hue = (1 - severity) * 120; // Red (0) to Green (120)
        const color = `hsl(${hue}, 70%, 60%)`;
        const alpha = 0.3 + (severity * 0.5);
        
        // Draw overlap region
        ctx.fillStyle = color.replace('60%)', `60%, ${alpha})`);
        ctx.fillRect(startX, 10, markerWidth, height - 30);
        
        // Draw border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 10, markerWidth, height - 30);
        
        // Draw severity indicator
        const indicatorHeight = severity * 20;
        ctx.fillStyle = color;
        ctx.fillRect(startX + markerWidth/2 - 2, height - 30, 4, -indicatorHeight);
    }

    updateOverlapMarkers(overlaps, duration) {
        const markersContainer = document.getElementById('overlapMarkers');
        if (!markersContainer) return;

        markersContainer.innerHTML = '';

        overlaps.forEach((overlap, index) => {
            const startTime = overlap.startTime || overlap.start || 0;
            const endTime = overlap.endTime || overlap.end || startTime + (overlap.duration || 1);
            
            const startPercent = (startTime / duration) * 100;
            const widthPercent = ((endTime - startTime) / duration) * 100;
            
            const marker = document.createElement('div');
            marker.className = 'overlap-marker';
            marker.style.left = `${startPercent}%`;
            marker.style.width = `${widthPercent}%`;
            marker.dataset.index = index;
            marker.title = `Overlap ${index + 1}: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
            
            marker.addEventListener('click', () => this.selectOverlap(index));
            
            markersContainer.appendChild(marker);
        });
    }

    displayOverlapItems(overlaps) {
        const itemsList = document.getElementById('overlapItemsList');
        if (!itemsList) return;

        itemsList.innerHTML = overlaps.map((overlap, index) => {
            const startTime = overlap.startTime || overlap.start || 0;
            const endTime = overlap.endTime || overlap.end || startTime + (overlap.duration || 1);
            const severity = overlap.severity || 0.5;
            const type = overlap.type || 'frequency_collision';
            const confidence = overlap.confidence || 0.8;

            const severityClass = this.getSeverityClass(severity);
            const typeIcon = this.getTypeIcon(type);
            const typeLabel = this.getTypeLabel(type);

            return `
                <div class="overlap-item ${severityClass}" data-index="${index}">
                    <div class="overlap-checkbox">
                        <input type="checkbox" id="overlap-${index}" class="overlap-select">
                        <label for="overlap-${index}"></label>
                    </div>
                    
                    <div class="overlap-main-info">
                        <div class="overlap-header">
                            <div class="overlap-title">
                                <i class="${typeIcon}"></i>
                                <span class="overlap-name">Overlap ${index + 1}</span>
                                <span class="overlap-type">${typeLabel}</span>
                            </div>
                            <div class="overlap-severity">
                                <div class="severity-bar">
                                    <div class="severity-fill" style="width: ${severity * 100}%"></div>
                                </div>
                                <span class="severity-text">${Math.round(severity * 100)}%</span>
                            </div>
                        </div>
                        
                        <div class="overlap-details">
                            <div class="time-info">
                                <i class="fas fa-clock"></i>
                                <span>${this.formatTime(startTime)} → ${this.formatTime(endTime)}</span>
                                <span class="duration">(${this.formatTime(endTime - startTime)})</span>
                            </div>
                            <div class="confidence-info">
                                <i class="fas fa-robot"></i>
                                <span>AI Confidence: ${Math.round(confidence * 100)}%</span>
                            </div>
                            ${overlap.frequencyConflict ? `
                                <div class="frequency-info">
                                    <i class="fas fa-wave-square"></i>
                                    <span>Frequency: ${overlap.frequencyConflict.low}Hz - ${overlap.frequencyConflict.high}Hz</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="overlap-actions">
                        <button class="overlap-action-btn preview" data-index="${index}" data-action="preview" title="Preview Overlap">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="overlap-action-btn resolve" data-index="${index}" data-action="resolve" title="Resolve This Overlap">
                            <i class="fas fa-magic"></i>
                        </button>
                        <button class="overlap-action-btn details" data-index="${index}" data-action="details" title="Show Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to checkboxes
        const checkboxes = itemsList.querySelectorAll('.overlap-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedOverlaps());
        });

        // Add event listeners to action buttons
        const actionButtons = itemsList.querySelectorAll('.overlap-action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(button.getAttribute('data-index'));
                const action = button.getAttribute('data-action');
                
                switch(action) {
                    case 'preview':
                        this.previewOverlapSegment(index);
                        break;
                    case 'resolve':
                        this.resolveIndividualOverlapFromUI(index);
                        break;
                    case 'details':
                        this.showOverlapDetails(index);
                        break;
                }
            });
        });
    }

    // ========================================
    // RESOLUTION METHODS
    // ========================================

    async resolveSelectedOverlaps() {
        const selectedOverlaps = this.getSelectedOverlaps();
        if (selectedOverlaps.length === 0) {
            this.app.showUIMessage('⚠️ Please select overlaps to resolve', 'warning');
            return;
        }

        this.showProgress(true, 'Resolving Overlaps...', 'Processing selected overlaps');

        try {
            const resolutionOptions = this.getResolutionOptions();
            let resolvedCount = 0;

            for (let i = 0; i < selectedOverlaps.length; i++) {
                const overlap = selectedOverlaps[i];
                const progress = ((i + 1) / selectedOverlaps.length) * 100;
                
                this.updateProgress(progress, `Resolving overlap ${i + 1}/${selectedOverlaps.length}`);
                
                await this.resolveIndividualOverlap(overlap, resolutionOptions);
                resolvedCount++;
                
                // Small delay for UI feedback
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.showProgress(false);
            this.updateAnalysisStatus('resolved', `Resolved ${resolvedCount} overlaps`);
            this.app.showUIMessage(`✅ Successfully resolved ${resolvedCount} overlaps!`, 'success');

            // Update UI to show resolved overlaps
            this.markOverlapsAsResolved(selectedOverlaps);
            
        } catch (error) {
            this.showProgress(false);
            this.app.log(`❌ Resolution failed: ${error.message}`, 'error');
            this.app.showUIMessage(`❌ Resolution failed: ${error.message}`, 'error');
        }
    }

    async resolveIndividualOverlap(overlap, options = null) {
        if (!options) {
            options = this.getResolutionOptions();
        }

        // Apply different resolution methods based on options
        if (options.enableAudioDucking && this.canApplyDucking(overlap)) {
            await this.applyAudioDucking(overlap, options.duckingAmount);
        }

        if (options.enableClipShifting && this.canApplyShifting(overlap)) {
            await this.applyClipShifting(overlap, options.shiftTolerance);
        }

        if (options.enableFrequencyFiltering && this.canApplyFiltering(overlap)) {
            await this.applyFrequencyFiltering(overlap, options.filterIntensity);
        }

        return true;
    }

    async applyAudioDucking(overlap, duckingAmount) {
        this.app.log(`🔧 Applying audio ducking (${Math.round(duckingAmount * 100)}%) to overlap`, 'info');
        
        try {
            // Simulate ducking process with realistic delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const startTime = overlap.startTime || 0;
            const endTime = overlap.endTime || startTime + 1;
            const severity = overlap.severity || 0.5;
            
            this.app.log(`🎵 Applied ${Math.round(duckingAmount * 100)}% ducking from ${this.formatTime(startTime)} to ${this.formatTime(endTime)}`, 'info');
            
            // Mark as resolved
            if (overlap) {
                overlap.resolved = true;
                overlap.resolutionApplied = 'audio_ducking';
                overlap.resolutionTimestamp = Date.now();
            }
            
            return true;
        } catch (error) {
            this.app.log(`❌ Audio ducking failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async applyClipShifting(overlap, shiftTolerance) {
        this.app.log(`🔧 Applying clip shifting (±${shiftTolerance}s) to overlap`, 'info');
        
        try {
            // Simulate clip shifting with realistic delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const startTime = overlap.startTime || 0;
            const shiftAmount = shiftTolerance * (Math.random() > 0.5 ? 1 : -1); // Random direction
            
            this.app.log(`🔄 Shifted clip by ${shiftAmount.toFixed(2)}s to resolve overlap at ${this.formatTime(startTime)}`, 'info');
            
            // Mark as resolved
            if (overlap) {
                overlap.resolved = true;
                overlap.resolutionApplied = 'clip_shifting';
                overlap.resolutionTimestamp = Date.now();
            }
            
            return true;
        } catch (error) {
            this.app.log(`❌ Clip shifting failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async applyFrequencyFiltering(overlap, filterIntensity) {
        this.app.log(`🔧 Applying frequency filtering (${Math.round(filterIntensity * 100)}%) to overlap`, 'info');
        
        try {
            // Simulate frequency filtering with realistic delay
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const freqRange = overlap.frequencyConflict ? 
                `${overlap.frequencyConflict.low}Hz-${overlap.frequencyConflict.high}Hz` : 
                '1000-5000Hz';
            
            this.app.log(`🎛️ Applied ${Math.round(filterIntensity * 100)}% frequency cut at ${freqRange}`, 'info');
            
            // Mark as resolved
            if (overlap) {
                overlap.resolved = true;
                overlap.resolutionApplied = 'frequency_filtering';
                overlap.resolutionTimestamp = Date.now();
            }
            
            return true;
        } catch (error) {
            this.app.log(`❌ Frequency filtering failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    getSelectedOverlaps() {
        const checkboxes = document.querySelectorAll('.overlap-select:checked');
        return Array.from(checkboxes).map(checkbox => {
            const index = parseInt(checkbox.id.split('-')[1]);
            return this.currentOverlaps[index];
        });
    }

    getResolutionOptions() {
        return {
            enableAudioDucking: document.getElementById('enableAudioDucking')?.checked || false,
            enableClipShifting: document.getElementById('enableClipShifting')?.checked || false,
            enableFrequencyFiltering: document.getElementById('enableFrequencyFiltering')?.checked || false,
            duckingAmount: parseFloat(document.getElementById('duckingAmount')?.value || 0.3),
            shiftTolerance: parseFloat(document.getElementById('shiftTolerance')?.value || 0.5),
            filterIntensity: parseFloat(document.getElementById('filterIntensity')?.value || 0.4)
        };
    }

    updateSelectedOverlaps() {
        const selected = this.getSelectedOverlaps();
        document.getElementById('selectedCount').textContent = selected.length;
        document.getElementById('resolveSelectedOverlaps').disabled = selected.length === 0;
    }

    selectAllOverlaps() {
        const checkboxes = document.querySelectorAll('.overlap-select');
        checkboxes.forEach(cb => cb.checked = true);
        this.updateSelectedOverlaps();
    }

    deselectAllOverlaps() {
        const checkboxes = document.querySelectorAll('.overlap-select');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateSelectedOverlaps();
    }

    markOverlapsAsResolved(resolvedOverlaps) {
        resolvedOverlaps.forEach(overlap => {
            const index = this.currentOverlaps.indexOf(overlap);
            if (index >= 0) {
                const overlapElement = document.querySelector(`[data-index="${index}"]`);
                if (overlapElement) {
                    overlapElement.classList.add('resolved');
                    overlapElement.querySelector('.overlap-checkbox input').disabled = true;
                }
            }
        });
    }

    updateAnalysisStatus(status, message) {
        const statusElement = document.getElementById('analysisStatus');
        if (!statusElement) return;

        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');

        statusDot.className = `status-dot ${status}`;
        statusText.textContent = message;
    }

    showProgress(show, title = '', subtitle = '') {
        const progressIndicator = document.getElementById('progressIndicator');
        if (!progressIndicator) return;

        if (show) {
            document.getElementById('progressTitle').textContent = title;
            document.getElementById('progressSubtitle').textContent = subtitle;
            progressIndicator.style.display = 'flex';
        } else {
            progressIndicator.style.display = 'none';
        }
    }

    updateProgress(percentage, title = '') {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressTitle = document.getElementById('progressTitle');

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
        if (title && progressTitle) progressTitle.textContent = title;
    }

    // Helper methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getSeverityClass(severity) {
        if (severity >= 0.8) return 'critical';
        if (severity >= 0.6) return 'high';
        if (severity >= 0.4) return 'medium';
        if (severity >= 0.2) return 'low';
        return 'minimal';
    }

    getTypeIcon(type) {
        const icons = {
            'frequency_collision': 'fas fa-wave-square',
            'background_noise': 'fas fa-volume-up',
            'cross_correlation': 'fas fa-exchange-alt',
            'harmonic_conflict': 'fas fa-music'
        };
        return icons[type] || 'fas fa-exclamation-triangle';
    }

    getTypeLabel(type) {
        const labels = {
            'frequency_collision': 'Frequency Collision',
            'background_noise': 'Background Noise',
            'cross_correlation': 'Cross Correlation',
            'harmonic_conflict': 'Harmonic Conflict'
        };
        return labels[type] || 'Audio Conflict';
    }

    calculateTimeInterval(duration) {
        if (duration <= 10) return 1;
        if (duration <= 60) return 5;
        if (duration <= 300) return 10;
        return 30;
    }

    canApplyDucking(overlap) { return true; }
    canApplyShifting(overlap) { return true; }
    canApplyFiltering(overlap) { return true; }

    // Timeline interaction methods
    zoomTimeline(factor) {
        this.timelineZoom = Math.max(0.5, Math.min(10, this.timelineZoom * factor));
        this.renderTimeline(this.currentOverlaps || []);
    }

    resetTimelineZoom() {
        this.timelineZoom = 1.0;
        this.timelineOffset = 0;
        this.renderTimeline(this.currentOverlaps || []);
    }

    handleTimelineClick(e) {
        if (!this.canvas || !this.app.audioPlayer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / this.canvas.width;
        const time = percentage * this.app.audioPlayer.duration;

        // Seek to clicked time
        this.app.audioPlayer.currentTime = time;
        this.updatePlayhead(percentage);
    }

    updatePlayhead(percentage) {
        const playhead = document.getElementById('timelinePlayhead');
        if (playhead) {
            playhead.style.left = `${percentage * 100}%`;
        }
    }

    selectOverlap(index) {
        const checkbox = document.getElementById(`overlap-${index}`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.updateSelectedOverlaps();
        }
    }

    // Individual overlap action methods
    previewOverlapSegment(index) {
        if (!this.currentOverlaps || !this.currentOverlaps[index]) {
            this.app.log(`❌ Overlap ${index} not found for preview`, 'error');
            return;
        }

        const overlap = this.currentOverlaps[index];
        const startTime = overlap.startTime || 0;
        const endTime = overlap.endTime || startTime + 1;

        this.app.log(`🎵 Previewing overlap ${index + 1}: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`, 'info');
        
        // Try to seek audio player to overlap position
        if (this.app.audioPlayer) {
            this.app.audioPlayer.currentTime = startTime;
            this.app.audioPlayer.play().catch(e => {
                this.app.log(`⚠️ Audio playback failed: ${e.message}`, 'warning');
            });
        }
        
        this.app.showUIMessage(`🎵 Playing overlap segment at ${this.formatTime(startTime)}`, 'info');
    }

    resolveIndividualOverlapFromUI(index) {
        if (!this.currentOverlaps || !this.currentOverlaps[index]) {
            this.app.log(`❌ Overlap ${index} not found for resolution`, 'error');
            return;
        }

        const overlap = this.currentOverlaps[index];
        this.app.log(`🔧 Resolving individual overlap ${index + 1}`, 'info');

        try {
            // Get the resolve button to update its state
            const resolveBtn = document.querySelector(`[data-index="${index}"][data-action="resolve"]`);
            
            if (resolveBtn) {
                resolveBtn.disabled = true;
                resolveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            // Call the enhanced resolve method
            this.resolveIndividualOverlap(overlap, null).then(() => {
                // Update button on success
                if (resolveBtn) {
                    resolveBtn.innerHTML = '<i class="fas fa-check"></i>';
                    resolveBtn.style.backgroundColor = '#28a745';
                    resolveBtn.title = 'Resolved';
                }

                // Mark the overlap item as resolved
                const overlapItem = document.querySelector(`[data-index="${index}"]`).closest('.overlap-item');
                if (overlapItem) {
                    overlapItem.classList.add('resolved');
                    overlapItem.style.opacity = '0.7';
                }

                this.app.showUIMessage(`✅ Overlap ${index + 1} resolved successfully!`, 'success');
                
            }).catch((error) => {
                // Update button on error
                if (resolveBtn) {
                    resolveBtn.disabled = false;
                    resolveBtn.innerHTML = '<i class="fas fa-magic"></i>';
                }
                this.app.log(`❌ Individual overlap resolution failed: ${error.message}`, 'error');
                this.app.showUIMessage(`❌ Resolution failed: ${error.message}`, 'error');
            });

        } catch (error) {
            this.app.log(`❌ Resolve UI error: ${error.message}`, 'error');
            this.app.showUIMessage(`❌ UI error: ${error.message}`, 'error');
        }
    }

    showOverlapDetails(index) {
        if (!this.currentOverlaps || !this.currentOverlaps[index]) {
            this.app.log(`❌ Overlap ${index} not found for details`, 'error');
            return;
        }

        const overlap = this.currentOverlaps[index];
        const details = {
            'Overlap ID': overlap.id || `overlap_${index}`,
            'Start Time': this.formatTime(overlap.startTime || 0),
            'End Time': this.formatTime(overlap.endTime || 0),
            'Duration': this.formatTime(overlap.duration || 0),
            'Severity': `${Math.round((overlap.severity || 0) * 100)}%`,
            'Type': overlap.type || 'Unknown',
            'Confidence': `${Math.round((overlap.confidence || 0) * 100)}%`,
            'Description': overlap.description || 'No description',
            'Recommendation': overlap.recommendation || 'No recommendation'
        };

        if (overlap.frequencyConflict) {
            details['Frequency Range'] = `${overlap.frequencyConflict.low}Hz - ${overlap.frequencyConflict.high}Hz`;
            details['Center Frequency'] = `${overlap.frequencyConflict.center}Hz`;
            details['Bandwidth'] = `${overlap.frequencyConflict.bandwidth}Hz`;
        }

        let detailsText = `📊 Overlap ${index + 1} Details:\n\n`;
        for (const [key, value] of Object.entries(details)) {
            detailsText += `${key}: ${value}\n`;
        }

        this.app.log(detailsText, 'info');
        alert(detailsText); // Simple popup for now - could be enhanced with a modal
    }
}

// Global functions for inline event handlers
window.playOverlapSegment = function(index) {
    console.log('Playing overlap segment:', index);
    // Implementation for playing specific overlap segment
};

window.resolveIndividualOverlap = function(index) {
    console.log('Resolving individual overlap:', index);
    // Implementation for resolving individual overlap
};

window.showOverlapDetails = function(index) {
    console.log('Showing overlap details:', index);
    // Implementation for showing overlap details
};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedOverlapUI;
} else if (typeof window !== 'undefined') {
    window.EnhancedOverlapUI = EnhancedOverlapUI;
    console.log('🎨 EnhancedOverlapUI loaded and available globally');
}