/**
 * Multi-Track Audio Processor - AudioWorklet Implementation
 * Supports up to 6 audio tracks with real-time processing capabilities
 * Features: Silence detection, overlap detection, dynamic ducking, and buffer management
 */

class MultiTrackAudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        
        // Configuration
        this.maxTracks = 6;
        this.sampleRate = options.processorOptions?.sampleRate || 44100;
        this.bufferSize = options.processorOptions?.bufferSize || 512;
        
        // Track management
        this.tracks = new Array(this.maxTracks).fill(null).map((_, index) => ({
            id: index,
            active: false,
            buffer: new Float32Array(this.bufferSize),
            level: 0,
            isSilent: true,
            silenceThreshold: -40, // dB
            silenceDuration: 0,
            overlapDetected: false,
            duckingAmount: 0,
            gainReduction: 1.0
        }));
        
        // Submix routing
        this.submixes = {
            main: { tracks: [], gain: 1.0 },
            speech: { tracks: [], gain: 1.0 },
            music: { tracks: [], gain: 1.0 },
            effects: { tracks: [], gain: 1.0 }
        };
        
        // Analysis parameters
        this.analysisFrameSize = 1024;
        this.analysisBuffer = new Float32Array(this.analysisFrameSize);
        this.analysisIndex = 0;
        
        // Overlap detection
        this.overlapThreshold = 0.3;
        this.overlapHistory = new Array(this.maxTracks).fill(null).map(() => 
            new Array(this.maxTracks).fill(0)
        );
        
        // Ducking parameters
        this.duckingRatio = 0.3;
        this.attackTime = 0.01; // seconds
        this.releaseTime = 0.1; // seconds
        this.attackSamples = Math.floor(this.attackTime * this.sampleRate);
        this.releaseSamples = Math.floor(this.releaseTime * this.sampleRate);
        
        // Processing state
        this.frameCount = 0;
        this.processedSamples = 0;
        
        // Multi-cam alignment
        this.alignmentEnabled = false;
        this.alignmentOffsets = new Array(this.maxTracks).fill(0);
        
        // Event handling
        this.port.onmessage = this.handleMessage.bind(this);
        
        console.log('MultiTrackAudioProcessor initialized with', this.maxTracks, 'tracks');
    }
    
    handleMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'configure':
                this.configure(data);
                break;
            case 'setTrackActive':
                this.setTrackActive(data.trackId, data.active);
                break;
            case 'setSubmixRouting':
                this.setSubmixRouting(data.trackId, data.submix);
                break;
            case 'setSilenceThreshold':
                this.setSilenceThreshold(data.trackId, data.threshold);
                break;
            case 'enableDucking':
                this.enableDucking(data.primaryTrack, data.secondaryTracks);
                break;
            case 'setAlignment':
                this.setAlignment(data.trackId, data.offsetSamples);
                break;
            case 'getStatus':
                this.sendStatus();
                break;
            default:
                console.warn('Unknown message type:', type);
        }
    }
    
    configure(config) {
        if (config.silenceThreshold) {
            this.tracks.forEach(track => {
                track.silenceThreshold = config.silenceThreshold;
            });
        }
        
        if (config.overlapThreshold) {
            this.overlapThreshold = config.overlapThreshold;
        }
        
        if (config.duckingRatio) {
            this.duckingRatio = config.duckingRatio;
        }
        
        if (config.alignmentEnabled !== undefined) {
            this.alignmentEnabled = config.alignmentEnabled;
        }
        
        this.port.postMessage({
            type: 'configured',
            data: { success: true }
        });
    }
    
    setTrackActive(trackId, active) {
        if (trackId >= 0 && trackId < this.maxTracks) {
            this.tracks[trackId].active = active;
            
            this.port.postMessage({
                type: 'trackStatusChanged',
                data: { trackId, active }
            });
        }
    }
    
    setSubmixRouting(trackId, submix) {
        if (trackId >= 0 && trackId < this.maxTracks && this.submixes[submix]) {
            // Remove from all submixes first
            Object.keys(this.submixes).forEach(key => {
                const index = this.submixes[key].tracks.indexOf(trackId);
                if (index > -1) {
                    this.submixes[key].tracks.splice(index, 1);
                }
            });
            
            // Add to new submix
            this.submixes[submix].tracks.push(trackId);
            
            this.port.postMessage({
                type: 'routingChanged',
                data: { trackId, submix }
            });
        }
    }
    
    setSilenceThreshold(trackId, threshold) {
        if (trackId >= 0 && trackId < this.maxTracks) {
            this.tracks[trackId].silenceThreshold = threshold;
        }
    }
    
    enableDucking(primaryTrack, secondaryTracks) {
        this.primaryTrack = primaryTrack;
        this.secondaryTracks = secondaryTracks || [];
        
        this.port.postMessage({
            type: 'duckingConfigured',
            data: { primaryTrack, secondaryTracks }
        });
    }
    
    setAlignment(trackId, offsetSamples) {
        if (trackId >= 0 && trackId < this.maxTracks) {
            this.alignmentOffsets[trackId] = offsetSamples;
        }
    }
    
    process(inputs, outputs, parameters) {
        const numInputs = Math.min(inputs.length, this.maxTracks);
        const output = outputs[0];
        
        if (!output || output.length === 0) {
            return true;
        }
        
        const frameLength = output[0].length;
        
        // Clear output buffer
        for (let channel = 0; channel < output.length; channel++) {
            output[channel].fill(0);
        }
        
        // Process each active track
        for (let trackId = 0; trackId < numInputs; trackId++) {
            const track = this.tracks[trackId];
            const input = inputs[trackId];
            
            if (!track.active || !input || input.length === 0) {
                continue;
            }
            
            // Process each channel of the track
            for (let channel = 0; channel < Math.min(input.length, output.length); channel++) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];
                
                // Apply alignment offset if enabled
                let alignedInput = inputChannel;
                if (this.alignmentEnabled && this.alignmentOffsets[trackId] !== 0) {
                    alignedInput = this.applyAlignment(inputChannel, this.alignmentOffsets[trackId]);
                }
                
                // Analyze audio level for silence detection
                this.analyzeTrack(trackId, alignedInput);
                
                // Apply dynamic ducking if configured
                const processedAudio = this.applyDucking(trackId, alignedInput);
                
                // Add to output (submix routing)
                this.addToSubmixOutput(trackId, processedAudio, outputChannel);
            }
        }
        
        // Detect overlaps across all active tracks
        this.detectOverlaps();
        
        // Send periodic status updates
        this.frameCount++;
        if (this.frameCount % 1024 === 0) { // Every ~23ms at 44.1kHz
            this.sendPeriodicUpdate();
        }
        
        this.processedSamples += frameLength;
        
        return true;
    }
    
    analyzeTrack(trackId, audioData) {
        const track = this.tracks[trackId];
        
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        const rms = Math.sqrt(sum / audioData.length);
        const dbLevel = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
        
        track.level = dbLevel;
        
        // Update silence detection
        const wasSilent = track.isSilent;
        track.isSilent = dbLevel < track.silenceThreshold;
        
        if (track.isSilent) {
            track.silenceDuration += audioData.length / this.sampleRate;
        } else {
            if (wasSilent && track.silenceDuration > 0) {
                // Just exited silence
                this.port.postMessage({
                    type: 'silenceDetected',
                    data: {
                        trackId,
                        duration: track.silenceDuration,
                        endTime: this.processedSamples / this.sampleRate
                    }
                });
            }
            track.silenceDuration = 0;
        }
        
        // Add to analysis buffer for frequency analysis
        for (let i = 0; i < audioData.length; i++) {
            this.analysisBuffer[this.analysisIndex] = audioData[i];
            this.analysisIndex = (this.analysisIndex + 1) % this.analysisFrameSize;
        }
    }
    
    detectOverlaps() {
        const activeTracks = this.tracks.filter(track => track.active && !track.isSilent);
        
        if (activeTracks.length < 2) {
            return;
        }
        
        // Simple overlap detection based on simultaneous activity
        for (let i = 0; i < activeTracks.length; i++) {
            for (let j = i + 1; j < activeTracks.length; j++) {
                const track1 = activeTracks[i];
                const track2 = activeTracks[j];
                
                const levelDiff = Math.abs(track1.level - track2.level);
                const overlap = levelDiff < 10 && track1.level > -30 && track2.level > -30;
                
                if (overlap && !this.overlapHistory[track1.id][track2.id]) {
                    this.overlapHistory[track1.id][track2.id] = this.frameCount;
                    
                    this.port.postMessage({
                        type: 'overlapDetected',
                        data: {
                            track1: track1.id,
                            track2: track2.id,
                            level1: track1.level,
                            level2: track2.level,
                            time: this.processedSamples / this.sampleRate
                        }
                    });
                } else if (!overlap) {
                    this.overlapHistory[track1.id][track2.id] = 0;
                }
            }
        }
    }
    
    applyDucking(trackId, audioData) {
        if (typeof this.primaryTrack === 'undefined' || !this.secondaryTracks) {
            return audioData;
        }
        
        const track = this.tracks[trackId];
        let duckingGain = 1.0;
        
        // If this is a secondary track and primary track is active
        if (this.secondaryTracks.includes(trackId) && 
            this.tracks[this.primaryTrack]?.active && 
            !this.tracks[this.primaryTrack]?.isSilent) {
            
            duckingGain = this.duckingRatio;
        }
        
        // Smooth gain changes to avoid clicks
        const targetGain = duckingGain;
        const currentGain = track.gainReduction;
        const gainDiff = targetGain - currentGain;
        const gainStep = gainDiff / audioData.length;
        
        const processedData = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            track.gainReduction += gainStep;
            processedData[i] = audioData[i] * track.gainReduction;
        }
        
        return processedData;
    }
    
    applyAlignment(audioData, offsetSamples) {
        // Simple delay-based alignment
        // In a real implementation, this would use a circular buffer
        if (offsetSamples === 0) {
            return audioData;
        }
        
        const alignedData = new Float32Array(audioData.length);
        
        if (offsetSamples > 0) {
            // Delay the audio
            alignedData.fill(0, 0, Math.min(offsetSamples, audioData.length));
            for (let i = offsetSamples; i < audioData.length; i++) {
                alignedData[i] = audioData[i - offsetSamples];
            }
        } else {
            // Advance the audio (crop beginning)
            const advanceAmount = Math.min(-offsetSamples, audioData.length);
            for (let i = 0; i < audioData.length - advanceAmount; i++) {
                alignedData[i] = audioData[i + advanceAmount];
            }
        }
        
        return alignedData;
    }
    
    addToSubmixOutput(trackId, audioData, outputChannel) {
        // Find which submix this track belongs to
        let submixGain = 1.0;
        
        Object.keys(this.submixes).forEach(submixName => {
            const submix = this.submixes[submixName];
            if (submix.tracks.includes(trackId)) {
                submixGain = submix.gain;
            }
        });
        
        // Add to output with submix gain
        for (let i = 0; i < audioData.length; i++) {
            outputChannel[i] += audioData[i] * submixGain;
        }
    }
    
    sendPeriodicUpdate() {
        const activeTrackCount = this.tracks.filter(track => track.active).length;
        const trackLevels = this.tracks.map(track => ({
            id: track.id,
            active: track.active,
            level: track.level,
            isSilent: track.isSilent,
            duckingAmount: track.duckingAmount
        }));
        
        this.port.postMessage({
            type: 'periodicUpdate',
            data: {
                activeTrackCount,
                trackLevels,
                processedSamples: this.processedSamples,
                frameCount: this.frameCount
            }
        });
    }
    
    sendStatus() {
        const status = {
            maxTracks: this.maxTracks,
            activeTracks: this.tracks.filter(track => track.active).length,
            submixes: Object.keys(this.submixes).map(name => ({
                name,
                tracks: this.submixes[name].tracks,
                gain: this.submixes[name].gain
            })),
            alignmentEnabled: this.alignmentEnabled,
            processedSamples: this.processedSamples,
            sampleRate: this.sampleRate
        };
        
        this.port.postMessage({
            type: 'status',
            data: status
        });
    }
}

registerProcessor('multi-track-processor', MultiTrackAudioProcessor);
