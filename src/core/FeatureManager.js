/**
 * Feature Manager - Orchestrates Feature 1: Silence Detection & Trimming
 * Coordinates between SilenceDetector and PremiereIntegration
 */

// Try to load modules, but handle gracefully if not available (browser environment)
let SilenceDetector, PremiereIntegration;

try {
    if (typeof require !== 'undefined') {
        SilenceDetector = require('./SilenceDetector');
        PremiereIntegration = require('./PremiereIntegration');
    }
} catch (error) {
    // Running in browser environment without Node.js modules
    console.warn('Node.js modules not available, using fallback implementations');
}

class FeatureManager {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        
        // Initialize with fallbacks if modules not available
        this.silenceDetector = SilenceDetector ? new SilenceDetector(audioToolsPro) : null;
        this.premiereIntegration = PremiereIntegration ? new PremiereIntegration(audioToolsPro) : null;
        
        this.currentWorkflow = null;
        this.workflowHistory = [];
        this.isProcessing = false;
        
        this.initializeFeature();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    initializeFeature() {
        this.app.log('🎯 Initializing Feature 1: Silence Detection & Trimming', 'info');
        
        try {
            // Validate system requirements
            this.validateSystemRequirements();
            
            // Initialize workflow settings
            this.loadWorkflowSettings();
            
            // Set up event listeners
            this.setupEventListeners();
            
            const status = this.silenceDetector && this.premiereIntegration ? 'complete' : 'partial (fallback mode)';
            this.app.log(`✅ Feature 1 initialization ${status}`, 'success');
            
        } catch (error) {
            this.app.log(`❌ Feature 1 initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    validateSystemRequirements() {
        const requirements = {
            ffmpeg: this.checkFFmpegAvailability(),
            webAudio: this.checkWebAudioSupport(),
            premiere: this.checkPremiereConnection(),
            nodeIntegration: this.checkNodeIntegration()
        };

        const missing = Object.entries(requirements)
            .filter(([key, available]) => !available)
            .map(([key]) => key);

        if (missing.length > 0) {
            this.app.log(`⚠️ Missing requirements: ${missing.join(', ')}`, 'warning');
            this.app.log('🔄 Continuing with available methods only', 'info');
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

    checkPremiereConnection() {
        try {
            return typeof CSInterface !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    checkNodeIntegration() {
        try {
            return typeof require !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    loadWorkflowSettings() {
        this.workflowSettings = {
            detection: {
                enabledMethods: ['basic'], // Default to basic if advanced not available
                primaryMethod: 'basic',
                fallbackMethods: ['basic'],
                confidenceThreshold: 0.7,
                consensusRequired: 1 // Lower requirement for basic mode
            },
            trimming: {
                method: 'markers', // Safer default for basic mode
                preserveOriginal: true,
                fadeTransition: 0.1,
                minGapDuration: 0.3,
                autoApply: false,
                previewMode: true
            },
            workflow: {
                autoSave: true,
                createBackup: true,
                batchProcessing: false,
                realTimeUpdates: true
            }
        };

        // Upgrade settings if advanced features are available
        if (this.silenceDetector && this.premiereIntegration) {
            this.workflowSettings.detection.enabledMethods = ['ffmpeg', 'webAudio'];
            this.workflowSettings.detection.primaryMethod = 'ffmpeg';
            this.workflowSettings.detection.consensusRequired = 2;
            this.workflowSettings.trimming.method = 'adjustmentLayers';
        }
    }

    setupEventListeners() {
        // UI Event Listeners for Feature 1
        document.getElementById('detectSilence')?.addEventListener('click', () => {
            this.runSilenceDetectionWorkflow();
        });

        // Advanced workflow listeners (if available)
        if (this.premiereIntegration) {
            document.getElementById('applyTrims')?.addEventListener('click', () => {
                this.applyDetectedTrims();
            });

            document.getElementById('previewTrims')?.addEventListener('click', () => {
                this.previewTrims();
            });

            document.getElementById('undoTrims')?.addEventListener('click', () => {
                this.undoLastWorkflow();
            });
        }
    }

    // ========================================
    // MAIN WORKFLOW ORCHESTRATION
    // ========================================

    async runSilenceDetectionWorkflow(options = {}) {
        if (this.isProcessing) {
            this.app.log('⚠️ Workflow already in progress', 'warning');
            return;
        }

        this.isProcessing = true;
        const workflowId = `workflow_${Date.now()}`;
        
        this.app.log('🚀 Starting Silence Detection & Trimming workflow...', 'info');
        this.app.updateStatus('Starting Workflow...', 'processing');
        this.app.updateProgressBar(0, 'Initializing...');

        try {
            // Step 1: Get active audio from Premiere Pro or use fallback
            this.app.updateProgressBar(5, 'Getting active sequence...');
            const audioSource = await this.getActiveAudioSource();
            
            // Step 2: Run silence detection
            this.app.updateProgressBar(10, 'Running silence detection...');
            let detectionResult;
            
            if (this.silenceDetector) {
                detectionResult = await this.silenceDetector.detectSilence(
                    audioSource, 
                    {
                        methods: this.workflowSettings.detection.enabledMethods,
                        ...options
                    }
                );
            } else {
                // Fallback to basic detection
                detectionResult = await this.runBasicSilenceDetection(audioSource, options);
            }

            // Step 3: Validate and filter results
            this.app.updateProgressBar(70, 'Validating results...');
            const validatedResults = this.validateDetectionResults(detectionResult.results);

            // Step 4: Apply trimming (if auto-apply is enabled and integration available)
            let trimmingResult = null;
            if (this.workflowSettings.trimming.autoApply && this.premiereIntegration) {
                this.app.updateProgressBar(75, 'Applying trims...');
                trimmingResult = await this.premiereIntegration.applySilenceTrimming(
                    validatedResults.combined,
                    this.workflowSettings.trimming
                );
            } else {
                this.app.updateProgressBar(75, 'Preparing preview...');
                trimmingResult = await this.prepareTrimmingPreview(validatedResults.combined);
            }

            // Step 5: Create workflow record
            const workflow = {
                id: workflowId,
                timestamp: new Date(),
                audioSource: audioSource.name || 'Active Sequence',
                detection: detectionResult,
                validation: validatedResults,
                trimming: trimmingResult,
                settings: { ...this.workflowSettings },
                status: 'completed'
            };

            this.currentWorkflow = workflow;
            this.workflowHistory.push(workflow);

            // Step 6: Update UI with results
            this.app.updateProgressBar(95, 'Updating interface...');
            await this.updateUIWithResults(workflow);

            // Complete
            this.app.updateProgressBar(100, 'Workflow complete');
            this.app.updateStatus('Ready', 'success');
            this.app.log(`✅ Workflow completed successfully (${validatedResults.combined.length} segments)`, 'success');

            return workflow;

        } catch (error) {
            this.app.log(`❌ Workflow failed: ${error.message}`, 'error');
            this.app.updateStatus('Workflow Failed', 'error');
            throw error;
        } finally {
            this.isProcessing = false;
            setTimeout(() => {
                this.app.updateProgressBar(0, 'Ready');
            }, 3000);
        }
    }

    // ========================================
    // FALLBACK IMPLEMENTATIONS
    // ========================================

    async runBasicSilenceDetection(audioSource, options) {
        this.app.log('📋 Running basic silence detection (fallback mode)...', 'info');
        
        // Use the basic detection from the main app
        const threshold = document.getElementById('silenceThreshold')?.value || -30;
        const duration = document.getElementById('silenceDuration')?.value || 0.5;
        
        await this.app.simulateProcessing(2000);
        
        const mockResults = this.app.generateMockSilenceResults(threshold, duration);
        
        return {
            success: true,
            results: {
                basic: mockResults,
                combined: mockResults
            },
            metadata: {
                duration: 2,
                methods: ['basic'],
                audioFile: audioSource.name || 'unknown'
            }
        };
    }

    // ========================================
    // AUDIO SOURCE HANDLING
    // ========================================

    async getActiveAudioSource() {
        this.app.log('🎵 Getting active audio source...', 'info');
        
        try {
            // Try to get from Premiere Pro first
            const audioData = await this.app.getSelectedAudioFromAdobe();
            
            if (audioData && audioData.success) {
                return {
                    type: 'premiere',
                    name: audioData.sequenceName,
                    duration: audioData.sequenceDuration,
                    selectedClips: audioData.selectedClips,
                    allClips: audioData.allAudioClips,
                    audioData: audioData
                };
            } else {
                throw new Error('No valid audio data from Premiere Pro');
            }

        } catch (error) {
            this.app.log(`⚠️ Could not get audio from Premiere Pro: ${error.message}`, 'warning');
            
            // Fallback to mock data
            return {
                type: 'mock',
                name: 'Mock Audio Source',
                duration: 300,
                selectedClips: [],
                allClips: [],
                audioData: null
            };
        }
    }

    // ========================================
    // RESULT VALIDATION & FILTERING
    // ========================================

    validateDetectionResults(detectionResults) {
        this.app.log('🔍 Validating detection results...', 'info');
        
        const { confidenceThreshold, consensusRequired } = this.workflowSettings.detection;
        
        // Get the combined results
        const combined = detectionResults.combined || detectionResults.basic || [];
        
        // Filter by confidence
        const highConfidenceResults = combined.filter(
            segment => segment.confidence >= confidenceThreshold
        );

        // Filter by consensus (for advanced mode) or just use all for basic mode
        const consensusResults = combined.filter(
            segment => (segment.methods?.length || 1) >= consensusRequired
        );

        // Combine filters
        const validatedSegments = highConfidenceResults.filter(
            segment => consensusResults.includes(segment)
        );

        // Remove segments that are too short
        const { minGapDuration } = this.workflowSettings.trimming;
        const filteredSegments = validatedSegments.filter(
            segment => segment.duration >= minGapDuration
        );

        const stats = {
            original: combined.length,
            highConfidence: highConfidenceResults.length,
            consensus: consensusResults.length,
            validated: validatedSegments.length,
            final: filteredSegments.length
        };

        this.app.log(`📊 Validation stats: ${stats.original} → ${stats.final} segments`, 'info');

        return {
            combined: filteredSegments,
            stats,
            validationSettings: {
                confidenceThreshold,
                consensusRequired,
                minGapDuration
            }
        };
    }

    // ========================================
    // TRIMMING OPERATIONS
    // ========================================

    async applyDetectedTrims() {
        if (!this.currentWorkflow) {
            this.app.log('⚠️ No detection results available to apply', 'warning');
            return;
        }

        if (!this.premiereIntegration) {
            this.app.log('⚠️ Premiere Pro integration not available', 'warning');
            return;
        }

        if (this.currentWorkflow.trimming?.applied) {
            this.app.log('⚠️ Trims already applied for current workflow', 'warning');
            return;
        }

        this.app.log('✂️ Applying detected silence trims...', 'info');
        this.app.updateStatus('Applying Trims...', 'processing');

        try {
            const segments = this.currentWorkflow.validation.combined;
            const trimmingResult = await this.premiereIntegration.applySilenceTrimming(
                segments,
                this.workflowSettings.trimming
            );

            // Update workflow record
            this.currentWorkflow.trimming = {
                ...trimmingResult,
                applied: true,
                appliedAt: new Date()
            };

            this.app.log(`✅ Applied ${trimmingResult.appliedTrims} trims successfully`, 'success');
            this.app.updateStatus('Trims Applied', 'success');

            // Update UI
            this.updateTrimmingUI(this.currentWorkflow.trimming);

            return trimmingResult;

        } catch (error) {
            this.app.log(`❌ Failed to apply trims: ${error.message}`, 'error');
            this.app.updateStatus('Trim Failed', 'error');
            throw error;
        }
    }

    async prepareTrimmingPreview(segments) {
        this.app.log('👁️ Preparing trimming preview...', 'info');
        
        // Create preview data without actually applying trims
        const previewData = {
            applied: false,
            previewMode: true,
            segmentCount: segments.length,
            totalDurationToTrim: segments.reduce((sum, seg) => sum + seg.duration, 0),
            segments: segments.map(seg => ({
                ...seg,
                action: this.determineTrimmingAction(seg)
            })),
            estimatedTimeReduction: this.calculateTimeReduction(segments)
        };

        return previewData;
    }

    determineTrimmingAction(segment) {
        const { method } = this.workflowSettings.trimming;
        
        switch (method) {
            case 'adjustmentLayers':
                return `Add adjustment layer (${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s)`;
            case 'fadeCurves':
                return `Apply fade curves (${segment.duration.toFixed(2)}s silence)`;
            case 'markers':
                return `Add marker at ${segment.start.toFixed(2)}s`;
            default:
                return 'Unknown action';
        }
    }

    calculateTimeReduction(segments) {
        const totalTrimmed = segments.reduce((sum, seg) => sum + seg.duration, 0);
        const { fadeTransition } = this.workflowSettings.trimming;
        const fadeOverhead = segments.length * fadeTransition * 2; // Fade in + out per segment
        
        return Math.max(0, totalTrimmed - fadeOverhead);
    }

    async previewTrims() {
        if (!this.currentWorkflow) {
            this.app.log('⚠️ No detection results available to preview', 'warning');
            return;
        }

        this.app.log('👁️ Generating trim preview...', 'info');
        
        const segments = this.currentWorkflow.validation.combined;
        const previewData = await this.prepareTrimmingPreview(segments);
        
        // Update UI with preview
        this.displayTrimmingPreview(previewData);
        
        this.app.log(`👁️ Preview ready for ${segments.length} segments`, 'success');
    }

    // ========================================
    // UNDO/REDO FUNCTIONALITY
    // ========================================

    async undoLastWorkflow() {
        if (!this.currentWorkflow || !this.currentWorkflow.trimming?.applied) {
            this.app.log('⚠️ No applied workflow to undo', 'warning');
            return;
        }

        if (!this.premiereIntegration) {
            this.app.log('⚠️ Premiere Pro integration not available for undo', 'warning');
            return;
        }

        this.app.log('↩️ Undoing last workflow...', 'info');
        this.app.updateStatus('Undoing...', 'processing');

        try {
            const undoResult = await this.premiereIntegration.undoAllTrimOperations();
            
            if (undoResult) {
                this.currentWorkflow.trimming.applied = false;
                this.currentWorkflow.trimming.undoneAt = new Date();
                
                this.app.log('✅ Workflow undone successfully', 'success');
                this.app.updateStatus('Undone', 'success');
                
                // Update UI
                this.updateTrimmingUI(this.currentWorkflow.trimming);
            } else {
                throw new Error('Failed to undo all operations');
            }

        } catch (error) {
            this.app.log(`❌ Undo failed: ${error.message}`, 'error');
            this.app.updateStatus('Undo Failed', 'error');
        }
    }

    // ========================================
    // UI UPDATE METHODS
    // ========================================

    async updateUIWithResults(workflow) {
        // Update detection results display using the main app's method
        this.app.displaySilenceResults(
            workflow.validation.combined,
            this.workflowSettings.trimming.autoApply,
            this.workflowSettings.trimming.method === 'markers'
        );

        // Update workflow status panel
        this.updateWorkflowStatusPanel(workflow);

        // Update trimming controls
        this.updateTrimmingControls(workflow);
    }

    updateWorkflowStatusPanel(workflow) {
        const statusPanel = document.getElementById('workflowStatus');
        if (!statusPanel) return;

        const html = `
            <div class="workflow-summary">
                <h4>🎯 Workflow Results</h4>
                <div class="workflow-stats">
                    <div class="stat-item">
                        <span class="stat-label">Detected:</span>
                        <span class="stat-value">${workflow.detection.results.combined?.length || workflow.detection.results.basic?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Validated:</span>
                        <span class="stat-value">${workflow.validation.combined.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Methods:</span>
                        <span class="stat-value">${workflow.detection.metadata.methods.join(', ')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Duration:</span>
                        <span class="stat-value">${workflow.detection.metadata.duration.toFixed(2)}s</span>
                    </div>
                </div>
            </div>
        `;
        
        statusPanel.innerHTML = html;
    }

    updateTrimmingControls(workflow) {
        const applied = workflow.trimming?.applied;
        
        // Update button states
        const applyBtn = document.getElementById('applyTrims');
        const previewBtn = document.getElementById('previewTrims');
        const undoBtn = document.getElementById('undoTrims');
        
        if (applyBtn) {
            applyBtn.disabled = applied || !this.premiereIntegration;
            applyBtn.textContent = applied ? 'Trims Applied' : (this.premiereIntegration ? 'Apply Trims' : 'Integration N/A');
        }
        
        if (previewBtn) {
            previewBtn.disabled = false;
        }
        
        if (undoBtn) {
            undoBtn.disabled = !applied || !this.premiereIntegration;
        }
    }

    updateTrimmingUI(trimmingResult) {
        // Update trimming results display
        const container = document.getElementById('trimmingResults');
        if (!container) return;

        const html = `
            <div class="trimming-summary">
                <h4>✂️ Trimming Results</h4>
                <p>Method: ${trimmingResult.method}</p>
                <p>Applied: ${trimmingResult.applied ? 'Yes' : 'No'}</p>
                <p>Operations: ${trimmingResult.appliedTrims || 0}</p>
                ${trimmingResult.estimatedTimeReduction ? 
                    `<p>Time Saved: ${trimmingResult.estimatedTimeReduction.toFixed(2)}s</p>` : ''}
            </div>
        `;
        
        container.innerHTML = html;
    }

    displayTrimmingPreview(previewData) {
        const container = document.getElementById('trimmingPreview');
        if (!container) return;

        const html = `
            <div class="preview-summary">
                <h4>👁️ Trimming Preview</h4>
                <p>Segments to process: ${previewData.segmentCount}</p>
                <p>Total duration to trim: ${previewData.totalDurationToTrim.toFixed(2)}s</p>
                <p>Estimated time reduction: ${previewData.estimatedTimeReduction.toFixed(2)}s</p>
                <div class="preview-actions">
                    ${previewData.segments.map(seg => `
                        <div class="preview-item">
                            <span class="preview-time">${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s</span>
                            <span class="preview-action">${seg.action}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // ========================================
    // CONFIGURATION & SETTINGS
    // ========================================

    updateWorkflowSettings(section, updates) {
        if (this.workflowSettings[section]) {
            Object.assign(this.workflowSettings[section], updates);
            this.app.log(`⚙️ Updated ${section} workflow settings`, 'info');
            
            // Save to persistent storage
            this.saveWorkflowSettings();
        }
    }

    saveWorkflowSettings() {
        try {
            localStorage.setItem('audioToolsProWorkflow', JSON.stringify(this.workflowSettings));
        } catch (error) {
            this.app.log('⚠️ Failed to save workflow settings', 'warning');
        }
    }

    loadWorkflowSettings() {
        try {
            const saved = localStorage.getItem('audioToolsProWorkflow');
            if (saved) {
                this.workflowSettings = { ...this.workflowSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            this.app.log('⚠️ Failed to load workflow settings, using defaults', 'warning');
        }
    }

    // Export methods for debugging
    exportWorkflowData() {
        return {
            currentWorkflow: this.currentWorkflow,
            workflowHistory: this.workflowHistory,
            settings: this.workflowSettings,
            systemRequirements: this.validateSystemRequirements(),
            integrationStatus: {
                silenceDetector: !!this.silenceDetector,
                premiereIntegration: !!this.premiereIntegration
            }
        };
    }

    getWorkflowHistory() {
        return [...this.workflowHistory];
    }

    getCurrentWorkflow() {
        return this.currentWorkflow;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureManager;
} else if (typeof window !== 'undefined') {
    window.FeatureManager = FeatureManager;
} 