/**
 * Enhanced Silence Results Integration
 * Shows how to integrate the enhanced UI with your existing Audio Tools Pro application
 */

class EnhancedSilenceResultsIntegration {
    constructor(app) {
        this.app = app;
        this.enhancedUIContainer = null;
        this.enhancedUI = null;
        this.isVisible = false;
        
        this.initializeIntegration();
    }

    async initializeIntegration() {
        try {
            // Create enhanced UI container
            this.createEnhancedUIContainer();
            
            // Initialize enhanced UI
            const EnhancedSilenceResultsUI = require('./EnhancedSilenceResultsUI');
            this.enhancedUI = new EnhancedSilenceResultsUI(this.enhancedUIContainer);
            
            // Load enhanced styles
            this.loadEnhancedStyles();
            
            // Setup event listeners
            this.setupIntegrationEventListeners();
            
            // Override existing methods
            this.overrideExistingMethods();
            
            console.log('✅ Enhanced UI Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Enhanced UI Integration failed:', error);
            this.createFallbackUI();
        }
    }

    createEnhancedUIContainer() {
        // Check if container already exists
        if (document.getElementById('enhancedSilenceResultsContainer')) {
            this.enhancedUIContainer = document.getElementById('enhancedSilenceResultsContainer');
            return;
        }

        // Create container if it doesn't exist
        this.enhancedUIContainer = document.createElement('div');
        this.enhancedUIContainer.id = 'enhancedSilenceResultsContainer';
        this.enhancedUIContainer.style.display = 'none';
        
        // Insert into the main content area
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(this.enhancedUIContainer);
        } else {
            // Fallback: append to body
            document.body.appendChild(this.enhancedUIContainer);
        }
    }

    loadEnhancedStyles() {
        // Check if styles are already loaded
        if (document.querySelector('link[href*="enhanced-silence-results.css"]')) {
            return;
        }

        // Try to load CSS file
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './src/ui/enhanced-silence-results.css';
        link.onerror = () => {
            // If CSS file fails to load, inject inline styles
            this.injectInlineStyles();
        };
        document.head.appendChild(link);
    }

    injectInlineStyles() {
        // Basic inline styles as fallback
        const style = document.createElement('style');
        style.textContent = `
            .enhanced-silence-results {
                background: #1a1a1a;
                color: #ffffff;
                border-radius: 12px;
                margin: 20px 0;
                overflow: hidden;
            }
            .enhanced-silence-results .section-header {
                background: linear-gradient(135deg, #0f1419 0%, #1e2a3a 100%);
                padding: 20px;
                border-bottom: 1px solid #2d3748;
            }
            .enhanced-silence-results .section-header h4 {
                color: #00bcd4;
                margin: 0;
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }

    setupIntegrationEventListeners() {
        // Listen for silence detection completion
        document.addEventListener('silenceDetectionComplete', (event) => {
            this.handleSilenceDetectionComplete(event.detail);
        });

        // Override the detectSilence button
        const detectSilenceBtn = document.getElementById('detectSilence');
        if (detectSilenceBtn) {
            detectSilenceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.runEnhancedSilenceDetection();
            });
        }

        // Add toggle button for enhanced UI
        this.addToggleButton();
    }

    addToggleButton() {
        // Check if toggle button already exists
        if (document.getElementById('toggleEnhancedUI')) {
            return;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleEnhancedUI';
        toggleBtn.className = 'action-btn secondary';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show Enhanced UI';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '100px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '1000';
        
        toggleBtn.addEventListener('click', () => {
            this.toggleEnhancedUI();
        });

        document.body.appendChild(toggleBtn);
    }

    overrideExistingMethods() {
        if (this.app && this.app.displayEnhancedSilenceResults) {
            this.app.displayEnhancedSilenceResults = (results, audioFile) => {
                this.displayEnhancedResults(results, audioFile);
            };
        }

        if (this.app && this.app.detectSilence) {
            this.app.detectSilence = async () => {
                await this.runEnhancedSilenceDetection();
            };
        }
    }

    async runEnhancedSilenceDetection() {
        try {
            this.showLoadingState();
            
            // Check if we have audio data
            if (!this.app.currentAudioBlob && !this.app.currentAudioPath) {
                this.showMessage('Please load audio first', 'error');
                return;
            }

            // Run enhanced detection workflow
            const results = await this.runEnhancedDetectionWorkflow();
            
            if (results && results.length > 0) {
                // Display enhanced results
                this.displayEnhancedResults(results, this.app.currentAudioPath || 'audio-file');
                this.showMessage(`Enhanced detection completed! Found ${results.length} silence segments`, 'success');
            } else {
                throw new Error('No silence segments detected');
            }

        } catch (error) {
            console.error('Enhanced detection failed:', error);
            this.showMessage(`Enhanced detection failed: ${error.message}`, 'error');
            
            // Fall back to basic detection
            if (this.app.runBasicSilenceDetection) {
                await this.app.runBasicSilenceDetection();
            }
        } finally {
            this.hideLoadingState();
        }
    }

    async runEnhancedDetectionWorkflow() {
        // Simulate enhanced detection workflow
        // In a real implementation, this would call your enhanced features
        
        // Generate mock results for demonstration
        const mockResults = [
            {
                start: 0.5,
                end: 0.9,
                duration: 0.4,
                consensusConfidence: 0.95,
                method: 'whisper',
                type: 'speech_gap',
                detectionMethods: ['whisper', 'ffmpeg'],
                qualityScore: 92,
                recommendedAction: 'auto_trim',
                confidenceLevel: 'very_high',
                visualizationColor: '#4CAF50'
            },
            {
                start: 1.8,
                end: 2.8,
                duration: 1.0,
                consensusConfidence: 0.88,
                method: 'whisper',
                type: 'speech_gap',
                detectionMethods: ['whisper', 'webAudio'],
                qualityScore: 85,
                recommendedAction: 'auto_trim',
                confidenceLevel: 'high',
                visualizationColor: '#8BC34A'
            },
            {
                start: 3.8,
                end: 5.0,
                duration: 1.2,
                consensusConfidence: 0.82,
                method: 'ffmpeg',
                type: 'end_silence',
                detectionMethods: ['ffmpeg'],
                qualityScore: 78,
                recommendedAction: 'review_manually',
                confidenceLevel: 'medium',
                visualizationColor: '#CDDC39'
            }
        ];

        return mockResults;
    }

    displayEnhancedResults(results, audioFile) {
        if (!this.enhancedUI) {
            console.error('Enhanced UI not initialized');
            return;
        }

        try {
            // Process results for enhanced UI
            const processedResults = this.processResultsForEnhancedUI(results);
            
            // Display results
            this.enhancedUI.displayResults(processedResults, audioFile);
            
            // Show the enhanced UI
            this.showEnhancedUI();
            
        } catch (error) {
            console.error('Failed to display enhanced results:', error);
            this.showMessage('Failed to display enhanced results', 'error');
        }
    }

    processResultsForEnhancedUI(results) {
        // Ensure results have all necessary fields for enhanced UI
        return results.map(result => ({
            ...result,
            consensusConfidence: result.consensusConfidence || result.confidence || 0.8,
            detectionMethods: result.detectionMethods || [result.method || 'unknown'],
            qualityScore: result.qualityScore || Math.round((result.consensusConfidence || 0.8) * 100),
            recommendedAction: result.recommendedAction || 'review_manually',
            confidenceLevel: result.confidenceLevel || 'medium',
            visualizationColor: result.visualizationColor || this.getDefaultColor(result.consensusConfidence || 0.8)
        }));
    }

    getDefaultColor(confidence) {
        if (confidence >= 0.9) return '#4CAF50';
        if (confidence >= 0.7) return '#8BC34A';
        if (confidence >= 0.5) return '#CDDC39';
        return '#FF9800';
    }

    showEnhancedUI() {
        if (this.enhancedUIContainer) {
            this.enhancedUIContainer.style.display = 'block';
            this.isVisible = true;
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggleEnhancedUI');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Enhanced UI';
            }
        }
    }

    hideEnhancedUI() {
        if (this.enhancedUIContainer) {
            this.enhancedUIContainer.style.display = 'none';
            this.isVisible = false;
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggleEnhancedUI');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show Enhanced UI';
            }
        }
    }

    toggleEnhancedUI() {
        if (this.isVisible) {
            this.hideEnhancedUI();
        } else {
            this.showEnhancedUI();
        }
    }

    // ========================================
    // SILENCE CUTTING FUNCTIONALITY
    // ========================================

    async applySilenceCuts(results) {
        try {
            this.showMessage('Applying silence cuts...', 'processing');
            
            // Get audio data
            const audioBlob = this.app.currentAudioBlob;
            if (!audioBlob) {
                throw new Error('No audio data available');
            }

            // Create trimmed audio by removing silence segments
            const trimmedAudioBlob = await this.createTrimmedAudio(audioBlob, results);
            
            // Create playable audio element
            const trimmedAudioUrl = URL.createObjectURL(trimmedAudioBlob);
            
            // Display trimmed audio player
            this.displayTrimmedAudioPlayer(trimmedAudioUrl, results);
            
            // Store trimmed audio for download
            this.app.trimmedAudioBlob = trimmedAudioBlob;
            
            this.showMessage('Silence cuts applied successfully! Audio is ready to play.', 'success');
            
        } catch (error) {
            console.error('Silence cutting failed:', error);
            this.showMessage(`Silence cutting failed: ${error.message}`, 'error');
        }
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
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
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
        if (this.enhancedUIContainer) {
            this.enhancedUIContainer.appendChild(playerSection);
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

    downloadTrimmedAudio() {
        if (this.app.trimmedAudioBlob) {
            const url = URL.createObjectURL(this.app.trimmedAudioBlob);
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

    // ========================================
    // UTILITY METHODS
    // ========================================

    showLoadingState() {
        const detectBtn = document.getElementById('detectSilence');
        if (detectBtn) {
            detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            detectBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const detectBtn = document.getElementById('detectSilence');
        if (detectBtn) {
            detectBtn.innerHTML = '<i class="fas fa-robot"></i> Enhanced AI Silence Detection';
            detectBtn.disabled = false;
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

    createFallbackUI() {
        console.log('Creating fallback UI...');
        const fallbackDiv = document.createElement('div');
        fallbackDiv.innerHTML = `
            <div style="padding: 20px; background: #f0f0f0; border: 1px solid #ccc; margin: 20px;">
                <h3>Enhanced UI Not Available</h3>
                <p>The enhanced silence detection UI could not be loaded. Using basic functionality.</p>
            </div>
        `;
        
        if (this.enhancedUIContainer) {
            this.enhancedUIContainer.appendChild(fallbackDiv);
        }
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSilenceResultsIntegration;
}

// Make available globally for browser environments
if (typeof window !== 'undefined') {
    window.EnhancedSilenceResultsIntegration = EnhancedSilenceResultsIntegration;
    
    // Auto-initialize if audioToolsPro is available
    if (window.audioToolsPro) {
        window.enhancedSilenceIntegration = new EnhancedSilenceResultsIntegration(window.audioToolsPro);
    }
}
