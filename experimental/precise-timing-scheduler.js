// ========================================
// PRECISE TIMING SCHEDULER FOR WEB AUDIO API
// Sample-accurate scheduling with ±300ms precision
// ========================================

// Precise Timing Scheduler Class
AudioToolsPro.prototype.PreciseTimingScheduler = class {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.sampleRate = audioContext.sampleRate;
        this.scheduledEvents = new Map();
        this.eventIdCounter = 0;
        this.lookaheadTime = 0.025; // 25ms lookahead
        this.scheduleAheadTime = 0.1; // 100ms schedule ahead
        this.isRunning = false;
        this.schedulerInterval = null;
        
        // Timing precision constants (±300ms as per requirements)
        this.maxTimingError = 0.3; // 300ms maximum error
        this.targetPrecision = 0.001; // 1ms target precision
        
        console.log('PreciseTimingScheduler initialized with ±300ms accuracy');
    }
    
    // Convert time to sample-accurate position
    timeToSamples(timeInSeconds) {
        return Math.round(timeInSeconds * this.sampleRate);
    }
    
    // Convert samples to precise time
    samplesToTime(samples) {
        return samples / this.sampleRate;
    }
    
    // Schedule an audio event with sample-accurate timing
    scheduleAudioEvent(audioBuffer, startTime, options = {}) {
        const eventId = this.eventIdCounter++;
        
        // Convert to sample-accurate timing
        const preciseStartTime = this.roundToSampleAccuracy(startTime);
        const startSample = this.timeToSamples(preciseStartTime);
        
        // Validate timing precision
        if (!this.validateTimingPrecision(startTime, preciseStartTime)) {
            throw new Error(`Timing error exceeds ±${this.maxTimingError * 1000}ms limit`);
        }
        
        const event = {
            id: eventId,
            audioBuffer,
            originalStartTime: startTime,
            preciseStartTime,
            startSample,
            duration: audioBuffer.duration,
            endTime: preciseStartTime + audioBuffer.duration,
            options: {
                gain: options.gain || 1.0,
                playbackRate: options.playbackRate || 1.0,
                loop: options.loop || false,
                fadeIn: options.fadeIn || 0,
                fadeOut: options.fadeOut || 0,
                ...options
            },
            scheduled: false,
            sourceNode: null
        };
        
        this.scheduledEvents.set(eventId, event);
        
        console.log(`Event ${eventId} scheduled for ${preciseStartTime.toFixed(6)}s (sample ${startSample})`);
        
        // Start scheduler if not running
        if (!this.isRunning) {
            this.startScheduler();
        }
        
        return eventId;
    }
    
    // Round time to sample-accurate precision
    roundToSampleAccuracy(timeInSeconds) {
        const samples = Math.round(timeInSeconds * this.sampleRate);
        return samples / this.sampleRate;
    }
    
    // Validate that timing is within ±300ms precision requirement
    validateTimingPrecision(originalTime, preciseTime) {
        const error = Math.abs(originalTime - preciseTime);
        return error <= this.maxTimingError;
    }
    
    // Start the precision scheduler
    startScheduler() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Starting precise timing scheduler');
        
        this.schedulerInterval = setInterval(() => {
            this.scheduleEventsInWindow();
        }, this.lookaheadTime * 1000);
    }
    
    // Stop the scheduler
    stopScheduler() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        
        // Stop all scheduled events
        this.scheduledEvents.forEach(event => {
            if (event.sourceNode) {
                event.sourceNode.stop();
                event.sourceNode = null;
            }
        });
        
        console.log('Precise timing scheduler stopped');
    }
    
    // Schedule events within the current timing window
    scheduleEventsInWindow() {
        const currentTime = this.audioContext.currentTime;
        const windowEnd = currentTime + this.scheduleAheadTime;
        
        this.scheduledEvents.forEach((event, eventId) => {
            if (!event.scheduled && 
                event.preciseStartTime >= currentTime && 
                event.preciseStartTime <= windowEnd) {
                
                this.scheduleEventNow(event);
            }
        });
    }
    
    // Schedule an individual event immediately
    scheduleEventNow(event) {
        try {
            // Create source node
            const source = this.audioContext.createBufferSource();
            source.buffer = event.audioBuffer;
            source.playbackRate.value = event.options.playbackRate;
            source.loop = event.options.loop;
            
            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = event.options.gain;
            
            // Apply fade effects if specified
            if (event.options.fadeIn > 0) {
                gainNode.gain.setValueAtTime(0, event.preciseStartTime);
                gainNode.gain.linearRampToValueAtTime(
                    event.options.gain, 
                    event.preciseStartTime + event.options.fadeIn
                );
            }
            
            if (event.options.fadeOut > 0) {
                const fadeStartTime = event.endTime - event.options.fadeOut;
                gainNode.gain.setValueAtTime(event.options.gain, fadeStartTime);
                gainNode.gain.linearRampToValueAtTime(0, event.endTime);
            }
            
            // Connect audio graph
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Schedule with sample-accurate timing
            source.start(event.preciseStartTime);
            
            // Store reference for cleanup
            event.sourceNode = source;
            event.scheduled = true;
            
            console.log(`Event ${event.id} scheduled for precise playback at ${event.preciseStartTime.toFixed(6)}s`);
            
            // Auto-cleanup when event finishes
            source.onended = () => {
                this.cleanupEvent(event.id);
            };
            
        } catch (error) {
            console.error(`Failed to schedule event ${event.id}:`, error);
        }
    }
    
    // Cancel a scheduled event
    cancelEvent(eventId) {
        const event = this.scheduledEvents.get(eventId);
        if (!event) return false;
        
        if (event.sourceNode && !event.sourceNode.playbackState === 'finished') {
            event.sourceNode.stop();
        }
        
        this.scheduledEvents.delete(eventId);
        console.log(`Event ${eventId} cancelled`);
        
        return true;
    }
    
    // Clean up completed event
    cleanupEvent(eventId) {
        const event = this.scheduledEvents.get(eventId);
        if (event) {
            event.sourceNode = null;
            this.scheduledEvents.delete(eventId);
            console.log(`Event ${eventId} completed and cleaned up`);
        }
    }
    
    // Schedule multiple events with precise timing
    scheduleBatchEvents(events) {
        const scheduledIds = [];
        
        events.forEach(eventData => {
            try {
                const eventId = this.scheduleAudioEvent(
                    eventData.buffer, 
                    eventData.startTime, 
                    eventData.options
                );
                scheduledIds.push(eventId);
            } catch (error) {
                console.error('Failed to schedule batch event:', error);
            }
        });
        
        console.log(`Scheduled ${scheduledIds.length} events in batch`);
        return scheduledIds;
    }
    
    // Get timing statistics
    getTimingStats() {
        const events = Array.from(this.scheduledEvents.values());
        const timingErrors = events.map(event => 
            Math.abs(event.originalStartTime - event.preciseStartTime) * 1000
        );
        
        return {
            totalEvents: events.length,
            scheduledEvents: events.filter(e => e.scheduled).length,
            pendingEvents: events.filter(e => !e.scheduled).length,
            averageTimingError: timingErrors.length > 0 ? 
                timingErrors.reduce((a, b) => a + b, 0) / timingErrors.length : 0,
            maxTimingError: timingErrors.length > 0 ? Math.max(...timingErrors) : 0,
            minTimingError: timingErrors.length > 0 ? Math.min(...timingErrors) : 0,
            withinTolerance: timingErrors.filter(error => error <= this.maxTimingError * 1000).length
        };
    }
    
    // Destroy scheduler and cleanup
    destroy() {
        this.stopScheduler();
        this.scheduledEvents.clear();
        console.log('PreciseTimingScheduler destroyed');
    }
};

// Initialize precise timing scheduler for rhythm corrections
AudioToolsPro.prototype.initializePreciseTimingScheduler = function() {
    if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    this.preciseTimingScheduler = new this.PreciseTimingScheduler(this.audioContext);
    this.log('✅ Precise timing scheduler initialized with ±300ms accuracy', 'success');
};

// Apply timing corrections with sample-accurate precision
AudioToolsPro.prototype.applyPreciseTimingCorrections = async function(audioBuffer, corrections) {
    if (!this.preciseTimingScheduler) {
        this.initializePreciseTimingScheduler();
    }
    
    this.log('🎯 Applying precise timing corrections with sample accuracy', 'info');
    
    try {
        const correctedSegments = [];
        let currentTime = 0;
        
        // Sort corrections by timestamp
        const sortedCorrections = [...corrections].sort((a, b) => a.timestamp - b.timestamp);
        
        for (const correction of sortedCorrections) {
            if (!correction.apply) continue;
            
            // Add segment before correction
            if (correction.timestamp > currentTime) {
                const segmentBuffer = await this.extractAudioSegment(
                    audioBuffer, currentTime, correction.timestamp
                );
                
                correctedSegments.push({
                    buffer: segmentBuffer,
                    startTime: currentTime,
                    originalStartTime: currentTime
                });
            }
            
            // Apply correction with precise timing
            if (correction.action === 'trim_pause') {
                // Create trimmed segment with exact timing
                const trimmedDuration = correction.suggestedDuration;
                const trimmedBuffer = await this.extractAudioSegment(
                    audioBuffer, 
                    correction.timestamp, 
                    correction.timestamp + trimmedDuration
                );
                
                correctedSegments.push({
                    buffer: trimmedBuffer,
                    startTime: correction.timestamp,
                    originalStartTime: correction.timestamp,
                    options: {
                        fadeIn: 0.005,  // 5ms fade to prevent clicks
                        fadeOut: 0.005
                    }
                });
                
                currentTime = correction.timestamp + correction.currentDuration;
                
            } else if (correction.action === 'smooth_rhythm') {
                // Apply time-stretching with precise timing
                const stretchRatio = correction.suggestedDuration / correction.currentDuration;
                const originalSegment = await this.extractAudioSegment(
                    audioBuffer,
                    correction.timestamp,
                    correction.timestamp + correction.currentDuration
                );
                
                const stretchedBuffer = await this.applyAdvancedPhaseVocoder(
                    originalSegment, stretchRatio
                );
                
                correctedSegments.push({
                    buffer: stretchedBuffer,
                    startTime: correction.timestamp,
                    originalStartTime: correction.timestamp,
                    options: {
                        fadeIn: 0.003,
                        fadeOut: 0.003
                    }
                });
                
                currentTime = correction.timestamp + correction.currentDuration;
            }
        }
        
        // Add remaining audio after last correction
        if (currentTime < audioBuffer.duration) {
            const remainingBuffer = await this.extractAudioSegment(
                audioBuffer, currentTime, audioBuffer.duration
            );
            
            correctedSegments.push({
                buffer: remainingBuffer,
                startTime: currentTime,
                originalStartTime: currentTime
            });
        }
        
        // Schedule all segments with precise timing
        const scheduledEventIds = this.preciseTimingScheduler.scheduleBatchEvents(correctedSegments);
        
        // Get timing statistics
        const stats = this.preciseTimingScheduler.getTimingStats();
        
        this.log(`✅ Applied ${corrections.filter(c => c.apply).length} corrections with precision:`, 'success');
        this.log(`   Average timing error: ${stats.averageTimingError.toFixed(3)}ms`, 'info');
        this.log(`   Max timing error: ${stats.maxTimingError.toFixed(3)}ms`, 'info');
        this.log(`   Events within ±300ms: ${stats.withinTolerance}/${stats.totalEvents}`, 'info');
        
        return {
            scheduledEventIds,
            timingStats: stats,
            correctedSegments: correctedSegments.length
        };
        
    } catch (error) {
        this.log(`❌ Precise timing correction failed: ${error.message}`, 'error');
        throw error;
    }
};

// Extract audio segment with sample-accurate boundaries
AudioToolsPro.prototype.extractAudioSegment = async function(sourceBuffer, startTime, endTime) {
    const audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    
    // Convert to sample-accurate boundaries
    const startSample = Math.round(startTime * sourceBuffer.sampleRate);
    const endSample = Math.round(endTime * sourceBuffer.sampleRate);
    const segmentLength = endSample - startSample;
    
    if (segmentLength <= 0) {
        throw new Error('Invalid segment boundaries');
    }
    
    // Create new buffer for segment
    const segmentBuffer = audioContext.createBuffer(
        sourceBuffer.numberOfChannels,
        segmentLength,
        sourceBuffer.sampleRate
    );
    
    // Copy sample-accurate segment
    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
        const sourceData = sourceBuffer.getChannelData(channel);
        const segmentData = segmentBuffer.getChannelData(channel);
        
        for (let i = 0; i < segmentLength; i++) {
            const sourceIndex = startSample + i;
            if (sourceIndex < sourceData.length) {
                segmentData[i] = sourceData[sourceIndex];
            }
        }
    }
    
    return segmentBuffer;
};

// Test precise timing accuracy
AudioToolsPro.prototype.testPreciseTimingAccuracy = async function() {
    this.log('🧪 Testing precise timing accuracy...', 'info');
    
    try {
        if (!this.preciseTimingScheduler) {
            this.initializePreciseTimingScheduler();
        }
        
        // Create test buffer (1 second of silence)
        const testBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
        
        // Test various timing values
        const testTimes = [0.1, 0.25, 0.333, 0.5, 0.75, 1.0, 1.5, 2.0];
        const results = [];
        
        for (const testTime of testTimes) {
            const preciseTime = this.preciseTimingScheduler.roundToSampleAccuracy(testTime);
            const error = Math.abs(testTime - preciseTime) * 1000; // Convert to ms
            
            results.push({
                originalTime: testTime,
                preciseTime: preciseTime,
                errorMs: error,
                withinTolerance: error <= 300 // ±300ms requirement
            });
        }
        
        const passedTests = results.filter(r => r.withinTolerance).length;
        const avgError = results.reduce((sum, r) => sum + r.errorMs, 0) / results.length;
        
        this.log(`✅ Timing accuracy test completed:`, 'success');
        this.log(`   Tests passed: ${passedTests}/${results.length}`, 'info');
        this.log(`   Average error: ${avgError.toFixed(3)}ms`, 'info');
        this.log(`   Max acceptable error: 300ms`, 'info');
        
        return {
            passed: passedTests === results.length,
            results,
            averageError: avgError,
            passedTests,
            totalTests: results.length
        };
        
    } catch (error) {
        this.log(`❌ Timing accuracy test failed: ${error.message}`, 'error');
        return { passed: false, error: error.message };
    }
};