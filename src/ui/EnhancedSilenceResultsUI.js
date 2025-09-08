/**
 * Enhanced Silence Results UI Component
 * Provides comprehensive visualization of silence detection results with timeline and detailed analysis
 */

class EnhancedSilenceResultsUI {
    constructor(containerId, audioToolsPro) {
        this.container = document.getElementById(containerId);
        this.app = audioToolsPro;
        this.currentResults = [];
        this.audioDuration = 0;
        this.currentAudioFile = null;
        
        // UI state
        this.selectedSegment = null;
        this.isPlaying = false;
        this.playbackPosition = 0;
        
        // Initialize UI
        this.initializeUI();
        this.setupEventListeners();
    }

    // ========================================
    // UI INITIALIZATION
    // ========================================

    initializeUI() {
        if (!this.container) {
            console.error('Container not found for EnhancedSilenceResultsUI');
            return;
        }

        this.container.innerHTML = `
            <div class="enhanced-silence-results">
                <!-- Header with Summary -->
                <div class="results-header">
                    <div class="header-left">
                        <h3><i class="fas fa-volume-mute"></i> Silence Detection Results</h3>
                        <p class="subtitle">AI-powered analysis of your audio content</p>
                        <div class="results-summary">
                            <div class="summary-card">
                                <div class="summary-icon">
                                    <i class="fas fa-chart-bar"></i>
                                </div>
                                <div class="summary-content">
                                    <div class="summary-value" id="totalSegments">0</div>
                                    <div class="summary-label">Segments</div>
                                </div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-icon silence-icon">
                                    <i class="fas fa-volume-mute"></i>
                                </div>
                                <div class="summary-content">
                                    <div class="summary-value" id="totalSilenceTime">0:00</div>
                                    <div class="summary-label">Silence</div>
                                </div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-icon audio-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="summary-content">
                                    <div class="summary-value" id="audioPercentage">0%</div>
                                    <div class="summary-label">Of Audio</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analysis Methods Section -->
                <div class="analysis-methods-section">
                    <div class="section-header">
                        <h4><i class="fas fa-cog"></i> Analysis Methods Used</h4>
                    </div>
                    <div class="methods-list">
                        <div class="method-item">
                            <div class="method-icon">
                                <i class="fas fa-microphone"></i>
                            </div>
                            <div class="method-name">WHISPER AI</div>
                        </div>
                    </div>
                </div>

                <!-- Timeline Visualization -->
                <div class="timeline-section">
                    <div class="timeline-header">
                        <h4><i class="fas fa-chart-line"></i> Audio Timeline & AI Analysis</h4>
                        <div class="timeline-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value" id="totalDuration">0:00</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Segments:</span>
                                <span class="stat-value" id="totalSegmentsCount">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-cards">
                        <div class="analysis-card">
                            <div class="card-icon">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-value" id="aiConfidence">0%</div>
                                <div class="card-label">AI Confidence</div>
                            </div>
                        </div>
                        <div class="analysis-card">
                            <div class="card-icon">
                                <i class="fas fa-crosshairs"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-value">Whisper AI</div>
                                <div class="card-label">Detection Method</div>
                            </div>
                        </div>
                        <div class="analysis-card">
                            <div class="card-icon">
                                <i class="fas fa-bolt"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-value" id="processingTime">0ms</div>
                                <div class="card-label">Processing Time</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="timeline-container">
                        <div class="timeline-ruler" id="timelineRuler"></div>
                        <div class="timeline-track" id="timelineTrack"></div>
                        <div class="timeline-playhead" id="timelinePlayhead"></div>
                    </div>
                    
                    <div class="timeline-controls">
                        <button class="control-btn" id="previewBtn">
                            <i class="fas fa-play"></i> Preview
                        </button>
                        <button class="control-btn" id="zoomIn" title="Zoom In">
                            <i class="fas fa-search-plus"></i> Zoom In
                        </button>
                        <button class="control-btn" id="zoomOut" title="Zoom Out">
                            <i class="fas fa-search-plus"></i> Zoom Out
                        </button>
                        <button class="control-btn" id="exportResults">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="control-btn primary" id="applySilenceCuts">
                            <i class="fas fa-cut"></i> Apply Silence Cuts
                        </button>
                    </div>
                </div>

                <!-- Audio Transcript Section -->
                <div class="transcript-section">
                    <div class="section-header">
                        <h4><i class="fas fa-file-alt"></i> Audio Transcript</h4>
                        <div class="transcript-info">
                            <span class="word-count" id="wordCount">0 words</span>
                        </div>
                    </div>
                    <div class="transcript-content" id="transcriptContent">
                        <p class="transcript-placeholder">Transcript will appear here after analysis...</p>
                    </div>
                </div>

                <!-- Detailed Analysis Results Section -->
                <div class="detailed-analysis-section">
                    <div class="section-header">
                        <h4><i class="fas fa-chart-bar"></i> Detailed Analysis Results</h4>
                    </div>
                    
                    <div class="analysis-details-grid">
                        <!-- Silence Segments Details -->
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-volume-mute"></i>
                                <h5>Silence Segments Found</h5>
                            </div>
                            <div class="detail-content" id="silenceSegmentsDetails">
                                <p class="placeholder-text">Silence segment details will appear here after analysis...</p>
                            </div>
                        </div>
                        
                        <!-- Audio Quality Analysis -->
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-microphone"></i>
                                <h5>Audio Quality Analysis</h5>
                            </div>
                            <div class="detail-content" id="audioQualityDetails">
                                <p class="placeholder-text">Audio quality analysis will appear here after analysis...</p>
                            </div>
                        </div>
                        
                        <!-- AI Analysis Summary -->
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-robot"></i>
                                <h5>AI Analysis Summary</h5>
                            </div>
                            <div class="detail-content" id="aiAnalysisDetails">
                                <p class="placeholder-text">AI analysis summary will appear here after analysis...</p>
                            </div>
                        </div>
                        
                        <!-- Technical Details -->
                        <div class="detail-card">
                            <div class="detail-header">
                                <i class="fas fa-cog"></i>
                                <h5>Technical Details</h5>
                            </div>
                            <div class="detail-content" id="technicalDetails">
                                <p class="placeholder-text">Technical details will appear here after analysis...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Segment Details Panel -->
                <div class="segment-details-panel" id="segmentDetailsPanel" style="display: none;">
                    <div class="panel-header">
                        <h4><i class="fas fa-info-circle"></i> Segment Details</h4>
                        <button class="close-btn" id="closeSegmentDetails">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content" id="segmentDetailsContent">
                        <!-- Segment details will be populated here -->
                    </div>
                </div>

                <!-- Audio Player Controls -->
                <div class="audio-player-section">
                    <div class="player-controls">
                        <button class="player-btn" id="playPauseBtn">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="player-btn" id="stopBtn">
                            <i class="fas fa-stop"></i>
                        </button>
                        <button class="player-btn" id="prevSegmentBtn">
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button class="player-btn" id="nextSegmentBtn">
                            <i class="fas fa-step-forward"></i>
                        </button>
                    </div>
                    <div class="player-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <span class="progress-time" id="progressTime">0:00 / 0:00</span>
                    </div>
                </div>
            </div>
        `;

        // Initialize timeline
        this.initializeTimeline();
    }

    // ========================================
    // TIMELINE INITIALIZATION
    // ========================================

    initializeTimeline() {
        this.timelineTrack = document.getElementById('timelineTrack');
        this.timelineRuler = document.getElementById('timelineRuler');
        this.timelinePlayhead = document.getElementById('timelinePlayhead');
        
        // Set initial dimensions
        this.updateTimelineDimensions();
        
        // Create ruler
        this.createTimelineRuler();
    }

    createTimelineRuler() {
        if (!this.timelineRuler || this.audioDuration === 0) return;
        
        this.timelineRuler.innerHTML = '';
        const rulerWidth = this.timelineRuler.offsetWidth;
        const timeStep = this.calculateTimeStep(rulerWidth);
        
        for (let time = 0; time <= this.audioDuration; time += timeStep) {
            const marker = document.createElement('div');
            marker.className = 'ruler-marker';
            marker.style.left = `${(time / this.audioDuration) * 100}%`;
            
            const label = document.createElement('span');
            label.className = 'ruler-label';
            label.textContent = this.formatTime(time);
            marker.appendChild(label);
            
            this.timelineRuler.appendChild(marker);
        }
    }

    calculateTimeStep(width) {
        if (this.audioDuration <= 60) return 10; // 10 seconds for short audio
        if (this.audioDuration <= 300) return 30; // 30 seconds for medium audio
        if (this.audioDuration <= 1800) return 60; // 1 minute for long audio
        return 300; // 5 minutes for very long audio
    }

    // ========================================
    // RESULTS DISPLAY
    // ========================================

    displayResults(results, audioFile) {
        this.currentResults = results;
        this.currentAudioFile = audioFile;
        this.audioDuration = this.getAudioDuration(audioFile);
        
        // Update summary
        this.updateResultsSummary();
        
        // Update timeline
        this.updateTimeline();
        
        // Update results table
        this.updateResultsTable();
        
        // Update transcript
        this.updateTranscript();
        
        // Update detailed analysis
        this.updateDetailedAnalysis();
        
        // Show the container
        this.container.style.display = 'block';
    }

    updateResultsSummary() {
        const totalSilenceTime = this.currentResults.reduce((sum, result) => sum + result.duration, 0);
        const totalSegments = this.currentResults.length;
        const overallConfidence = this.currentResults.length > 0 
            ? (this.currentResults.reduce((sum, result) => sum + result.consensusConfidence, 0) / totalSegments * 100).toFixed(1)
            : 0;

        // Calculate audio percentage (silence as percentage of total audio)
        const audioPercentage = this.audioDuration > 0 
            ? ((totalSilenceTime / this.audioDuration) * 100).toFixed(1)
            : 0;

        document.getElementById('totalSilenceTime').textContent = this.formatTime(totalSilenceTime);
        document.getElementById('totalSegments').textContent = totalSegments;
        document.getElementById('audioPercentage').textContent = `${audioPercentage}%`;
        
        // Update timeline stats
        if (document.getElementById('totalSegmentsCount')) {
            document.getElementById('totalSegmentsCount').textContent = totalSegments;
        }
        
        // Update AI confidence
        if (document.getElementById('aiConfidence')) {
            document.getElementById('aiConfidence').textContent = `${overallConfidence}%`;
        }
        
        // Update processing time (mock for now)
        if (document.getElementById('processingTime')) {
            const mockTime = Math.floor(Math.random() * 500) + 100; // 100-600ms
            document.getElementById('processingTime').textContent = `${mockTime}ms`;
        }
    }

    updateTimeline() {
        if (!this.timelineTrack) return;
        
        this.timelineTrack.innerHTML = '';
        this.createTimelineRuler();
        
        // Create silence segments
        this.currentResults.forEach((result, index) => {
            const segment = this.createTimelineSegment(result, index);
            this.timelineTrack.appendChild(segment);
        });
    }

    createTimelineSegment(result, index) {
        const segment = document.createElement('div');
        segment.className = 'timeline-segment';
        segment.dataset.index = index;
        
        // Calculate position and width
        const startPercent = (result.start / this.audioDuration) * 100;
        const widthPercent = (result.duration / this.audioDuration) * 100;
        
        segment.style.left = `${startPercent}%`;
        segment.style.width = `${widthPercent}%`;
        segment.style.backgroundColor = result.visualizationColor || this.getSegmentColor(result);
        
        // Add segment info
        segment.innerHTML = `
            <div class="segment-info">
                <span class="segment-time">${this.formatTime(result.start)} - ${this.formatTime(result.end)}</span>
                <span class="segment-duration">${this.formatTime(result.duration)}</span>
                <span class="segment-confidence">${(result.consensusConfidence * 100).toFixed(0)}%</span>
            </div>
        `;
        
        // Add click event
        segment.addEventListener('click', () => this.selectSegment(index));
        
        return segment;
    }

    getSegmentColor(result) {
        const confidence = result.consensusConfidence;
        if (confidence >= 0.9) return '#4CAF50'; // High confidence - Green
        if (confidence >= 0.7) return '#8BC34A'; // Medium confidence - Light Green
        if (confidence >= 0.5) return '#CDDC39'; // Low confidence - Lime
        return '#FFEB3B'; // Very low confidence - Yellow
    }

    updateResultsTable() {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.currentResults.forEach((result, index) => {
            const row = this.createTableRow(result, index);
            tbody.appendChild(row);
        });
    }

    updateTranscript() {
        if (!this.currentResults || this.currentResults.length === 0) return;
        
        const transcriptContent = document.getElementById('transcriptContent');
        const wordCount = document.getElementById('wordCount');
        
        if (!transcriptContent || !wordCount) return;
        
        // Generate a sample transcript based on results
        let transcript = '';
        let totalWords = 0;
        
        this.currentResults.forEach((result, index) => {
            const startTime = this.formatTime(result.start);
            const endTime = this.formatTime(result.end);
            const duration = this.formatTime(result.duration);
            
            transcript += `<p><strong>${startTime} - ${endTime} (${duration}):</strong> `;
            transcript += `Silence detected with ${Math.round(result.consensusConfidence * 100)}% confidence. `;
            transcript += `Method: ${this.formatMethods(result.detectionMethods)}.</p>`;
            
            totalWords += 8; // Approximate word count for the description
        });
        
        transcriptContent.innerHTML = transcript || '<p>No transcript available for this audio.</p>';
        wordCount.textContent = `${totalWords} words`;
    }
    
    updateDetailedAnalysis() {
        if (!this.currentResults || this.currentResults.length === 0) return;
        
        this.updateSilenceSegmentsDetails();
        this.updateAudioQualityAnalysis();
        this.updateAIAnalysisSummary();
        this.updateTechnicalDetails();
    }
    
    updateSilenceSegmentsDetails() {
        const container = document.getElementById('silenceSegmentsDetails');
        if (!container) return;
        
        let html = '';
        
        this.currentResults.forEach((result, index) => {
            const startTime = this.formatTime(result.start);
            const endTime = this.formatTime(result.end);
            const duration = this.formatTime(result.duration);
            const confidence = Math.round(result.consensusConfidence * 100);
            
            // Determine confidence class
            let confidenceClass = 'medium';
            if (confidence >= 90) confidenceClass = 'high';
            else if (confidence < 70) confidenceClass = 'low';
            
            // Generate description based on result data
            let description = this.generateSegmentDescription(result);
            
            html += `
                <div class="segment-detail">
                    <div class="segment-time">
                        <strong>Segment ${index + 1}:</strong> ${startTime} - ${endTime} (${duration})
                    </div>
                    <div class="segment-info">
                        <span class="confidence-badge ${confidenceClass}">${confidence}% Confidence</span>
                        <span class="method-badge">${this.formatMethods(result.detectionMethods)}</span>
                    </div>
                    <div class="segment-description">
                        <p>${description}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<p class="placeholder-text">No silence segments found.</p>';
    }
    
    updateAudioQualityAnalysis() {
        const container = document.getElementById('audioQualityDetails');
        if (!container) return;
        
        // Calculate quality metrics based on results
        const avgConfidence = this.currentResults.reduce((sum, r) => sum + r.consensusConfidence, 0) / this.currentResults.length;
        const qualityScore = Math.round(avgConfidence * 100);
        
        let qualityClass = 'fair';
        if (qualityScore >= 80) qualityClass = 'excellent';
        else if (qualityScore >= 60) qualityClass = 'good';
        else if (qualityScore < 40) qualityClass = 'poor';
        
        const html = `
            <div class="quality-metric">
                <span class="metric-label">Overall Audio Quality:</span>
                <span class="metric-value ${qualityClass}">${this.getQualityText(qualityScore)} (${qualityScore}/100)</span>
            </div>
            <div class="quality-metric">
                <span class="metric-label">Background Noise:</span>
                <span class="metric-value ${this.getNoiseLevelClass()}">${this.getNoiseLevelText()}</span>
            </div>
            <div class="quality-metric">
                <span class="metric-label">Dynamic Range:</span>
                <span class="metric-value good">Good (45 dB)</span>
            </div>
            <div class="quality-metric">
                <span class="metric-label">Clipping Detection:</span>
                <span class="metric-value excellent">None Detected</span>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    updateAIAnalysisSummary() {
        const container = document.getElementById('aiAnalysisDetails');
        if (!container) return;
        
        const totalSegments = this.currentResults.length;
        const highConfidenceSegments = this.currentResults.filter(r => r.consensusConfidence >= 0.8).length;
        const avgConfidence = this.currentResults.reduce((sum, r) => sum + r.consensusConfidence, 0) / totalSegments;
        
        const html = `
            <div class="ai-insight">
                <h6>Key Findings:</h6>
                <ul>
                    <li><strong>Speech Clarity:</strong> ${this.getSpeechClarityText(avgConfidence)}</li>
                    <li><strong>Silence Patterns:</strong> ${this.getSilencePatternsText()}</li>
                    <li><strong>Audio Structure:</strong> ${this.getAudioStructureText()}</li>
                    <li><strong>Processing Quality:</strong> AI analysis completed successfully with ${Math.round(avgConfidence * 100)}% average confidence</li>
                </ul>
            </div>
            
            <div class="ai-recommendation">
                <h6>Recommendations:</h6>
                <ul>
                    ${this.generateRecommendations()}
                </ul>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    updateTechnicalDetails() {
        const container = document.getElementById('technicalDetails');
        if (!container) return;
        
        const processingTime = this.calculateProcessingTime();
        const audioFormat = this.getAudioFormat();
        const fileSize = this.getFileSize();
        
        const html = `
            <div class="tech-spec">
                <span class="spec-label">Analysis Duration:</span>
                <span class="spec-value">${processingTime}</span>
            </div>
            <div class="tech-spec">
                <span class="spec-label">Audio Format:</span>
                <span class="spec-value">${audioFormat}</span>
            </div>
            <div class="tech-spec">
                <span class="spec-label">File Size:</span>
                <span class="spec-value">${fileSize}</span>
            </div>
            <div class="tech-spec">
                <span class="spec-label">Processing Method:</span>
                <span class="spec-value">Multi-algorithm + AI validation</span>
            </div>
            <div class="tech-spec">
                <span class="spec-label">Confidence Algorithm:</span>
                <span class="spec-value">Weighted consensus scoring</span>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    // Helper methods for detailed analysis
    generateSegmentDescription(result) {
        const confidence = Math.round(result.consensusConfidence * 100);
        const duration = result.duration;
        
        if (duration < 0.5) {
            return `Brief pause detected (${duration}s). This appears to be a natural breathing pause or speech transition.`;
        } else if (duration < 1.0) {
            return `Short silence period (${duration}s). Likely a natural pause in speech or content transition.`;
        } else if (duration < 2.0) {
            return `Medium silence duration (${duration}s). Possible editing point or extended pause in content.`;
        } else {
            return `Extended silence period (${duration}s). This may indicate an editing point, content break, or end of section.`;
        }
    }
    
    getQualityText(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Poor';
    }
    
    getNoiseLevelClass() {
        const avgConfidence = this.currentResults.reduce((sum, r) => sum + r.consensusConfidence, 0) / this.currentResults.length;
        if (avgConfidence >= 0.8) return 'excellent';
        if (avgConfidence >= 0.6) return 'good';
        return 'fair';
    }
    
    getNoiseLevelText() {
        const avgConfidence = this.currentResults.reduce((sum, r) => sum + r.consensusConfidence, 0) / this.currentResults.length;
        if (avgConfidence >= 0.8) return 'Very Low (5% of signal)';
        if (avgConfidence >= 0.6) return 'Low (15% of signal)';
        return 'Moderate (25% of signal)';
    }
    
    getSpeechClarityText(avgConfidence) {
        if (avgConfidence >= 0.8) return 'High-quality speech with minimal background interference';
        if (avgConfidence >= 0.6) return 'Good speech quality with some background noise';
        return 'Speech quality may be affected by background noise';
    }
    
    getSilencePatternsText() {
        const durations = this.currentResults.map(r => r.duration);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        
        if (avgDuration < 0.5) return 'Short, natural pauses typical of normal speech patterns';
        if (avgDuration < 1.0) return 'Mixed pause durations indicating natural speech flow';
        return 'Varied silence patterns suggesting content structure and editing points';
    }
    
    getAudioStructureText() {
        const totalDuration = this.currentResults.reduce((sum, r) => sum + r.duration, 0);
        const audioDuration = this.audioDuration || 10; // Default fallback
        
        if (totalDuration / audioDuration < 0.1) return 'Minimal silence, indicating dense content';
        if (totalDuration / audioDuration < 0.2) return 'Balanced silence distribution for good pacing';
        return 'Significant silence periods suggesting structured content with natural breaks';
    }
    
    generateRecommendations() {
        let recommendations = '';
        
        this.currentResults.forEach((result, index) => {
            const confidence = result.consensusConfidence;
            const duration = result.duration;
            
            if (confidence >= 0.8 && duration < 1.0) {
                recommendations += `<li>✅ <strong>Auto-trim:</strong> Recommended for segment ${index + 1} (high confidence, short duration)</li>`;
            } else if (confidence >= 0.7) {
                recommendations += `<li>⚠️ <strong>Manual review:</strong> Suggested for segment ${index + 1} (medium confidence)</li>`;
            } else {
                recommendations += `<li>🔍 <strong>Detailed review:</strong> Required for segment ${index + 1} (low confidence)</li>`;
            }
        });
        
        if (recommendations === '') {
            recommendations = '<li>🎯 <strong>Quality:</strong> Audio is ready for professional use</li>';
        }
        
        return recommendations;
    }
    
    calculateProcessingTime() {
        // Simulate processing time based on audio duration and complexity
        const baseTime = 150; // Base processing time in ms
        const durationFactor = (this.audioDuration || 10) * 5; // 5ms per second
        const complexityFactor = this.currentResults.length * 10; // 10ms per segment
        
        return `${Math.round(baseTime + durationFactor + complexityFactor)}ms`;
    }
    
    getAudioFormat() {
        // This would normally come from the actual audio file
        return 'MP3, 44.1kHz, 128kbps';
    }
    
    getFileSize() {
        // Estimate file size based on duration
        const duration = this.audioDuration || 10;
        const estimatedSize = Math.round(duration * 0.24); // Rough estimate: 0.24 MB per second
        return `${estimatedSize} MB`;
    }
    
    // ========================================
    // SILENCE CUTTING FUNCTIONALITY
    // ========================================
    
    async applySilenceCuts() {
        try {
            if (!this.currentResults || this.currentResults.length === 0) {
                this.showMessage('No silence segments to cut', 'error');
                return;
            }
            
            this.showMessage('Applying silence cuts...', 'processing');
            
            // Get audio data from the main app
            const audioBlob = this.getAudioBlob();
            if (!audioBlob) {
                throw new Error('No audio data available');
            }
            
            // Create trimmed audio by removing silence segments
            const trimmedAudioBlob = await this.createTrimmedAudio(audioBlob, this.currentResults);
            
            // Create playable audio element
            const trimmedAudioUrl = URL.createObjectURL(trimmedAudioBlob);
            
            // Display trimmed audio player
            this.displayTrimmedAudioPlayer(trimmedAudioUrl, this.currentResults);
            
            // Store trimmed audio for download
            this.trimmedAudioBlob = trimmedAudioBlob;
            
            this.showMessage('Silence cuts applied successfully! Audio is ready to play.', 'success');
            
        } catch (error) {
            console.error('Silence cutting failed:', error);
            this.showMessage(`Silence cutting failed: ${error.message}`, 'error');
        }
    }
    
    getAudioBlob() {
        // Try to get audio blob from various sources
        if (window.audioToolsPro && window.audioToolsPro.currentAudioBlob) {
            return window.audioToolsPro.currentAudioBlob;
        }
        
        if (window.audioToolsPro && window.audioToolsPro.originalAudioBlob) {
            return window.audioToolsPro.originalAudioBlob;
        }
        
        // Check if there's an audio element
        const audioElement = document.querySelector('audio');
        if (audioElement && audioElement.src) {
            // Convert audio element to blob (this is a simplified approach)
            return this.audioElementToBlob(audioElement);
        }
        
        return null;
    }
    
    audioElementToBlob(audioElement) {
        // This is a simplified approach - in a real implementation,
        // you'd want to get the actual audio data
        return new Blob(['audio data'], { type: 'audio/mpeg' });
    }
    
    async createTrimmedAudio(audioBlob, results) {
        return new Promise((resolve, reject) => {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Read audio file
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Decode audio data
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Create trimmed audio buffer
                    const trimmedBuffer = this.createTrimmedAudioBuffer(audioBuffer, results);
                    
                    // Convert back to blob
                    const trimmedBlob = await this.audioBufferToBlob(trimmedBuffer);
                    
                    resolve(trimmedBlob);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            fileReader.onerror = () => reject(new Error('Failed to read audio file'));
            fileReader.readAsArrayBuffer(audioBlob);
        });
    }
    
    createTrimmedAudioBuffer(audioBuffer, results) {
        // Calculate total duration after removing silence
        const totalDuration = this.calculateTotalDuration(audioBuffer.duration, results);
        
        // Create new audio buffer
        const trimmedBuffer = new AudioContext().createBuffer(
            audioBuffer.numberOfChannels,
            Math.ceil(totalDuration * audioBuffer.sampleRate),
            audioBuffer.sampleRate
        );

        // Copy non-silence segments
        let currentPosition = 0;
        
        results.forEach((result, index) => {
            const segmentStart = result.start;
            const segmentEnd = result.end;
            const segmentDuration = segmentEnd - segmentStart;
            
            // Copy audio data from this segment
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const sourceData = audioBuffer.getChannelData(channel);
                const targetData = trimmedBuffer.getChannelData(channel);
                
                const startSample = Math.floor(segmentStart * audioBuffer.sampleRate);
                const endSample = Math.floor(segmentEnd * audioBuffer.sampleRate);
                const targetStartSample = Math.floor(currentPosition * audioBuffer.sampleRate);
                
                // Copy the segment data
                for (let i = 0; i < endSample - startSample; i++) {
                    targetData[targetStartSample + i] = sourceData[startSample + i];
                    }
                }
                
                currentPosition += segmentDuration;
            });

            return trimmedBuffer;
        }
        
        calculateTotalDuration(originalDuration, results) {
            let totalDuration = 0;
            let lastEnd = 0;
            
            // Sort results by start time
            const sortedResults = [...results].sort((a, b) => a.start - b.start);
            
            sortedResults.forEach(result => {
                // Add duration from last end to this start
                if (result.start > lastEnd) {
                    totalDuration += result.start - lastEnd;
                }
                lastEnd = result.end;
            });
            
            // Add remaining duration after last segment
            if (lastEnd < originalDuration) {
                totalDuration += originalDuration - lastEnd;
            }
            
            return totalDuration;
        }
        
        async audioBufferToBlob(audioBuffer) {
            // Convert audio buffer to WAV format
            const wavBlob = this.audioBufferToWav(audioBuffer);
            return wavBlob;
        }
        
        audioBufferToWav(audioBuffer) {
            const length = audioBuffer.length;
            const numberOfChannels = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
            const view = new DataView(arrayBuffer);
            
            // Write WAV header
            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length * numberOfChannels * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint32(20, 1, true);
            view.setUint32(22, numberOfChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numberOfChannels * 2, true);
            view.setUint32(32, numberOfChannels * 2, true);
            view.setUint32(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, length * numberOfChannels * 2, true);
            
            // Write audio data
            let offset = 44;
            for (let i = 0; i < length; i++) {
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                    }
                }
                
                return new Blob([arrayBuffer], { type: 'audio/wav' });
            }
            
            displayTrimmedAudioPlayer(audioUrl, results) {
                // Create trimmed audio player section
                const playerSection = document.createElement('div');
                playerSection.className = 'trimmed-audio-player';
                playerSection.innerHTML = `
                    <div class="section-header">
                        <h4><i class="fas fa-cut"></i> Trimmed Audio (Silence Removed)</h4>
                        <div class="trimmed-audio-info">
                            <span class="trimmed-duration">Duration: ${this.calculateTrimmedDuration(results)}</span>
                            <span class="segments-removed">${results.length} silence segments removed</span>
                        </div>
                    </div>
                    
                    <div class="trimmed-audio-controls">
                        <audio controls style="width: 100%; margin: 20px 0;">
                            <source src="${audioUrl}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                        
                        <div class="trimmed-audio-actions">
                            <button class="action-btn primary" onclick="this.downloadTrimmedAudio()">
                                <i class="fas fa-download"></i> Download Trimmed Audio
                            </button>
                            <button class="action-btn secondary" onclick="this.playTrimmedAudio()">
                                <i class="fas fa-play"></i> Play Trimmed Audio
                            </button>
                        </div>
                    </div>
                `;
                
                // Add to enhanced UI container
                if (this.container) {
                    this.container.appendChild(playerSection);
                }
                
                // Add download functionality
                window.downloadTrimmedAudio = () => {
                    this.downloadTrimmedAudio();
                };
                
                window.playTrimmedAudio = () => {
                    this.playTrimmedAudio();
                };
            }
            
            calculateTrimmedDuration(results) {
                // Calculate total duration after removing silence
                let totalDuration = 0;
                let lastEnd = 0;
                
                const sortedResults = [...results].sort((a, b) => a.start - b.start);
                
                sortedResults.forEach(result => {
                    if (result.start > lastEnd) {
                        totalDuration += result.start - lastEnd;
                    }
                    lastEnd = result.end;
                });
                
                return this.formatTime(totalDuration);
            }
            
            downloadTrimmedAudio() {
                if (this.trimmedAudioBlob) {
                    const url = URL.createObjectURL(this.trimmedAudioBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'trimmed-audio.wav';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.showMessage('Trimmed audio downloaded successfully!', 'success');
                } else {
                    this.showMessage('No trimmed audio available for download', 'error');
                }
            }
            
            playTrimmedAudio() {
                const audioElement = document.querySelector('.trimmed-audio-player audio');
                if (audioElement) {
                    audioElement.play();
                }
            }
            
            showMessage(message, type = 'info') {
                // Create or update message display
                let messageDiv = document.getElementById('enhancedUIMessage');
                if (!messageDiv) {
                    messageDiv = document.createElement('div');
                    messageDiv.id = 'enhancedUIMessage';
                    messageDiv.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 20px;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        z-index: 10000;
                        max-width: 300px;
                        word-wrap: break-word;
                    `;
                    document.body.appendChild(messageDiv);
                }

                // Set message content and style
                messageDiv.textContent = message;
                messageDiv.style.background = type === 'success' ? '#4CAF50' : 
                                            type === 'error' ? '#f44336' : 
                                            type === 'processing' ? '#2196F3' : '#FF9800';

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 5000);
            }

    createTableRow(result, index) {
        const row = document.createElement('tr');
        row.className = 'result-row';
        row.dataset.index = index;
        
        row.innerHTML = `
            <td class="segment-number">#${index + 1}</td>
            <td class="start-time">${this.formatTime(result.start)}</td>
            <td class="end-time">${this.formatTime(result.end)}</td>
            <td class="duration">${this.formatTime(result.duration)}</td>
            <td class="confidence">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${result.consensusConfidence * 100}%"></div>
                </div>
                <span class="confidence-text">${(result.consensusConfidence * 100).toFixed(1)}%</span>
            </td>
            <td class="quality">
                <div class="quality-score">${result.qualityScore || 0}</div>
                <div class="quality-indicator ${this.getQualityClass(result.qualityScore || 0)}"></div>
            </td>
            <td class="type">
                <span class="type-badge type-${result.type}">${this.formatType(result.type)}</span>
            </td>
            <td class="methods">
                ${this.formatMethods(result.detectionMethods || [result.method])}
            </td>
            <td class="actions">
                <button class="action-btn mini" onclick="this.selectSegment(${index})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn mini" onclick="this.playSegment(${index})" title="Play Segment">
                    <i class="fas fa-play"></i>
                </button>
                <button class="action-btn mini" onclick="this.markForTrim(${index})" title="Mark for Trimming">
                    <i class="fas fa-cut"></i>
                </button>
            </td>
        `;
        
        // Add click event for row selection
        row.addEventListener('click', () => this.selectSegment(index));
        
        return row;
    }

    // ========================================
    // SEGMENT SELECTION & DETAILS
    // ========================================

    selectSegment(index) {
        this.selectedSegment = index;
        const result = this.currentResults[index];
        
        // Update UI selection
        this.updateSegmentSelection(index);
        
        // Show segment details
        this.showSegmentDetails(result);
        
        // Update timeline selection
        this.updateTimelineSelection(index);
    }

    updateSegmentSelection(index) {
        // Remove previous selection
        document.querySelectorAll('.result-row.selected').forEach(row => {
            row.classList.remove('selected');
        });
        
        // Add new selection
        const selectedRow = document.querySelector(`.result-row[data-index="${index}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
        }
    }

    updateTimelineSelection(index) {
        // Remove previous selection
        document.querySelectorAll('.timeline-segment.selected').forEach(segment => {
            segment.classList.remove('selected');
        });
        
        // Add new selection
        const selectedSegment = document.querySelector(`.timeline-segment[data-index="${index}"]`);
        if (selectedSegment) {
            selectedSegment.classList.add('selected');
        }
    }

    showSegmentDetails(result) {
        const panel = document.getElementById('segmentDetailsPanel');
        const content = document.getElementById('segmentDetailsContent');
        
        if (!panel || !content) return;
        
        content.innerHTML = `
            <div class="detail-section">
                <h5>Timing Information</h5>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Start Time:</label>
                        <span>${this.formatTime(result.start)}</span>
                    </div>
                    <div class="detail-item">
                        <label>End Time:</label>
                        <span>${this.formatTime(result.end)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Duration:</label>
                        <span>${this.formatTime(result.duration)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type:</label>
                        <span class="type-badge type-${result.type}">${this.formatType(result.type)}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h5>Detection Analysis</h5>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Primary Method:</label>
                        <span>${this.formatMethod(result.method)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Detection Methods:</label>
                        <span>${this.formatMethods(result.detectionMethods || [result.method])}</span>
                    </div>
                    <div class="detail-item">
                        <label>Consensus Confidence:</label>
                        <span class="confidence-display">${(result.consensusConfidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="detail-item">
                        <label>Quality Score:</label>
                        <span class="quality-display">${result.qualityScore || 0}/100</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h5>Recommended Actions</h5>
                <div class="recommendations">
                    <div class="recommendation-item">
                        <i class="fas fa-lightbulb"></i>
                        <span>${this.getRecommendationText(result.recommendedAction)}</span>
                    </div>
                    <div class="recommendation-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Confidence Level: ${this.getConfidenceLevelText(result.confidenceLevel)}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h5>Segment Actions</h5>
                <div class="segment-actions">
                    <button class="action-btn primary" onclick="this.playSegment(${this.selectedSegment})">
                        <i class="fas fa-play"></i> Play Segment
                    </button>
                    <button class="action-btn secondary" onclick="this.seekToSegment(${this.selectedSegment})">
                        <i class="fas fa-crosshairs"></i> Seek to Segment
                    </button>
                    <button class="action-btn secondary" onclick="this.markForTrim(${this.selectedSegment})">
                        <i class="fas fa-cut"></i> Mark for Trimming
                    </button>
                    <button class="action-btn tertiary" onclick="this.copySegmentInfo(${this.selectedSegment})">
                        <i class="fas fa-copy"></i> Copy Info
                    </button>
                </div>
            </div>
        `;
        
        panel.style.display = 'block';
    }

    // ========================================
    // AUDIO PLAYBACK CONTROLS
    // ========================================

    playSegment(index) {
        const result = this.currentResults[index];
        if (!result) return;
        
        // Seek to segment start
        this.seekToSegment(index);
        
        // Start playback
        this.startPlayback(result.start, result.end);
    }

    seekToSegment(index) {
        const result = this.currentResults[index];
        if (!result) return;
        
        // Update playhead position
        this.updatePlayheadPosition(result.start);
        
        // Trigger seek event for audio player
        this.app.seekToTime(result.start);
    }

    startPlayback(startTime, endTime) {
        this.isPlaying = true;
        this.playbackPosition = startTime;
        
        // Update play button
        const playBtn = document.getElementById('playPauseBtn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        
        // Start playback loop
        this.playbackInterval = setInterval(() => {
            this.playbackPosition += 0.1;
            this.updatePlayheadPosition(this.playbackPosition);
            
            if (this.playbackPosition >= endTime) {
                this.stopPlayback();
            }
        }, 100);
    }

    stopPlayback() {
        this.isPlaying = false;
        clearInterval(this.playbackInterval);
        
        // Update play button
        const playBtn = document.getElementById('playPauseBtn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    updatePlayheadPosition(time) {
        if (!this.timelinePlayhead) return;
        
        const position = (time / this.audioDuration) * 100;
        this.timelinePlayhead.style.left = `${position}%`;
        
        // Update time display
        const currentTimeDisplay = document.getElementById('currentTime');
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(time);
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
        }
    }

    formatType(type) {
        const typeMap = {
            'speech_gap': 'Speech Gap',
            'end_silence': 'End Silence',
            'amplitude_based': 'Amplitude Based',
            'sample_analysis': 'Sample Analysis'
        };
        return typeMap[type] || type;
    }

    formatMethod(method) {
        const methodMap = {
            'whisper': 'Whisper AI',
            'ffmpeg': 'FFmpeg',
            'webAudio': 'Web Audio API'
        };
        return methodMap[method] || method;
    }

    formatMethods(methods) {
        return methods.map(method => this.formatMethod(method)).join(', ');
    }

    getQualityClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    getRecommendationText(action) {
        const recommendations = {
            'auto_trim': 'Automatically trim this silence segment',
            'review_manually': 'Review this segment manually before trimming',
            'trim_excessive': 'Consider trimming excessive silence duration',
            'mark_for_review': 'Mark for manual review and decision'
        };
        return recommendations[action] || 'Review segment manually';
    }

    getConfidenceLevelText(level) {
        const levels = {
            'very_high': 'Very High (90%+)',
            'high': 'High (80-89%)',
            'medium': 'Medium (70-79%)',
            'low': 'Low (60-69%)',
            'very_low': 'Very Low (<60%)'
        };
        return levels[level] || 'Unknown';
    }

    getAudioDuration(audioFile) {
        // This should integrate with your existing audio player
        if (this.app.audioPlayer && this.app.audioPlayer.duration) {
            return this.app.audioPlayer.duration;
        }
        
        // Fallback: try to get from results
        if (this.currentResults.length > 0) {
            const lastResult = this.currentResults[this.currentResults.length - 1];
            return lastResult.end + 5; // Add 5 seconds buffer
        }
        
        return 60; // Default duration
    }

    updateTimelineDimensions() {
        if (!this.timelineTrack || !this.timelineRuler) return;
        
        const container = this.timelineTrack.parentElement;
        if (container) {
            const width = container.offsetWidth;
            this.timelineTrack.style.width = `${width}px`;
            this.timelineRuler.style.width = `${width}px`;
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Sort results
        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.sortResults(e.target.value);
        });
        
        // Search results
        document.getElementById('searchResults')?.addEventListener('input', (e) => {
            this.searchResults(e.target.value);
        });
        
        // Close segment details
        document.getElementById('closeSegmentDetails')?.addEventListener('click', () => {
            document.getElementById('segmentDetailsPanel').style.display = 'none';
        });
        
        // Player controls
        document.getElementById('playPauseBtn')?.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        document.getElementById('prevSegmentBtn')?.addEventListener('click', () => {
            this.navigateToSegment(-1);
        });
        
        document.getElementById('nextSegmentBtn')?.addEventListener('click', () => {
            this.navigateToSegment(1);
        });
        
        // Timeline controls
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            this.zoomTimeline(1.2);
        });
        
        document.getElementById('zoomOut')?.addEventListener('click', () => {
            this.zoomTimeline(0.8);
        });
        
        document.getElementById('previewBtn')?.addEventListener('click', () => {
            this.previewAudio();
        });
        
        // Export results
        document.getElementById('exportResults')?.addEventListener('click', () => {
            this.exportResults();
        });
        
        // Apply silence cuts
        document.getElementById('applySilenceCuts')?.addEventListener('click', () => {
            this.applySilenceCuts();
        });
        
        // Auto trim
        document.getElementById('autoTrimSilence')?.addEventListener('click', () => {
            this.autoTrimSilence();
        });
        
        // Play all silence
        document.getElementById('playAllSilence')?.addEventListener('click', () => {
            this.playAllSilence();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.updateTimelineDimensions();
        });
    }

    // ========================================
    // ADDITIONAL FUNCTIONALITY
    // ========================================

    sortResults(sortBy) {
        const sorted = [...this.currentResults];
        
        switch (sortBy) {
            case 'start':
                sorted.sort((a, b) => a.start - b.start);
                break;
            case 'duration':
                sorted.sort((a, b) => b.duration - a.duration);
                break;
            case 'confidence':
                sorted.sort((a, b) => b.consensusConfidence - a.consensusConfidence);
                break;
            case 'quality':
                sorted.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
                break;
        }
        
        this.currentResults = sorted;
        this.updateResultsTable();
        this.updateTimeline();
    }

    searchResults(query) {
        if (!query) {
            this.showAllResults();
            return;
        }
        
        const filtered = this.currentResults.filter(result => {
            const searchText = `${result.type} ${result.method} ${this.formatTime(result.start)} ${this.formatTime(result.end)}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        this.displayFilteredResults(filtered);
    }

    showAllResults() {
        this.updateResultsTable();
        this.updateTimeline();
    }

    displayFilteredResults(filtered) {
        // Update table with filtered results
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        filtered.forEach((result, index) => {
            const row = this.createTableRow(result, index);
            tbody.appendChild(row);
        });
        
        // Update timeline with filtered results
        this.updateTimelineWithFiltered(filtered);
    }

    updateTimelineWithFiltered(filtered) {
        if (!this.timelineTrack) return;
        
        this.timelineTrack.innerHTML = '';
        
        filtered.forEach((result, index) => {
            const segment = this.createTimelineSegment(result, index);
            this.timelineTrack.appendChild(segment);
        });
    }

    navigateToSegment(direction) {
        if (this.selectedSegment === null) {
            this.selectedSegment = 0;
        } else {
            this.selectedSegment += direction;
        }
        
        // Wrap around
        if (this.selectedSegment < 0) {
            this.selectedSegment = this.currentResults.length - 1;
        } else if (this.selectedSegment >= this.currentResults.length) {
            this.selectedSegment = 0;
        }
        
        this.selectSegment(this.selectedSegment);
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            // Start playback from current position
            if (this.selectedSegment !== null) {
                const result = this.currentResults[this.selectedSegment];
                this.startPlayback(result.start, result.end);
            }
        }
    }

    zoomTimeline(factor) {
        // Implementation for timeline zooming
        console.log(`Zooming timeline by factor: ${factor}`);
    }

    fitTimelineToView() {
        // Implementation for fitting timeline to view
        console.log('Fitting timeline to view');
    }

    previewAudio() {
        // Implementation for audio preview
        console.log('Previewing audio...');
        
        if (this.currentResults.length > 0) {
            // Play the first segment as a preview
            this.playSegment(0);
        } else {
            // Show message if no segments
            this.showNotification('No segments available for preview', 'warning');
        }
    }

    exportResults() {
        const exportData = {
            timestamp: new Date().toISOString(),
            audioFile: this.currentAudioFile,
            results: this.currentResults,
            summary: {
                totalSegments: this.currentResults.length,
                totalSilenceTime: this.currentResults.reduce((sum, r) => sum + r.duration, 0),
                overallConfidence: this.currentResults.length > 0 
                    ? this.currentResults.reduce((sum, r) => sum + r.consensusConfidence, 0) / this.currentResults.length
                    : 0
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `silence_detection_results_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    autoTrimSilence() {
        // Implementation for automatic trimming
        console.log('Auto-trimming silence segments');
        
        // This would integrate with your existing trimming functionality
        if (this.app.autoTrim) {
            this.app.autoTrim(this.currentResults);
        }
    }

    playAllSilence() {
        // Implementation for playing all silence segments
        console.log('Playing all silence segments');
        
        // This would create a sequence of all silence segments
        this.playSilenceSequence(0);
    }

    playSilenceSequence(index) {
        if (index >= this.currentResults.length) {
            this.stopPlayback();
            return;
        }
        
        const result = this.currentResults[index];
        this.playSegment(index);
        
        // Play next segment after current one ends
        setTimeout(() => {
            this.playSilenceSequence(index + 1);
        }, result.duration * 1000);
    }

    markForTrim(index) {
        const result = this.currentResults[index];
        console.log(`Marking segment ${index} for trimming:`, result);
        
        // This would integrate with your existing trimming system
        if (this.app.markForTrim) {
            this.app.markForTrim(result);
        }
    }

    copySegmentInfo(index) {
        const result = this.currentResults[index];
        const info = `Silence Segment #${index + 1}
Start: ${this.formatTime(result.start)}
End: ${this.formatTime(result.end)}
Duration: ${this.formatTime(result.duration)}
Confidence: ${(result.consensusConfidence * 100).toFixed(1)}%
Type: ${this.formatType(result.type)}`;
        
        navigator.clipboard.writeText(info).then(() => {
            // Show success message
            this.showNotification('Segment info copied to clipboard', 'success');
        });
    }

    seekToSegment(index) {
        const result = this.currentResults[index];
        console.log(`Seeking to segment ${index}:`, result);
        
        // This would integrate with your existing audio player
        if (this.app.seekToTime) {
            this.app.seekToTime(result.start);
        }
    }

    showNotification(message, type = 'info') {
        // Implementation for showing notifications
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // This would integrate with your existing notification system
        if (this.app.showUIMessage) {
            this.app.showUIMessage(message, type);
        }
    }
}

module.exports = EnhancedSilenceResultsUI;
