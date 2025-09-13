// ========================================
// ADVANCED TIME-STRETCHING ALGORITHMS
// ========================================

// Enhanced Phase Vocoder Implementation
AudioToolsPro.prototype.applyAdvancedPhaseVocoder = async function(buffer, stretchRatio, pitchShift = 0) {
    this.log(`🎛️ Applying advanced phase vocoder: stretch=${stretchRatio.toFixed(2)}x, pitch=${pitchShift}`, 'info');
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const frameSize = 2048; // FFT size
    const hopSize = frameSize / 4; // 75% overlap
    const overlapAdd = frameSize / hopSize;
    
    // Calculate new buffer length
    const newLength = Math.floor(buffer.length * stretchRatio);
    const outputBuffer = audioContext.createBuffer(channels, newLength, sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
        const inputData = buffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);
        
        // Apply phase vocoder processing
        await this.processChannelWithPhaseVocoder(
            inputData, outputData, stretchRatio, pitchShift, frameSize, hopSize
        );
    }
    
    return outputBuffer;
};

// Process single channel with phase vocoder
AudioToolsPro.prototype.processChannelWithPhaseVocoder = async function(inputData, outputData, stretchRatio, pitchShift, frameSize, hopSize) {
    const inputLength = inputData.length;
    const outputLength = outputData.length;
    
    // Initialize phase accumulators
    const lastPhase = new Float32Array(frameSize / 2 + 1);
    const phaseAccumulator = new Float32Array(frameSize / 2 + 1);
    
    // Create analysis and synthesis windows
    const analysisWindow = this.createHanningWindow(frameSize);
    const synthesisWindow = this.createHanningWindow(frameSize);
    
    // FFT buffers
    const fftBuffer = new Float32Array(frameSize);
    const spectrum = new Float32Array(frameSize);
    
    let inputPos = 0;
    let outputPos = 0;
    
    while (inputPos + frameSize < inputLength && outputPos + frameSize < outputLength) {
        // Analysis phase - extract frame and apply window
        for (let i = 0; i < frameSize; i++) {
            fftBuffer[i] = inputData[inputPos + i] * analysisWindow[i];
        }
        
        // Perform FFT (simplified - in production use proper FFT library)
        this.simpleFFT(fftBuffer, spectrum, frameSize);
        
        // Phase vocoder processing
        this.processSpectralFrame(spectrum, lastPhase, phaseAccumulator, stretchRatio, pitchShift, frameSize);
        
        // Inverse FFT
        this.simpleIFFT(spectrum, fftBuffer, frameSize);
        
        // Synthesis phase - apply window and overlap-add
        for (let i = 0; i < frameSize; i++) {
            if (outputPos + i < outputLength) {
                outputData[outputPos + i] += fftBuffer[i] * synthesisWindow[i];
            }
        }
        
        // Update positions
        inputPos += hopSize;
        outputPos += Math.floor(hopSize * stretchRatio);
    }
};

// Process spectral frame for phase vocoder
AudioToolsPro.prototype.processSpectralFrame = function(spectrum, lastPhase, phaseAccumulator, stretchRatio, pitchShift, frameSize) {
    const hopSize = frameSize / 4;
    const freqPerBin = 2 * Math.PI / frameSize;
    
    for (let k = 0; k < frameSize / 2; k++) {
        // Get magnitude and phase
        const real = spectrum[k * 2];
        const imag = spectrum[k * 2 + 1];
        const magnitude = Math.sqrt(real * real + imag * imag);
        let phase = Math.atan2(imag, real);
        
        // Calculate phase difference
        let phaseDiff = phase - lastPhase[k];
        lastPhase[k] = phase;
        
        // Wrap phase difference to [-π, π]
        phaseDiff = phaseDiff - 2 * Math.PI * Math.round(phaseDiff / (2 * Math.PI));
        
        // Calculate instantaneous frequency
        const binFreq = k * freqPerBin;
        const instFreq = binFreq + phaseDiff / hopSize;
        
        // Apply pitch shift
        const shiftedFreq = instFreq * Math.pow(2, pitchShift / 12);
        const newBin = Math.round(shiftedFreq / freqPerBin);
        
        if (newBin >= 0 && newBin < frameSize / 2) {
            // Update phase accumulator
            phaseAccumulator[newBin] += shiftedFreq * hopSize * stretchRatio;
            
            // Write back to spectrum
            const newPhase = phaseAccumulator[newBin];
            spectrum[newBin * 2] = magnitude * Math.cos(newPhase);
            spectrum[newBin * 2 + 1] = magnitude * Math.sin(newPhase);
        }
    }
};

// WSOLA (Waveform Similarity Overlap-Add) Implementation
AudioToolsPro.prototype.applyWSOLA = async function(buffer, stretchRatio) {
    this.log(`🎵 Applying WSOLA time-stretching: ${stretchRatio.toFixed(2)}x`, 'info');
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const frameSize = 1024;
    const overlapSize = frameSize / 2;
    const searchRegion = frameSize / 4;
    
    const newLength = Math.floor(buffer.length * stretchRatio);
    const outputBuffer = audioContext.createBuffer(channels, newLength, sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
        const inputData = buffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);
        
        await this.processChannelWithWSOLA(
            inputData, outputData, stretchRatio, frameSize, overlapSize, searchRegion
        );
    }
    
    return outputBuffer;
};

// Process channel with WSOLA
AudioToolsPro.prototype.processChannelWithWSOLA = async function(inputData, outputData, stretchRatio, frameSize, overlapSize, searchRegion) {
    const inputLength = inputData.length;
    const outputLength = outputData.length;
    const hopSizeInput = Math.floor(frameSize / stretchRatio);
    const hopSizeOutput = frameSize;
    
    let inputPos = 0;
    let outputPos = 0;
    
    // Copy first frame
    for (let i = 0; i < Math.min(frameSize, outputLength); i++) {
        outputData[i] = inputData[i];
    }
    
    outputPos += hopSizeOutput - overlapSize;
    inputPos += hopSizeInput;
    
    while (inputPos + frameSize < inputLength && outputPos + frameSize < outputLength) {
        // Find best match in search region
        const bestOffset = this.findBestMatch(
            inputData, outputData, inputPos, outputPos, 
            frameSize, overlapSize, searchRegion
        );
        
        // Apply crossfade overlap-add
        this.crossfadeOverlapAdd(
            inputData, outputData, inputPos + bestOffset, outputPos, 
            frameSize, overlapSize
        );
        
        outputPos += hopSizeOutput - overlapSize;
        inputPos += hopSizeInput;
    }
};

// Find best match for WSOLA
AudioToolsPro.prototype.findBestMatch = function(inputData, outputData, inputPos, outputPos, frameSize, overlapSize, searchRegion) {
    let bestOffset = 0;
    let minError = Infinity;
    
    const searchStart = Math.max(-searchRegion, -inputPos);
    const searchEnd = Math.min(searchRegion, inputData.length - inputPos - frameSize);
    
    for (let offset = searchStart; offset <= searchEnd; offset += 4) { // Step by 4 for performance
        let error = 0;
        
        // Calculate normalized cross-correlation in overlap region
        for (let i = 0; i < overlapSize; i++) {
            const outputSample = outputData[outputPos + i];
            const inputSample = inputData[inputPos + offset + i];
            const diff = outputSample - inputSample;
            error += diff * diff;
        }
        
        if (error < minError) {
            minError = error;
            bestOffset = offset;
        }
    }
    
    return bestOffset;
};

// Crossfade overlap-add for WSOLA
AudioToolsPro.prototype.crossfadeOverlapAdd = function(inputData, outputData, inputPos, outputPos, frameSize, overlapSize) {
    // Crossfade in overlap region
    for (let i = 0; i < overlapSize; i++) {
        const fadeIn = i / overlapSize;
        const fadeOut = 1 - fadeIn;
        
        if (outputPos + i < outputData.length) {
            const existingSample = outputData[outputPos + i];
            const newSample = inputData[inputPos + i];
            outputData[outputPos + i] = existingSample * fadeOut + newSample * fadeIn;
        }
    }
    
    // Copy remaining samples
    for (let i = overlapSize; i < frameSize; i++) {
        if (outputPos + i < outputData.length && inputPos + i < inputData.length) {
            outputData[outputPos + i] = inputData[inputPos + i];
        }
    }
};

// Granular Synthesis Time-stretching
AudioToolsPro.prototype.applyGranularSynthesis = async function(buffer, stretchRatio) {
    this.log(`🎶 Applying granular synthesis: ${stretchRatio.toFixed(2)}x`, 'info');
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const channels = buffer.numberOfChannels;
    const grainSize = 1024; // Grain length in samples
    const overlapRatio = 0.5; // 50% overlap between grains
    const randomization = 0.1; // 10% position randomization
    
    const newLength = Math.floor(buffer.length * stretchRatio);
    const outputBuffer = audioContext.createBuffer(channels, newLength, buffer.sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
        const inputData = buffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);
        
        await this.processChannelWithGranular(
            inputData, outputData, stretchRatio, grainSize, overlapRatio, randomization
        );
    }
    
    return outputBuffer;
};

// Process channel with granular synthesis
AudioToolsPro.prototype.processChannelWithGranular = async function(inputData, outputData, stretchRatio, grainSize, overlapRatio, randomization) {
    const inputLength = inputData.length;
    const outputLength = outputData.length;
    const hopSize = grainSize * (1 - overlapRatio);
    const envelope = this.createHanningWindow(grainSize);
    
    let outputPos = 0;
    let inputPos = 0;
    
    while (outputPos + grainSize < outputLength) {
        // Add randomization to input position
        const randomOffset = (Math.random() - 0.5) * 2 * randomization * grainSize;
        const actualInputPos = Math.max(0, Math.min(inputLength - grainSize, 
                                       Math.floor(inputPos + randomOffset)));
        
        // Extract and apply grain
        for (let i = 0; i < grainSize; i++) {
            if (actualInputPos + i < inputLength && outputPos + i < outputLength) {
                const sample = inputData[actualInputPos + i] * envelope[i];
                outputData[outputPos + i] += sample;
            }
        }
        
        // Update positions
        outputPos += hopSize;
        inputPos += hopSize / stretchRatio;
        
        // Ensure input position doesn't exceed bounds
        if (inputPos >= inputLength - grainSize) break;
    }
    
    // Normalize output to prevent clipping
    this.normalizeAudioData(outputData);
};

// Create Hanning window
AudioToolsPro.prototype.createHanningWindow = function(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
};

// Normalize audio data
AudioToolsPro.prototype.normalizeAudioData = function(audioData) {
    let maxAbs = 0;
    for (let i = 0; i < audioData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(audioData[i]));
    }
    
    if (maxAbs > 1.0) {
        const scale = 0.95 / maxAbs; // Leave some headroom
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] *= scale;
        }
    }
};

// Simplified FFT (for demonstration - use proper FFT library in production)
AudioToolsPro.prototype.simpleFFT = function(input, output, size) {
    for (let k = 0; k < size / 2; k++) {
        let real = 0;
        let imag = 0;
        
        for (let n = 0; n < size; n++) {
            const angle = -2 * Math.PI * k * n / size;
            real += input[n] * Math.cos(angle);
            imag += input[n] * Math.sin(angle);
        }
        
        output[k * 2] = real;
        output[k * 2 + 1] = imag;
    }
};

// Simplified IFFT
AudioToolsPro.prototype.simpleIFFT = function(spectrum, output, size) {
    for (let n = 0; n < size; n++) {
        let sample = 0;
        
        for (let k = 0; k < size / 2; k++) {
            const real = spectrum[k * 2];
            const imag = spectrum[k * 2 + 1];
            const angle = 2 * Math.PI * k * n / size;
            sample += real * Math.cos(angle) - imag * Math.sin(angle);
        }
        
        output[n] = sample / (size / 2);
    }
};

// Enhanced time-stretching dispatcher
AudioToolsPro.prototype.applyTimeStretchingCorrections = async function(originalBuffer, corrections, algorithm) {
    this.log(`🎵 Applying time-stretching corrections using ${algorithm}`, 'info');
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let processedBuffer = this.cloneAudioBuffer(originalBuffer, audioContext);
    
    // Sort corrections by start time (latest first for proper offset handling)
    const sortedCorrections = [...corrections].sort((a, b) => b.timestamp - a.timestamp);
    
    for (const correction of sortedCorrections) {
        if (!correction.apply) continue;
        
        this.log(`🔧 Processing ${correction.name} at ${correction.timestamp.toFixed(1)}s`, 'info');
        
        if (correction.action === 'trim_pause') {
            processedBuffer = await this.trimAudioSegment(
                processedBuffer, correction.timestamp, 
                correction.timestamp + correction.currentDuration,
                correction.suggestedDuration, audioContext
            );
        } else if (correction.action === 'remove_artifact') {
            processedBuffer = await this.removeAudioSegment(
                processedBuffer, correction.timestamp,
                correction.timestamp + correction.currentDuration, audioContext
            );
        } else if (correction.action === 'smooth_rhythm') {
            // Apply advanced time-stretching algorithm
            const stretchRatio = correction.suggestedDuration / correction.currentDuration;
            
            switch (algorithm) {
                case 'phase_vocoder':
                    processedBuffer = await this.applyAdvancedPhaseVocoder(processedBuffer, stretchRatio);
                    break;
                case 'granular':
                    processedBuffer = await this.applyGranularSynthesis(processedBuffer, stretchRatio);
                    break;
                case 'wsola':
                    processedBuffer = await this.applyWSOLA(processedBuffer, stretchRatio);
                    break;
                default:
                    this.log(`⚠️ Unknown algorithm ${algorithm}, using phase vocoder`, 'warning');
                    processedBuffer = await this.applyAdvancedPhaseVocoder(processedBuffer, stretchRatio);
            }
        }
    }
    
    this.log('✅ Time-stretching corrections applied successfully', 'success');
    return processedBuffer;
};