// ========================================
// RHYTHM & TIMING INTEGRATION SCRIPT
// ========================================

// Initialize rhythm and timing functionality when app loads
AudioToolsPro.prototype.initializeRhythmTiming = function() {
    this.log('🎵 Initializing Rhythm & Timing module...', 'info');
    
    // Load OpenAI API key from settings
    if (this.settings.openaiApiKey) {
        this.openaiConfig.apiKey = this.settings.openaiApiKey;
        this.openaiConfig.enabled = true;
        this.log('🤖 OpenAI API key loaded from settings', 'info');
    }
    
    // Setup UI event listeners
    this.setupRhythmTimingEventListeners();
    
    // Initialize waveform enhancements
    this.initializeEnhancedWaveform();
    
    this.log('✅ Rhythm & Timing module initialized', 'success');
};

// Setup enhanced event listeners for rhythm and timing
AudioToolsPro.prototype.setupRhythmTimingEventListeners = function() {
    // Update OpenAI API key on input change
    const apiKeyInput = document.getElementById('openaiApiKey');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', () => this.updateOpenAIApiKey());
        // Load existing value
        if (this.settings.openaiApiKey) {
            apiKeyInput.value = this.settings.openaiApiKey;
        }
    }
    
    // Enhanced analysis with waveform updates
    const analyzeButton = document.getElementById('analyzeRhythm');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async () => {
            await this.runEnhancedRhythmAnalysis();
        });
    }
    
    // Enhanced correction application
    const correctButton = document.getElementById('correctTiming');
    if (correctButton) {
        correctButton.addEventListener('click', async () => {
            await this.applyEnhancedTimingCorrections();
        });
    }
    
    // Enhanced preview with real audio
    const previewButton = document.getElementById('previewCorrections');
    if (previewButton) {
        previewButton.addEventListener('click', async () => {
            await this.generateEnhancedPreview();
        });
    }
};

// Initialize enhanced waveform visualization
AudioToolsPro.prototype.initializeEnhancedWaveform = function() {
    // Override the existing waveform drawing method
    const originalDrawWaveform = this.drawWaveformFromBlob;
    
    this.drawWaveformFromBlob = async function(audioBlob) {
        // Check if rhythm analysis results are available
        if (this.rhythmTimingConfig.analysisResults) {
            await this.drawEnhancedWaveformWithRhythm(audioBlob, this.rhythmTimingConfig.analysisResults);
        } else {
            // Fallback to original method
            await originalDrawWaveform.call(this, audioBlob);
        }
    };
};

// Enhanced rhythm analysis with all features
AudioToolsPro.prototype.runEnhancedRhythmAnalysis = async function() {
    try {
        this.log('🎯 Starting enhanced rhythm analysis...', 'info');
        
        // Run the existing analysis
        const corrections = await this.analyzeAudioRhythm();
        
        // Update waveform with rhythm analysis
        if (this.currentAudioBlob && this.rhythmTimingConfig.analysisResults) {
            await this.drawEnhancedWaveformWithRhythm(
                this.currentAudioBlob, 
                this.rhythmTimingConfig.analysisResults
            );
            
            // Add correction markers to waveform
            this.updateWaveformWithCorrections(corrections);
        }
        
        this.log('✅ Enhanced rhythm analysis completed', 'success');
        
    } catch (error) {
        this.log(`❌ Enhanced rhythm analysis failed: ${error.message}`, 'error');
        throw error;
    }
};

// Enhanced timing correction application with precise scheduling
AudioToolsPro.prototype.applyEnhancedTimingCorrections = async function() {
    try {
        this.log('🎛️ Applying enhanced timing corrections with precise scheduling...', 'info');
        
        const corrections = this.rhythmTimingConfig.corrections.filter(c => c.apply);
        
        if (corrections.length === 0) {
            this.log('⚠️ No corrections selected for application', 'warning');
            return 0;
        }
        
        // Initialize precise timing scheduler if not already done
        if (!this.preciseTimingScheduler) {
            this.initializePreciseTimingScheduler();
        }
        
        // Load current audio buffer
        const currentBuffer = this.rhythmTimingConfig.analysisAudioBuffer || 
                             await this.getAudioBufferFromPlayer();
        
        if (!currentBuffer) {
            throw new Error('No audio buffer available for correction');
        }
        
        // Apply corrections using precise timing
        const result = await this.applyPreciseTimingCorrections(currentBuffer, corrections);
        
        // Update UI with timing statistics
        this.displayTimingStats(result.timingStats);
        
        // Store corrected audio reference
        this.rhythmTimingConfig.correctedAudioBuffer = currentBuffer; // Reference to original
        this.rhythmTimingConfig.scheduledEventIds = result.scheduledEventIds;
        
        this.log(`✅ ${corrections.length} corrections applied with precise timing`, 'success');
        this.log(`   Average timing error: ${result.timingStats.averageTimingError.toFixed(3)}ms`, 'info');
        this.log(`   ${result.correctedSegments} audio segments scheduled`, 'info');
        
        return corrections.length;
        
    } catch (error) {
        this.log(`❌ Enhanced correction application failed: ${error.message}`, 'error');
        throw error;
    }
};

// Enhanced preview generation with full functionality
AudioToolsPro.prototype.generateEnhancedPreview = async function() {
    try {
        this.log('🎬 Generating enhanced preview...', 'info');
        
        // Generate the real audio preview
        const previewData = await this.generateCorrectionPreview();
        
        // Show enhanced preview controls with real audio
        this.showPreviewControls(previewData);
        
        // Update waveform with preview indicators
        if (previewData.hasRealAudio && previewData.correctedAudio) {
            // Show side-by-side waveform comparison in the future
            this.log('🎨 Preview waveform comparison ready', 'info');
        }
        
        this.log('✅ Enhanced preview ready', 'success');
        
    } catch (error) {
        this.log(`❌ Enhanced preview generation failed: ${error.message}`, 'error');
        throw error;
    }
};

// Complete workflow test
AudioToolsPro.prototype.testCompleteRhythmWorkflow = async function() {
    this.log('🧪 Testing complete Rhythm & Timing workflow...', 'info');
    
    try {
        // Step 1: Ensure audio is loaded
        if (!this.audioPlayer || !this.audioPlayer.src) {
            throw new Error('No audio loaded for testing');
        }
        
        this.log('1️⃣ Audio loaded ✅', 'info');
        
        // Step 2: Test OpenAI connection if enabled
        if (this.openaiConfig.enabled) {
            await this.testOpenAIConnection();
            this.log('2️⃣ OpenAI connection tested ✅', 'info');
        } else {
            this.log('2️⃣ OpenAI disabled, skipping ⚠️', 'warning');
        }
        
        // Step 3: Run analysis
        const corrections = await this.runEnhancedRhythmAnalysis();
        this.log(`3️⃣ Analysis complete: ${corrections.length} corrections found ✅`, 'info');
        
        // Step 4: Generate preview if corrections exist
        if (corrections.length > 0) {
            await this.generateEnhancedPreview();
            this.log('4️⃣ Preview generated ✅', 'info');
        } else {
            this.log('4️⃣ No corrections to preview ⚠️', 'warning');
        }
        
        // Step 5: Test correction application (simulate)
        if (corrections.length > 0) {
            const testCorrections = corrections.slice(0, 1); // Test with first correction
            testCorrections[0].apply = true;
            
            await this.applyEnhancedTimingCorrections();
            this.log('5️⃣ Correction application tested ✅', 'info');
        }
        
        this.log('🎉 Complete workflow test PASSED!', 'success');
        this.showUIMessage('🎉 Complete Rhythm & Timing workflow test passed!', 'success');
        
        return {
            success: true,
            corrections: corrections.length,
            openaiEnabled: this.openaiConfig.enabled,
            previewGenerated: corrections.length > 0
        };
        
    } catch (error) {
        this.log(`❌ Workflow test FAILED: ${error.message}`, 'error');
        this.showUIMessage(`❌ Workflow test failed: ${error.message}`, 'error');
        
        return {
            success: false,
            error: error.message
        };
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add workflow test button if in debug mode
    if (window.location.search.includes('debug=true')) {
        const testButton = document.createElement('button');
        testButton.id = 'testRhythmWorkflow';
        testButton.className = 'action-btn secondary';
        testButton.innerHTML = '<i class="fas fa-vial"></i> Test Complete Workflow';
        testButton.style.margin = '10px';
        
        const actionsContainer = document.querySelector('#feature4 .feature-actions');
        if (actionsContainer) {
            actionsContainer.appendChild(testButton);
            
            testButton.addEventListener('click', async () => {
                if (window.audioToolsPro) {
                    await window.audioToolsPro.testCompleteRhythmWorkflow();
                }
            });
        }
    }
});

// Display timing statistics in UI
AudioToolsPro.prototype.displayTimingStats = function(stats) {
    const timingStatsElement = document.getElementById('timingStats');
    const timingStatsPanel = document.getElementById('timingStatsPanel');
    
    if (!timingStatsElement) return;
    
    // Show the timing stats panel
    if (timingStatsPanel) {
        timingStatsPanel.style.display = 'block';
    }
    
    timingStatsElement.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">Scheduled Events:</span>
                <span class="stat-value">${stats.scheduledEvents}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Error:</span>
                <span class="stat-value">${stats.averageTimingError.toFixed(2)}ms</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Max Error:</span>
                <span class="stat-value">${stats.maxTimingError.toFixed(2)}ms</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Within Tolerance:</span>
                <span class="stat-value">${stats.withinTolerance}/${stats.totalEvents}</span>
            </div>
        </div>
    `;
    
    // Color-code based on performance
    const avgError = stats.averageTimingError;
    const maxError = stats.maxTimingError;
    
    const avgElement = timingStatsElement.querySelector('.stat-item:nth-child(2) .stat-value');
    const maxElement = timingStatsElement.querySelector('.stat-item:nth-child(3) .stat-value');
    
    if (avgElement) {
        avgElement.style.color = avgError <= 5 ? 'var(--color-accent-success)' : 
                                avgError <= 50 ? 'var(--color-accent-warning)' : 
                                'var(--color-accent-error)';
    }
    
    if (maxElement) {
        maxElement.style.color = maxError <= 300 ? 'var(--color-accent-success)' : 
                                'var(--color-accent-error)';
    }
};

// Get audio buffer from current player
AudioToolsPro.prototype.getAudioBufferFromPlayer = async function() {
    if (!this.audioPlayer || !this.audioPlayer.src) {
        throw new Error('No audio loaded in player');
    }
    
    try {
        // If we already have the buffer stored, return it
        if (this.currentAudioBuffer) {
            return this.currentAudioBuffer;
        }
        
        // Otherwise, decode from the current audio source
        const response = await fetch(this.audioPlayer.src);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Store for future use
        this.currentAudioBuffer = audioBuffer;
        
        return audioBuffer;
        
    } catch (error) {
        throw new Error(`Failed to get audio buffer: ${error.message}`);
    }
};

// Enhanced error handling for rhythm and timing
AudioToolsPro.prototype.handleRhythmTimingError = function(error, context) {
    this.log(`❌ Rhythm & Timing error in ${context}: ${error.message}`, 'error');
    
    // Specific error handling
    if (error.message.includes('OpenAI')) {
        this.showUIMessage('🤖 OpenAI API issue. Check your API key and try again.', 'error');
    } else if (error.message.includes('audio')) {
        this.showUIMessage('🎵 Audio processing error. Please load valid audio first.', 'error');
    } else if (error.message.includes('buffer')) {
        this.showUIMessage('💾 Audio buffer error. Try reloading the audio.', 'error');
    } else {
        this.showUIMessage(`❌ ${context} failed: ${error.message}`, 'error');
    }
    
    // Reset processing states
    if (this.rhythmTimingConfig) {
        this.rhythmTimingConfig.processing = false;
        this.rhythmTimingConfig.previewMode = false;
    }
    
    // Re-enable disabled buttons
    ['analyzeRhythm', 'correctTiming', 'previewCorrections'].forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = button.innerHTML.replace('fa-spinner fa-spin', 'fa-chart-line');
        }
    });
};