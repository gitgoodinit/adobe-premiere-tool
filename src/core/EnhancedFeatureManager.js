/**
 * Enhanced Feature Manager - Orchestrates Enhanced Silence Detection & Overlap Detection
 * Integrates both enhanced detectors with improved workflow management and result visualization
 */

// Try to load enhanced modules
let EnhancedSilenceDetector, EnhancedOverlapDetector;

try {
    if (typeof require !== 'undefined') {
        EnhancedSilenceDetector = require('./EnhancedSilenceDetector');
        EnhancedOverlapDetector = require('./EnhancedOverlapDetector');
    }
} catch (error) {
    console.warn('Enhanced modules not available, using fallback implementations');
}

class EnhancedFeatureManager {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        
        // Initialize enhanced detectors
        this.enhancedSilenceDetector = EnhancedSilenceDetector ? new EnhancedSilenceDetector(audioToolsPro) : null;
        this.enhancedOverlapDetector = EnhancedOverlapDetector ? new EnhancedOverlapDetector(audioToolsPro) : null;
        
        this.currentWorkflow = null;
        this.workflowHistory = [];
        this.isProcessing = false;
        
        // Enhanced workflow settings
        this.enhancedWorkflowSettings = {
            silence: {
                enablePreprocessing: true,
                enableAIValidation: true,
                confidenceThreshold: 0.7,
                maxSilenceDuration: 5.0, // seconds
                autoTrim: false,
                previewMode: true
            },
            overlap: {
                enableClippingDetection: true,
                enableLoudnessAnalysis: true,
                enableAIValidation: true,
                autoResolution: false,
                resolutionMethods: ['clipShifting', 'audioDucking', 'layerTrimming']
            },
            visualization: {
                timelineColors: {
                    silence: '#4CAF50',      // Green for silence
                    clipping: '#F44336',     // Red for clipping
                    loudness: '#FF9800',     // Orange for loudness
                    overlap: '#9C27B0',      // Purple for overlaps
                    background: '#607D8B'    // Blue-grey for background noise
                },
                enableRealTimeUpdates: true,
                showConfidenceIndicators: true
            }
        };
        
        this.initializeEnhancedFeatures();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    initializeEnhancedFeatures() {
        this.app.log('🎯 Initializing Enhanced Features: Silence Detection & Overlap Detection', 'info');
        
        try {
            // Validate system requirements
            this.validateEnhancedSystemRequirements();
            
            // Load enhanced workflow settings
            this.loadEnhancedWorkflowSettings();
            
            // Set up enhanced event listeners
            this.setupEnhancedEventListeners();
            
            const status = this.enhancedSilenceDetector && this.enhancedOverlapDetector ? 'complete' : 'partial (fallback mode)';
            this.app.log(`✅ Enhanced features initialization ${status}`, 'success');
            
        } catch (error) {
            this.app.log(`❌ Enhanced features initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    validateEnhancedSystemRequirements() {
        const requirements = {
            enhancedSilence: !!this.enhancedSilenceDetector,
            enhancedOverlap: !!this.enhancedOverlapDetector,
            ffmpeg: this.checkFFmpegAvailability(),
            webAudio: this.checkWebAudioSupport(),
            openai: this.checkOpenAIAvailability(),
            nodeIntegration: this.checkNodeIntegration()
        };

        const missing = Object.entries(requirements)
            .filter(([key, available]) => !available)
            .map(([key]) => key);

        if (missing.length > 0) {
            this.app.log(`⚠️ Missing enhanced requirements: ${missing.join(', ')}`, 'warning');
            this.app.log('🔄 Continuing with available enhanced methods only', 'info');
        }

        return requirements;
    }

    checkFFmpegAvailability() {
        try {
            if (typeof require !== 'undefined') {
                const { execSync } = require('child_process');
                execSync('ffmpeg -version', { stdio: 'ignore' });
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    checkWebAudioSupport() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    checkOpenAIAvailability() {
        return !!(process.env.OPENAI_API_KEY || this.app.settings?.openaiApiKey);
    }

    checkNodeIntegration() {
        try {
            return typeof require !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    loadEnhancedWorkflowSettings() {
        // Load from localStorage if available
        const savedSettings = localStorage.getItem('enhancedWorkflowSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.enhancedWorkflowSettings = { ...this.enhancedWorkflowSettings, ...parsed };
                this.app.log('⚙️ Enhanced workflow settings loaded from storage', 'info');
            } catch (error) {
                this.app.log('⚠️ Failed to load enhanced workflow settings', 'warning');
            }
        }
    }

    setupEnhancedEventListeners() {
        // Enhanced Silence Detection
        document.getElementById('detectSilence')?.addEventListener('click', () => {
            this.runEnhancedSilenceDetectionWorkflow();
        });

        // Enhanced Overlap Detection
        document.getElementById('detectOverlaps')?.addEventListener('click', () => {
            this.runEnhancedOverlapDetectionWorkflow();
        });

        // Enhanced Auto-Resolution
        document.getElementById('resolveOverlaps')?.addEventListener('click', () => {
            this.runEnhancedAutoResolution();
        });

        // Enhanced Settings
        document.getElementById('enhancedSettings')?.addEventListener('click', () => {
            this.showEnhancedSettingsPanel();
        });

        // Enhanced Visualization Controls
        document.getElementById('toggleVisualization')?.addEventListener('click', () => {
            this.toggleEnhancedVisualization();
        });
    }

    // ========================================
    // ENHANCED SILENCE DETECTION WORKFLOW
    // ========================================

    async runEnhancedSilenceDetectionWorkflow(options = {}) {
        if (this.isProcessing) {
            this.app.log('⚠️ Enhanced workflow already in progress', 'warning');
            return;
        }

        this.isProcessing = true;
        const workflowId = `enhanced_silence_${Date.now()}`;
        
        this.app.log('🚀 Starting Enhanced Silence Detection Workflow...', 'info');
        this.app.updateStatus('Enhanced Silence Analysis...', 'processing');
        this.app.updateProgressBar(0, 'Initializing Enhanced Analysis...');

        try {
            // Step 1: Get active audio source
            this.app.updateProgressBar(5, 'Getting active audio source...');
            const audioSource = await this.getActiveAudioSource();
            
            // Step 2: Run enhanced silence detection
            this.app.updateProgressBar(10, 'Running Enhanced Silence Detection...');
            let detectionResult;
            
            if (this.enhancedSilenceDetector) {
                detectionResult = await this.enhancedSilenceDetector.detectSilence(
                    audioSource, 
                    {
                        ...this.enhancedWorkflowSettings.silence,
                        ...options
                    }
                );
            } else {
                throw new Error('Enhanced silence detector not available');
            }

            // Step 3: Process and validate results
            this.app.updateProgressBar(70, 'Processing Enhanced Results...');
            const processedResults = this.processEnhancedSilenceResults(detectionResult);

            // Step 4: Generate enhanced visualizations
            this.app.updateProgressBar(80, 'Generating Enhanced Visualizations...');
            await this.generateEnhancedSilenceVisualizations(processedResults);

            // Step 5: Apply auto-trimming if enabled
            let trimmingResult = null;
            if (this.enhancedWorkflowSettings.silence.autoTrim) {
                this.app.updateProgressBar(85, 'Applying Auto-Trimming...');
                trimmingResult = await this.applyEnhancedSilenceTrimming(processedResults);
            }

            // Step 6: Create enhanced workflow record
            const workflow = {
                id: workflowId,
                timestamp: new Date(),
                type: 'enhanced_silence_detection',
                audioSource: audioSource.name || 'Active Sequence',
                detection: detectionResult,
                processed: processedResults,
                trimming: trimmingResult,
                settings: { ...this.enhancedWorkflowSettings.silence },
                status: 'completed'
            };

            this.currentWorkflow = workflow;
            this.workflowHistory.push(workflow);

            // Step 7: Update UI with enhanced results
            this.app.updateProgressBar(95, 'Updating Enhanced Interface...');
            await this.updateUIWithEnhancedSilenceResults(workflow);

            // Complete
            this.app.updateProgressBar(100, 'Enhanced Workflow Complete');
            this.app.updateStatus('Enhanced Analysis Ready', 'success');
            this.app.log(`✅ Enhanced silence detection workflow completed successfully (${processedResults.length} segments)`, 'success');

            return workflow;

        } catch (error) {
            this.app.log(`❌ Enhanced silence detection workflow failed: ${error.message}`, 'error');
            this.app.updateStatus('Enhanced Workflow Failed', 'error');
            throw error;
        } finally {
            this.isProcessing = false;
            setTimeout(() => {
                this.app.updateProgressBar(0, 'Enhanced Analysis Ready');
            }, 3000);
        }
    }

    // ========================================
    // ENHANCED OVERLAP DETECTION WORKFLOW
    // ========================================

    async runEnhancedOverlapDetectionWorkflow(options = {}) {
        if (this.isProcessing) {
            this.app.log('⚠️ Enhanced overlap workflow already in progress', 'warning');
            return;
        }

        this.isProcessing = true;
        const workflowId = `enhanced_overlap_${Date.now()}`;
        
        this.app.log('🚀 Starting Enhanced Overlap Detection Workflow...', 'info');
        this.app.updateStatus('Enhanced Overlap Analysis...', 'processing');
        this.app.updateProgressBar(0, 'Initializing Enhanced Overlap Analysis...');

        try {
            // Step 1: Get active audio source
            this.app.updateProgressBar(5, 'Getting active audio source...');
            const audioSource = await this.getActiveAudioSource();
            
            // Step 2: Run enhanced overlap detection
            this.app.updateProgressBar(10, 'Running Enhanced Overlap Detection...');
            let detectionResult;
            
            if (this.enhancedOverlapDetector) {
                detectionResult = await this.enhancedOverlapDetector.detectAudioOverlaps(
                    audioSource, 
                    {
                        ...this.enhancedWorkflowSettings.overlap,
                        ...options
                    }
                );
            } else {
                throw new Error('Enhanced overlap detector not available');
            }

            // Step 3: Process and categorize results
            this.app.updateProgressBar(70, 'Processing Enhanced Overlap Results...');
            const processedResults = this.processEnhancedOverlapResults(detectionResult);

            // Step 4: Generate enhanced overlap visualizations
            this.app.updateProgressBar(80, 'Generating Enhanced Overlap Visualizations...');
            await this.generateEnhancedOverlapVisualizations(processedResults);

            // Step 5: Apply auto-resolution if enabled
            let resolutionResult = null;
            if (this.enhancedWorkflowSettings.overlap.autoResolution) {
                this.app.updateProgressBar(85, 'Applying Auto-Resolution...');
                resolutionResult = await this.applyEnhancedOverlapResolution(processedResults);
            }

            // Step 6: Create enhanced workflow record
            const workflow = {
                id: workflowId,
                timestamp: new Date(),
                type: 'enhanced_overlap_detection',
                audioSource: audioSource.name || 'Active Sequence',
                detection: detectionResult,
                processed: processedResults,
                resolution: resolutionResult,
                settings: { ...this.enhancedWorkflowSettings.overlap },
                status: 'completed'
            };

            this.currentWorkflow = workflow;
            this.workflowHistory.push(workflow);

            // Step 7: Update UI with enhanced results
            this.app.updateProgressBar(95, 'Updating Enhanced Overlap Interface...');
            await this.updateUIWithEnhancedOverlapResults(workflow);

            // Complete
            this.app.updateProgressBar(100, 'Enhanced Overlap Analysis Complete');
            this.app.updateStatus('Enhanced Overlap Analysis Ready', 'success');
            this.app.log(`✅ Enhanced overlap detection workflow completed successfully (${processedResults.length} issues found)`, 'success');

            return workflow;

        } catch (error) {
            this.app.log(`❌ Enhanced overlap detection workflow failed: ${error.message}`, 'error');
            this.app.updateStatus('Enhanced Overlap Workflow Failed', 'error');
            throw error;
        } finally {
            this.isProcessing = false;
            setTimeout(() => {
                this.app.updateProgressBar(0, 'Enhanced Overlap Analysis Ready');
            }, 3000);
        }
    }

    // ========================================
    // ENHANCED AUTO-RESOLUTION WORKFLOW
    // ========================================

    async runEnhancedAutoResolution() {
        if (!this.currentWorkflow || this.currentWorkflow.type !== 'enhanced_overlap_detection') {
            this.app.log('⚠️ No overlap detection results available for resolution', 'warning');
            return;
        }

        this.app.log('🔧 Starting Enhanced Auto-Resolution...', 'info');
        this.app.updateStatus('Auto-Resolving Issues...', 'processing');

        try {
            const overlapResults = this.currentWorkflow.processed;
            const resolutionResult = await this.applyEnhancedOverlapResolution(overlapResults);
            
            this.app.log(`✅ Enhanced auto-resolution completed: ${resolutionResult.resolved} issues resolved`, 'success');
            this.app.updateStatus('Auto-Resolution Complete', 'success');
            
            return resolutionResult;
            
        } catch (error) {
            this.app.log(`❌ Enhanced auto-resolution failed: ${error.message}`, 'error');
            this.app.updateStatus('Auto-Resolution Failed', 'error');
            throw error;
        }
    }

    // ========================================
    // RESULT PROCESSING AND ENHANCEMENT
    // ========================================

    processEnhancedSilenceResults(detectionResult) {
        if (!detectionResult || !detectionResult.results) {
            return [];
        }

        const results = detectionResult.results;
        const processed = [];

        for (const result of results) {
            // Add enhanced metadata
            const enhanced = {
                ...result,
                enhanced: true,
                qualityScore: this.calculateSilenceQualityScore(result),
                recommendedAction: this.getRecommendedSilenceAction(result),
                confidenceLevel: this.getConfidenceLevel(result.consensusConfidence),
                visualizationColor: this.getSilenceVisualizationColor(result)
            };

            processed.push(enhanced);
        }

        // Sort by quality score (highest first)
        processed.sort((a, b) => b.qualityScore - a.qualityScore);

        return processed;
    }

    processEnhancedOverlapResults(detectionResult) {
        if (!Array.isArray(detectionResult)) {
            return [];
        }

        const processed = [];
        const categories = {
            clipping: [],
            loudness: [],
            overlap: [],
            background: [],
            other: []
        };

        for (const result of detectionResult) {
            // Categorize results
            const category = this.categorizeOverlapResult(result);
            categories[category].push(result);

            // Add enhanced metadata
            const enhanced = {
                ...result,
                enhanced: true,
                category: category,
                priority: this.calculateOverlapPriority(result),
                recommendedResolution: this.getRecommendedOverlapResolution(result),
                confidenceLevel: this.getConfidenceLevel(result.confidence),
                visualizationColor: this.getOverlapVisualizationColor(result)
            };

            processed.push(enhanced);
        }

        // Sort by priority (highest first)
        processed.sort((a, b) => b.priority - a.priority);

        // Log categorization summary
        Object.entries(categories).forEach(([category, results]) => {
            if (results.length > 0) {
                this.app.log(`📊 ${category}: ${results.length} issues`, 'info');
            }
        });

        return processed;
    }

    // ========================================
    // ENHANCED VISUALIZATION GENERATION
    // ========================================

    async generateEnhancedSilenceVisualizations(results) {
        this.app.log('🎨 Generating enhanced silence visualizations...', 'info');
        
        try {
            // Generate timeline visualization
            await this.generateSilenceTimelineVisualization(results);
            
            // Generate confidence distribution chart
            await this.generateConfidenceDistributionChart(results);
            
            // Generate method comparison chart
            await this.generateMethodComparisonChart(results);
            
            this.app.log('✅ Enhanced silence visualizations generated', 'success');
            
        } catch (error) {
            this.app.log(`⚠️ Enhanced silence visualization generation failed: ${error.message}`, 'warning');
        }
    }

    async generateEnhancedOverlapVisualizations(results) {
        this.app.log('🎨 Generating enhanced overlap visualizations...', 'info');
        
        try {
            // Generate timeline visualization with color coding
            await this.generateOverlapTimelineVisualization(results);
            
            // Generate issue type distribution chart
            await this.generateIssueTypeDistributionChart(results);
            
            // Generate severity heatmap
            await this.generateSeverityHeatmap(results);
            
            this.app.log('✅ Enhanced overlap visualizations generated', 'success');
            
        } catch (error) {
            this.app.log(`⚠️ Enhanced overlap visualization generation failed: ${error.message}`, 'warning');
        }
    }

    // ========================================
    // ENHANCED UI UPDATES
    // ========================================

    async updateUIWithEnhancedSilenceResults(workflow) {
        this.app.log('🔄 Updating UI with enhanced silence results...', 'info');
        
        try {
            // Update results display
            this.updateSilenceResultsDisplay(workflow.processed);
            
            // Update confidence indicators
            this.updateConfidenceIndicators(workflow.processed);
            
            // Update timeline visualization
            this.updateTimelineVisualization(workflow.processed, 'silence');
            
            // Enable enhanced controls
            this.enableEnhancedSilenceControls();
            
            this.app.log('✅ Enhanced silence UI updated', 'success');
            
        } catch (error) {
            this.app.log(`⚠️ Enhanced silence UI update failed: ${error.message}`, 'warning');
        }
    }

    async updateUIWithEnhancedOverlapResults(workflow) {
        this.app.log('🔄 Updating UI with enhanced overlap results...', 'info');
        
        try {
            // Update results display
            this.updateOverlapResultsDisplay(workflow.processed);
            
            // Update issue categorization
            this.updateIssueCategorization(workflow.processed);
            
            // Update timeline visualization
            this.updateTimelineVisualization(workflow.processed, 'overlap');
            
            // Enable enhanced controls
            this.enableEnhancedOverlapControls();
            
            this.app.log('✅ Enhanced overlap UI updated', 'success');
            
        } catch (error) {
            this.app.log(`⚠️ Enhanced overlap UI update failed: ${error.message}`, 'warning');
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    async getActiveAudioSource() {
        this.app.log('🎵 Getting active audio source...', 'info');
        
        try {
            // Try to get from Premiere Pro first
            if (this.app.csInterface) {
                const activeSequence = await this.getActiveSequenceFromPremiere();
                if (activeSequence) {
                    return activeSequence;
                }
            }
            
            // Fallback to current audio path
            if (this.app.currentAudioPath) {
                return { name: 'Current Audio', path: this.app.currentAudioPath };
            }
            
            throw new Error('No active audio source found');
            
        } catch (error) {
            this.app.log(`⚠️ Failed to get active audio source: ${error.message}`, 'warning');
            throw error;
        }
    }

    async getActiveSequenceFromPremiere() {
        try {
            // This would integrate with your existing Premiere Pro integration
            // For now, return null to use fallback
            return null;
        } catch (error) {
            return null;
        }
    }

    calculateSilenceQualityScore(result) {
        let score = 0;
        
        // Base score from confidence
        score += result.consensusConfidence * 50;
        
        // Method diversity bonus
        if (result.detectionMethods && result.detectionMethods.length > 1) {
            score += 20;
        }
        
        // Duration optimization bonus
        if (result.duration >= 0.5 && result.duration <= 2.0) {
            score += 15;
        } else if (result.duration > 2.0) {
            score += 10;
        }
        
        // Type-specific bonuses
        if (result.type === 'speech_gap') score += 10;
        if (result.type === 'end_silence') score += 5;
        
        return Math.min(100, score);
    }

    calculateOverlapPriority(result) {
        let priority = 0;
        
        // Base priority from confidence
        priority += result.confidence * 50;
        
        // Severity multiplier
        const severityMultipliers = { low: 1, medium: 1.5, high: 2 };
        priority *= severityMultipliers[result.severity] || 1;
        
        // Type-specific priorities
        const typePriorities = {
            clipping: 20,
            loudness: 15,
            overlap: 25,
            background: 10
        };
        priority += typePriorities[result.type] || 0;
        
        return Math.min(100, priority);
    }

    getRecommendedSilenceAction(result) {
        if (result.consensusConfidence < 0.6) {
            return 'review_manually';
        }
        
        if (result.duration > 3.0) {
            return 'trim_excessive';
        }
        
        if (result.consensusConfidence > 0.9) {
            return 'auto_trim';
        }
        
        return 'mark_for_review';
    }

    getRecommendedOverlapResolution(result) {
        switch (result.type) {
            case 'clipping':
                return 'apply_compression';
            case 'loudness':
                return 'normalize_levels';
            case 'overlap':
                return 'adjust_timing';
            case 'background':
                return 'apply_noise_reduction';
            default:
                return 'manual_review';
        }
    }

    getConfidenceLevel(confidence) {
        if (confidence >= 0.9) return 'very_high';
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.7) return 'medium';
        if (confidence >= 0.6) return 'low';
        return 'very_low';
    }

    getSilenceVisualizationColor(result) {
        if (result.consensusConfidence >= 0.9) return this.enhancedWorkflowSettings.visualization.timelineColors.silence;
        if (result.consensusConfidence >= 0.7) return '#8BC34A'; // Light green
        return '#CDDC39'; // Lime
    }

    getOverlapVisualizationColor(result) {
        switch (result.type) {
            case 'clipping':
                return this.enhancedWorkflowSettings.visualization.timelineColors.clipping;
            case 'loudness':
                return this.enhancedWorkflowSettings.visualization.timelineColors.loudness;
            case 'overlap':
                return this.enhancedWorkflowSettings.visualization.timelineColors.overlap;
            case 'background':
                return this.enhancedWorkflowSettings.visualization.timelineColors.background;
            default:
                return '#9E9E9E'; // Grey
        }
    }

    categorizeOverlapResult(result) {
        if (result.type.includes('clipping')) return 'clipping';
        if (result.type.includes('loudness')) return 'loudness';
        if (result.type.includes('overlap')) return 'overlap';
        if (result.type.includes('background')) return 'background';
        return 'other';
    }

    // Placeholder methods for UI integration
    updateSilenceResultsDisplay(results) {
        this.app.log(`📊 Updating silence results display with ${results.length} results`, 'info');
        // This would integrate with your existing UI display logic
    }

    updateOverlapResultsDisplay(results) {
        this.app.log(`📊 Updating overlap results display with ${results.length} results`, 'info');
        // This would integrate with your existing UI display logic
    }

    updateConfidenceIndicators(results) {
        this.app.log(`🎯 Updating confidence indicators for ${results.length} results`, 'info');
        // This would update confidence UI elements
    }

    updateIssueCategorization(results) {
        this.app.log(`🏷️ Updating issue categorization for ${results.length} results`, 'info');
        // This would update categorization UI elements
    }

    updateTimelineVisualization(results, type) {
        this.app.log(`🎨 Updating ${type} timeline visualization with ${results.length} results`, 'info');
        // This would update timeline visualization
    }

    enableEnhancedSilenceControls() {
        this.app.log('🔧 Enabling enhanced silence controls', 'info');
        // This would enable enhanced silence detection controls
    }

    enableEnhancedOverlapControls() {
        this.app.log('🔧 Enabling enhanced overlap controls', 'info');
        // This would enable enhanced overlap detection controls
    }

    // Placeholder methods for visualization generation
    async generateSilenceTimelineVisualization(results) {
        this.app.log('📊 Generating silence timeline visualization', 'info');
        // This would create timeline visualization for silence results
    }

    async generateConfidenceDistributionChart(results) {
        this.app.log('📊 Generating confidence distribution chart', 'info');
        // This would create confidence distribution chart
    }

    async generateMethodComparisonChart(results) {
        this.app.log('📊 Generating method comparison chart', 'info');
        // This would create method comparison chart
    }

    async generateOverlapTimelineVisualization(results) {
        this.app.log('📊 Generating overlap timeline visualization', 'info');
        // This would create timeline visualization for overlap results
    }

    async generateIssueTypeDistributionChart(results) {
        this.app.log('📊 Generating issue type distribution chart', 'info');
        // This would create issue type distribution chart
    }

    async generateSeverityHeatmap(results) {
        this.app.log('📊 Generating severity heatmap', 'info');
        // This would create severity heatmap
    }

    // Placeholder methods for resolution
    async applyEnhancedSilenceTrimming(results) {
        this.app.log('✂️ Applying enhanced silence trimming', 'info');
        // This would apply trimming based on silence detection results
        return { trimmed: results.length, method: 'enhanced' };
    }

    async applyEnhancedOverlapResolution(results) {
        this.app.log('🔧 Applying enhanced overlap resolution', 'info');
        // This would apply resolution methods for overlap issues
        return { resolved: results.length, method: 'enhanced' };
    }

    // Enhanced settings panel
    showEnhancedSettingsPanel() {
        this.app.log('⚙️ Showing enhanced settings panel', 'info');
        // This would show enhanced settings configuration
    }

    toggleEnhancedVisualization() {
        this.app.log('🎨 Toggling enhanced visualization', 'info');
        // This would toggle enhanced visualization features
    }

    // Configuration methods
    updateEnhancedWorkflowSettings(section, updates) {
        if (this.enhancedWorkflowSettings[section]) {
            Object.assign(this.enhancedWorkflowSettings[section], updates);
            this.app.log(`⚙️ Updated enhanced ${section} settings`, 'info');
            
            // Save to localStorage
            try {
                localStorage.setItem('enhancedWorkflowSettings', JSON.stringify(this.enhancedWorkflowSettings));
            } catch (error) {
                this.app.log('⚠️ Failed to save enhanced workflow settings', 'warning');
            }
        }
    }

    getEnhancedWorkflowSettings() {
        return { ...this.enhancedWorkflowSettings };
    }

    // Workflow history methods
    getWorkflowHistory() {
        return [...this.workflowHistory];
    }

    clearWorkflowHistory() {
        this.workflowHistory = [];
        this.app.log('🗑️ Enhanced workflow history cleared', 'info');
    }

    exportWorkflowHistory() {
        try {
            const dataStr = JSON.stringify(this.workflowHistory, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `enhanced_workflow_history_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.app.log('📤 Enhanced workflow history exported', 'success');
        } catch (error) {
            this.app.log(`❌ Failed to export workflow history: ${error.message}`, 'error');
        }
    }
}

module.exports = EnhancedFeatureManager;
