class AIEnhancedOverlapUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initializeUI();
    }

    initializeUI() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="ai-enhanced-overlap-detection">
                <div class="analysis-header">
                    <h3><i class="fas fa-brain"></i> AI-Enhanced Audio Analysis</h3>
                    <div class="quality-score">
                        <div class="score-circle">
                            <span id="qualityScore">0</span>
                            <span class="score-label">Quality</span>
                        </div>
                    </div>
                </div>

                <div class="analysis-timeline">
                    <div class="timeline-header">
                        <h4><i class="fas fa-chart-line"></i> Audio Timeline</h4>
                        <div class="timeline-controls">
                            <button class="zoom-in"><i class="fas fa-search-plus"></i></button>
                            <button class="zoom-out"><i class="fas fa-search-minus"></i></button>
                            <button class="reset-zoom"><i class="fas fa-undo"></i></button>
                        </div>
                    </div>
                    <div class="timeline-visualization" id="overlapTimeline">
                        <div class="time-markers"></div>
                        <div class="waveform-display"></div>
                        <div class="overlap-markers"></div>
                    </div>
                </div>

                <div class="analysis-details">
                    <div class="overlaps-list">
                        <h4><i class="fas fa-exclamation-triangle"></i> Detected Issues</h4>
                        <div class="list-container" id="overlapsList"></div>
                    </div>

                    <div class="ai-recommendations">
                        <h4><i class="fas fa-lightbulb"></i> AI Recommendations</h4>
                        <div class="recommendations-list" id="recommendationsList"></div>
                    </div>
                </div>

                <div class="analysis-actions">
                    <button class="action-btn primary" id="autoResolveAll">
                        <i class="fas fa-magic"></i>
                        <span>Auto-Resolve All</span>
                    </button>
                    <button class="action-btn secondary" id="exportReport">
                        <i class="fas fa-file-export"></i>
                        <span>Export Report</span>
                    </button>
                    <button class="action-btn tertiary" id="reanalyze">
                        <i class="fas fa-redo"></i>
                        <span>Reanalyze</span>
                    </button>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const styles = `
            .ai-enhanced-overlap-detection {
                background: #1a1a1a;
                border-radius: 12px;
                padding: 20px;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .analysis-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .quality-score {
                position: relative;
                width: 80px;
                height: 80px;
            }

            .score-circle {
                border: 4px solid #00bcd4;
                border-radius: 50%;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0, 188, 212, 0.1);
            }

            #qualityScore {
                font-size: 24px;
                font-weight: bold;
                color: #00bcd4;
            }

            .score-label {
                font-size: 12px;
                color: #a0aec0;
            }

            .analysis-timeline {
                background: #2d3748;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
            }

            .timeline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .timeline-controls button {
                background: #1a202c;
                border: 1px solid #4a5568;
                color: #ffffff;
                padding: 8px;
                border-radius: 4px;
                margin-left: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .timeline-visualization {
                height: 200px;
                background: #1a202c;
                border-radius: 6px;
                position: relative;
                overflow: hidden;
            }

            .analysis-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
            }

            .overlaps-list, .ai-recommendations {
                background: #2d3748;
                border-radius: 8px;
                padding: 16px;
            }

            .analysis-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .action-btn {
                padding: 12px 24px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .action-btn.primary {
                background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
                color: white;
            }

            .action-btn.secondary {
                background: #2d3748;
                border: 1px solid #4a5568;
                color: white;
            }

            .action-btn.tertiary {
                background: transparent;
                border: 1px solid #4a5568;
                color: #a0aec0;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    displayResults(results) {
        if (!results || !this.container) return;

        // Update quality score
        const qualityScore = document.getElementById('qualityScore');
        if (qualityScore) {
            qualityScore.textContent = Math.round(results.overall_quality);
        }

        // Update timeline visualization
        this.updateTimeline(results.overlaps);

        // Update overlaps list
        this.updateOverlapsList(results.overlaps);

        // Update recommendations
        this.updateRecommendations(results.recommendations);
    }

    updateTimeline(overlaps) {
        const timeline = document.getElementById('overlapTimeline');
        if (!timeline) return;

        const markers = overlaps.map(overlap => {
            const position = (overlap.timestamp / this.totalDuration) * 100;
            const width = (overlap.duration / this.totalDuration) * 100;
            const severity = overlap.severity * 100;
            
            return `
                <div class="overlap-marker ${this.getSeverityClass(overlap.severity)}"
                     style="left: ${position}%; width: ${width}%;"
                     title="${overlap.description}">
                    <div class="marker-tooltip">
                        <strong>${this.formatTime(overlap.timestamp)}</strong>
                        <span>${overlap.type}</span>
                        <span>${Math.round(severity)}% severity</span>
                    </div>
                </div>
            `;
        }).join('');

        timeline.querySelector('.overlap-markers').innerHTML = markers;
    }

    updateOverlapsList(overlaps) {
        const list = document.getElementById('overlapsList');
        if (!list) return;

        list.innerHTML = overlaps.map(overlap => `
            <div class="overlap-item ${this.getSeverityClass(overlap.severity)}">
                <div class="overlap-header">
                    <div class="overlap-time">${this.formatTime(overlap.timestamp)}</div>
                    <div class="overlap-type">${overlap.type}</div>
                    <div class="overlap-severity">${Math.round(overlap.severity * 100)}%</div>
                </div>
                <div class="overlap-description">${overlap.description}</div>
                <div class="overlap-actions">
                    <button class="action-btn mini" onclick="playOverlap(${overlap.timestamp})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn mini" onclick="resolveOverlap(${overlap.timestamp})">
                        <i class="fas fa-magic"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateRecommendations(recommendations) {
        const list = document.getElementById('recommendationsList');
        if (!list) return;

        list.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <i class="fas fa-lightbulb"></i>
                <span>${rec}</span>
            </div>
        `).join('');
    }

    getSeverityClass(severity) {
        if (severity >= 0.8) return 'critical';
        if (severity >= 0.6) return 'high';
        if (severity >= 0.4) return 'medium';
        return 'low';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEnhancedOverlapUI;
}
