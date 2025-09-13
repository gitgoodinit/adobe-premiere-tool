// ========================================
// REAL AUDIO PREVIEW FUNCTIONALITY
// ========================================

// Generate real audio preview with before/after comparison
AudioToolsPro.prototype.generateCorrectionPreview = async function() {
    this.log('🎵 Generating real audio preview with corrections...', 'info');
    
    try {
        const corrections = this.rhythmTimingConfig.corrections.filter(c => c.apply);
        const totalTimeSaved = corrections.reduce((sum, c) => sum + c.timingSavings, 0);
        
        // Generate actual corrected audio if corrections are applied
        let correctedAudioBuffer = null;
        if (this.rhythmTimingConfig.correctedAudioBuffer) {
            correctedAudioBuffer = this.rhythmTimingConfig.correctedAudioBuffer;
            this.log('✅ Using existing corrected audio buffer for preview', 'info');
        } else if (corrections.length > 0) {
            // Apply corrections to generate preview audio
            const originalBuffer = await this.getAudioBufferFromPlayer();
            if (originalBuffer) {
                correctedAudioBuffer = await this.applyTimeStretchingCorrections(
                    originalBuffer, corrections, this.rhythmTimingConfig.stretchAlgorithm
                );
                this.rhythmTimingConfig.correctedAudioBuffer = correctedAudioBuffer;
                this.log('✅ Generated new corrected audio buffer for preview', 'info');
            }
        }
        
        // Create audio blobs for playback
        let originalBlob = null;
        let correctedBlob = null;
        
        if (this.currentAudioBlob) {
            originalBlob = this.currentAudioBlob;
        }
        
        if (correctedAudioBuffer) {
            correctedBlob = await this.audioBufferToBlob(correctedAudioBuffer);
        }
        
        return {
            originalDuration: this.audioPlayer ? this.audioPlayer.duration : 0,
            correctedDuration: correctedAudioBuffer ? correctedAudioBuffer.duration : 0,
            timeSaved: totalTimeSaved,
            correctionsApplied: corrections.length,
            previewSegments: corrections.map(c => ({
                timestamp: c.timestamp,
                type: c.type,
                change: c.timingSavings
            })),
            // Real audio data for preview
            originalAudio: originalBlob,
            correctedAudio: correctedBlob,
            hasRealAudio: !!(originalBlob && correctedBlob)
        };
        
    } catch (error) {
        this.log(`❌ Preview generation error: ${error.message}`, 'error');
        
        // Fallback to metadata-only preview
        const corrections = this.rhythmTimingConfig.corrections.filter(c => c.apply);
        const totalTimeSaved = corrections.reduce((sum, c) => sum + c.timingSavings, 0);
        
        return {
            originalDuration: this.audioPlayer ? this.audioPlayer.duration : 0,
            correctedDuration: (this.audioPlayer ? this.audioPlayer.duration : 0) - totalTimeSaved,
            timeSaved: totalTimeSaved,
            correctionsApplied: corrections.length,
            previewSegments: corrections.map(c => ({
                timestamp: c.timestamp,
                type: c.type,
                change: c.timingSavings
            })),
            originalAudio: null,
            correctedAudio: null,
            hasRealAudio: false,
            error: error.message
        };
    }
};

// Convert AudioBuffer to Blob for playback
AudioToolsPro.prototype.audioBufferToBlob = async function(audioBuffer) {
    try {
        // Create WAV file from AudioBuffer
        const wav = this.audioBufferToWav(audioBuffer);
        return new Blob([wav], { type: 'audio/wav' });
    } catch (error) {
        this.log(`❌ AudioBuffer to Blob conversion failed: ${error.message}`, 'error');
        throw error;
    }
};

// Convert AudioBuffer to WAV format
AudioToolsPro.prototype.audioBufferToWav = function(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const buffer = audioBuffer.getChannelData(0);
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * numChannels * bytesPerSample);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    let offset = 0;
    writeString(offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + length * numChannels * bytesPerSample, true); offset += 4;
    writeString(offset, 'WAVE'); offset += 4;
    writeString(offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, format, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitDepth, true); offset += 2;
    writeString(offset, 'data'); offset += 4;
    view.setUint32(offset, length * numChannels * bytesPerSample, true); offset += 4;
    
    // Write audio data
    const volume = 0.8;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            let sample = Math.max(-1, Math.min(1, channelData[i]));
            sample = sample * volume * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }
    
    return arrayBuffer;
};

// Enhanced preview controls with real audio playback
AudioToolsPro.prototype.showPreviewControls = function(previewData) {
    const container = document.getElementById('rhythmAnalysis');
    if (!container) return;
    
    const hasRealAudio = previewData.hasRealAudio;
    
    const previewHTML = `
        <div class="preview-controls">
            <div class="preview-header">
                <h5><i class="fas fa-play"></i> Timing Correction Preview</h5>
                <div class="preview-stats">
                    <span class="stat">
                        <i class="fas fa-clock"></i>
                        Original: ${this.formatTime(previewData.originalDuration)}
                    </span>
                    <span class="stat">
                        <i class="fas fa-forward"></i>
                        Corrected: ${this.formatTime(previewData.correctedDuration)}
                    </span>
                    <span class="stat ${previewData.timeSaved > 0 ? 'positive' : ''}">
                        <i class="fas fa-save"></i>
                        Saved: ${this.formatTime(previewData.timeSaved)}
                    </span>
                </div>
            </div>
            
            ${hasRealAudio ? `
            <div class="audio-comparison">
                <div class="audio-player-section">
                    <h6><i class="fas fa-volume-up"></i> Original Audio</h6>
                    <audio controls id="originalAudioPreview" class="preview-audio">
                        Your browser does not support audio playback.
                    </audio>
                </div>
                
                <div class="audio-player-section">
                    <h6><i class="fas fa-magic"></i> Corrected Audio</h6>
                    <audio controls id="correctedAudioPreview" class="preview-audio">
                        Your browser does not support audio playback.
                    </audio>
                </div>
                
                <div class="playback-controls">
                    <button class="action-btn secondary" id="playBothAudio">
                        <i class="fas fa-play-circle"></i> Compare Side-by-Side
                    </button>
                    <button class="action-btn secondary" id="syncPlayback">
                        <i class="fas fa-sync"></i> Sync Playback
                    </button>
                </div>
            </div>
            ` : `
            <div class="audio-preview-unavailable">
                <div class="info-box warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Preview Audio Unavailable</strong>
                        <p>${previewData.error || 'Audio preview generation failed. Showing timing changes only.'}</p>
                    </div>
                </div>
            </div>
            `}
            
            <div class="correction-summary">
                <h6><i class="fas fa-list"></i> Applied Corrections (${previewData.correctionsApplied})</h6>
                <div class="corrections-list">
                    ${previewData.previewSegments.map(segment => `
                        <div class="correction-item ${segment.change > 0 ? 'time-saved' : 'time-added'}">
                            <span class="correction-time">${this.formatTime(segment.timestamp)}</span>
                            <span class="correction-type">${segment.type.replace('_', ' ')}</span>
                            <span class="correction-change">
                                ${segment.change > 0 ? '-' : '+'}${this.formatTime(Math.abs(segment.change))}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="preview-actions">
                <button class="action-btn primary" id="applyPreviewedCorrections">
                    <i class="fas fa-check"></i> Apply These Corrections
                </button>
                <button class="action-btn secondary" id="regeneratePreview">
                    <i class="fas fa-refresh"></i> Regenerate Preview
                </button>
                <button class="action-btn secondary" id="exportCorrectedAudio">
                    <i class="fas fa-download"></i> Export Corrected Audio
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = previewHTML;
    
    // Setup real audio players if available
    if (hasRealAudio) {
        this.setupPreviewAudioPlayers(previewData);
    }
    
    // Setup preview control event listeners
    this.setupPreviewControlListeners();
};

// Setup real audio players for before/after comparison
AudioToolsPro.prototype.setupPreviewAudioPlayers = function(previewData) {
    const originalPlayer = document.getElementById('originalAudioPreview');
    const correctedPlayer = document.getElementById('correctedAudioPreview');
    
    if (originalPlayer && previewData.originalAudio) {
        const originalURL = URL.createObjectURL(previewData.originalAudio);
        originalPlayer.src = originalURL;
        originalPlayer.addEventListener('loadedmetadata', () => {
            this.log(`🎵 Original audio loaded: ${this.formatTime(originalPlayer.duration)}`, 'info');
        });
    }
    
    if (correctedPlayer && previewData.correctedAudio) {
        const correctedURL = URL.createObjectURL(previewData.correctedAudio);
        correctedPlayer.src = correctedURL;
        correctedPlayer.addEventListener('loadedmetadata', () => {
            this.log(`✨ Corrected audio loaded: ${this.formatTime(correctedPlayer.duration)}`, 'info');
        });
    }
};

// Setup preview control event listeners
AudioToolsPro.prototype.setupPreviewControlListeners = function() {
    // Compare side-by-side playback
    const playBothBtn = document.getElementById('playBothAudio');
    if (playBothBtn) {
        playBothBtn.addEventListener('click', () => this.playBothAudioSamples());
    }
    
    // Synchronized playback
    const syncBtn = document.getElementById('syncPlayback');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => this.toggleSyncPlayback());
    }
    
    // Apply corrections
    const applyBtn = document.getElementById('applyPreviewedCorrections');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => this.applyPreviewedCorrections());
    }
    
    // Regenerate preview
    const regenBtn = document.getElementById('regeneratePreview');
    if (regenBtn) {
        regenBtn.addEventListener('click', () => this.regeneratePreview());
    }
    
    // Export corrected audio
    const exportBtn = document.getElementById('exportCorrectedAudio');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => this.exportCorrectedAudio());
    }
};

// Play both audio samples for comparison
AudioToolsPro.prototype.playBothAudioSamples = function() {
    const originalPlayer = document.getElementById('originalAudioPreview');
    const correctedPlayer = document.getElementById('correctedAudioPreview');
    
    if (originalPlayer && correctedPlayer) {
        // Reset to beginning
        originalPlayer.currentTime = 0;
        correctedPlayer.currentTime = 0;
        
        // Play original first, then corrected after a short delay
        originalPlayer.play();
        
        setTimeout(() => {
            correctedPlayer.play();
        }, Math.min(originalPlayer.duration * 1000, 5000) + 500); // Play corrected after original + 500ms gap
        
        this.log('🔄 Playing both audio samples for comparison', 'info');
    }
};

// Toggle synchronized playback
AudioToolsPro.prototype.toggleSyncPlayback = function() {
    const originalPlayer = document.getElementById('originalAudioPreview');
    const correctedPlayer = document.getElementById('correctedAudioPreview');
    const syncBtn = document.getElementById('syncPlayback');
    
    if (originalPlayer && correctedPlayer && syncBtn) {
        if (this.syncPlaybackActive) {
            // Disable sync
            originalPlayer.removeEventListener('play', this.syncPlayHandler);
            originalPlayer.removeEventListener('pause', this.syncPauseHandler);
            originalPlayer.removeEventListener('seeked', this.syncSeekHandler);
            
            this.syncPlaybackActive = false;
            syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Playback';
            this.log('🔄 Synchronized playback disabled', 'info');
        } else {
            // Enable sync
            this.syncPlayHandler = () => {
                correctedPlayer.currentTime = originalPlayer.currentTime;
                correctedPlayer.play();
            };
            
            this.syncPauseHandler = () => {
                correctedPlayer.pause();
            };
            
            this.syncSeekHandler = () => {
                correctedPlayer.currentTime = originalPlayer.currentTime;
            };
            
            originalPlayer.addEventListener('play', this.syncPlayHandler);
            originalPlayer.addEventListener('pause', this.syncPauseHandler);
            originalPlayer.addEventListener('seeked', this.syncSeekHandler);
            
            this.syncPlaybackActive = true;
            syncBtn.innerHTML = '<i class="fas fa-sync"></i> Disable Sync';
            this.log('🔄 Synchronized playback enabled', 'info');
        }
    }
};

// Apply the previewed corrections
AudioToolsPro.prototype.applyPreviewedCorrections = async function() {
    try {
        this.log('✅ Applying previewed timing corrections...', 'info');
        
        if (this.rhythmTimingConfig.correctedAudioBuffer) {
            // Replace current audio with corrected version
            const correctedBlob = await this.audioBufferToBlob(this.rhythmTimingConfig.correctedAudioBuffer);
            const correctedURL = URL.createObjectURL(correctedBlob);
            
            // Update main audio player
            this.audioPlayer.src = correctedURL;
            this.currentAudioBlob = correctedBlob;
            
            // Update waveform visualization
            await this.drawWaveformFromBlob(correctedBlob);
            
            this.showUIMessage('✅ Timing corrections applied to main audio!', 'success');
            this.log('✅ Corrected audio now active in main player', 'success');
        } else {
            this.showUIMessage('❌ No corrected audio available to apply', 'error');
        }
        
    } catch (error) {
        this.log(`❌ Failed to apply corrections: ${error.message}`, 'error');
        this.showUIMessage(`❌ Failed to apply corrections: ${error.message}`, 'error');
    }
};

// Regenerate preview with current settings
AudioToolsPro.prototype.regeneratePreview = async function() {
    this.log('🔄 Regenerating preview with current settings...', 'info');
    
    try {
        // Clear existing corrected audio
        this.rhythmTimingConfig.correctedAudioBuffer = null;
        
        // Regenerate preview
        await this.previewTimingCorrections();
        
    } catch (error) {
        this.log(`❌ Preview regeneration failed: ${error.message}`, 'error');
        this.showUIMessage(`❌ Preview regeneration failed: ${error.message}`, 'error');
    }
};

// Export corrected audio as file
AudioToolsPro.prototype.exportCorrectedAudio = async function() {
    try {
        if (!this.rhythmTimingConfig.correctedAudioBuffer) {
            this.showUIMessage('❌ No corrected audio available to export', 'error');
            return;
        }
        
        this.log('💾 Exporting corrected audio file...', 'info');
        
        const correctedBlob = await this.audioBufferToBlob(this.rhythmTimingConfig.correctedAudioBuffer);
        const url = URL.createObjectURL(correctedBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentFileName || 'audio'}-corrected-timing.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('✅ Corrected audio exported successfully', 'success');
        this.showUIMessage('✅ Corrected audio exported!', 'success');
        
    } catch (error) {
        this.log(`❌ Audio export failed: ${error.message}`, 'error');
        this.showUIMessage(`❌ Export failed: ${error.message}`, 'error');
    }
};