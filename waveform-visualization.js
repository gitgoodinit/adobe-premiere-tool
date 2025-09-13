// ========================================
// ENHANCED WAVEFORM VISUALIZATION
// ========================================

// Enhanced waveform drawing with rhythm analysis visualization
AudioToolsPro.prototype.drawEnhancedWaveformWithRhythm = async function(audioBlob, analysisResults = null) {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    try {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Decode audio data
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const duration = audioBuffer.duration;
        
        // Draw background
        this.drawWaveformBackground(ctx, width, height);
        
        // Draw main waveform
        this.drawMainWaveform(ctx, channelData, width, height);
        
        // Draw rhythm analysis overlays if available
        if (analysisResults) {
            this.drawRhythmAnalysisOverlay(ctx, analysisResults, width, height, duration);
        }
        
        // Draw time markers
        this.drawTimeMarkers(ctx, width, height, duration);
        
        this.log('🎨 Enhanced waveform with rhythm analysis drawn', 'info');
        
    } catch (error) {
        this.log(`❌ Enhanced waveform drawing failed: ${error.message}`, 'error');
        // Fallback to basic waveform
        this.drawWaveformFromBlob(audioBlob);
    }
};

// Draw rhythm analysis overlay
AudioToolsPro.prototype.drawRhythmAnalysisOverlay = function(ctx, analysisResults, width, height, duration) {
    const pixelsPerSecond = width / duration;
    
    // Draw speech regions in green
    if (analysisResults.speechRegions) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        analysisResults.speechRegions.forEach(region => {
            const x = region.start * pixelsPerSecond;
            const regionWidth = (region.end - region.start) * pixelsPerSecond;
            ctx.fillRect(x, 0, regionWidth, height);
        });
        
        // Draw speech region borders
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
        ctx.lineWidth = 1;
        analysisResults.speechRegions.forEach(region => {
            const x = region.start * pixelsPerSecond;
            const endX = region.end * pixelsPerSecond;
            
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, height);
            ctx.stroke();
        });
    }
    
    // Draw silence regions in red
    if (analysisResults.silenceRegions) {
        ctx.fillStyle = 'rgba(244, 67, 54, 0.15)';
        analysisResults.silenceRegions.forEach(region => {
            const x = region.start * pixelsPerSecond;
            const regionWidth = (region.end - region.start) * pixelsPerSecond;
            ctx.fillRect(x, 0, regionWidth, height);
        });
    }
    
    // Highlight long pauses
    if (analysisResults.longPauses) {
        ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.8)';
        ctx.lineWidth = 2;
        
        analysisResults.longPauses.forEach(pause => {
            const x = pause.start * pixelsPerSecond;
            const regionWidth = pause.duration * pixelsPerSecond;
            
            // Fill
            ctx.fillRect(x, 0, regionWidth, height);
            
            // Border
            ctx.beginPath();
            ctx.rect(x, 0, regionWidth, height);
            ctx.stroke();
            
            // Add warning icon
            this.drawWarningIcon(ctx, x + regionWidth / 2, height / 2);
        });
    }
    
    // Highlight short speech artifacts
    if (analysisResults.shortSpeech) {
        ctx.fillStyle = 'rgba(156, 39, 176, 0.4)';
        analysisResults.shortSpeech.forEach(speech => {
            const x = speech.start * pixelsPerSecond;
            const regionWidth = Math.max(2, speech.duration * pixelsPerSecond);
            ctx.fillRect(x, height * 0.2, regionWidth, height * 0.6);
        });
    }
    
    // Draw energy level curve
    if (analysisResults.energyLevels) {
        this.drawEnergyLevelCurve(ctx, analysisResults.energyLevels, width, height, duration);
    }
};

// Draw energy level curve
AudioToolsPro.prototype.drawEnergyLevelCurve = function(ctx, energyLevels, width, height, duration) {
    if (energyLevels.length === 0) return;
    
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const pixelsPerSecond = width / duration;
    const maxEnergy = Math.max(...energyLevels.map(e => e.energy));
    
    energyLevels.forEach((level, index) => {
        const x = level.time * pixelsPerSecond;
        const y = height - (level.energy / maxEnergy) * (height * 0.3);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
};

// Draw correction markers
AudioToolsPro.prototype.drawCorrectionMarkers = function(ctx, corrections, width, height, duration) {
    if (!corrections || corrections.length === 0) return;
    
    const pixelsPerSecond = width / duration;
    
    corrections.forEach(correction => {
        const x = correction.timestamp * pixelsPerSecond;
        
        // Choose color based on correction type
        let color = '#2196F3'; // Blue default
        switch (correction.type) {
            case 'long_pause':
                color = '#FF5722'; // Red-orange
                break;
            case 'short_segment':
                color = '#9C27B0'; // Purple
                break;
            case 'awkward_gap':
                color = '#FF9800'; // Orange
                break;
            case 'rushed_speech':
                color = '#4CAF50'; // Green
                break;
        }
        
        // Draw correction marker
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // Marker line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Marker flag
        const flagWidth = 8;
        const flagHeight = 12;
        ctx.fillRect(x - 1, 5, 3, flagHeight);
        ctx.fillRect(x + 2, 5, flagWidth, flagHeight / 2);
        
        // Priority indicator (dot size)
        const dotRadius = (correction.priority || 5) / 2;
        ctx.beginPath();
        ctx.arc(x, height - 10, dotRadius, 0, 2 * Math.PI);
        ctx.fill();
    });
};

// Draw warning icon for problematic areas
AudioToolsPro.prototype.drawWarningIcon = function(ctx, x, y) {
    ctx.fillStyle = 'rgba(255, 152, 0, 0.9)';
    ctx.strokeStyle = '#FF6F00';
    ctx.lineWidth = 1;
    
    // Triangle
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x - 5, y + 4);
    ctx.lineTo(x + 5, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Exclamation mark
    ctx.fillStyle = '#FF6F00';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y + 2);
};

// Draw time markers
AudioToolsPro.prototype.drawTimeMarkers = function(ctx, width, height, duration) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;
    
    // Calculate marker interval (every 10 seconds, or adjust based on duration)
    let interval = 10;
    if (duration < 30) interval = 5;
    if (duration < 10) interval = 1;
    if (duration > 300) interval = 30;
    
    for (let time = 0; time <= duration; time += interval) {
        const x = (time / duration) * width;
        
        // Draw marker line
        ctx.beginPath();
        ctx.moveTo(x, height - 20);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Draw time label
        const timeLabel = this.formatTime(time);
        ctx.fillText(timeLabel, x, height - 5);
    }
};

// Update waveform with correction highlights
AudioToolsPro.prototype.updateWaveformWithCorrections = function(corrections) {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas || !corrections) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Get current audio duration
    const duration = this.audioPlayer ? this.audioPlayer.duration : 120;
    
    // Draw correction markers on existing waveform
    this.drawCorrectionMarkers(ctx, corrections, width, height, duration);
    
    this.log(`🎨 Waveform updated with ${corrections.length} correction markers`, 'info');
};

// Animate correction application on waveform
AudioToolsPro.prototype.animateCorrectionApplication = function(correction) {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const duration = this.audioPlayer ? this.audioPlayer.duration : 120;
    const x = (correction.timestamp / duration) * width;
    
    // Animate correction application
    let animationFrame = 0;
    const maxFrames = 30;
    
    const animate = () => {
        if (animationFrame >= maxFrames) return;
        
        const progress = animationFrame / maxFrames;
        const radius = progress * 20;
        const alpha = 1 - progress;
        
        // Draw expanding circle
        ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, height / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        animationFrame++;
        requestAnimationFrame(animate);
    };
    
    animate();
};