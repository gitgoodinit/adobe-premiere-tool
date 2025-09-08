/**
 * Enhanced Overlap Detection Engine
 * Provides comprehensive audio overlap detection with visualization and export capabilities
 */

class OverlapDetector {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.sampleRate = audioContext.sampleRate;
        
        // Configuration
        this.config = {
            sensitivity: 5,                 // 1-10 scale
            fftSize: 2048,                 // FFT window size
            hopSize: 512,                  // Analysis hop size
            overlapThreshold: 0.3,         // Correlation threshold
            minOverlapDuration: 0.1,       // Minimum overlap duration (seconds)
            frequencyRange: 'full',        // 'full', 'speech', 'music'
            analysisMode: 'hybrid',        // 'realtime', 'batch', 'hybrid'
            enableML: true,                // Machine learning validation
            enableCrossCorrelation: true,  // Cross-correlation analysis
            enableSpectral: true,          // Spectral analysis
            enableHarmonic: false          // Harmonic analysis
        };
        
        // Audio tracks for analysis
        this.audioTracks = new Map();
        this.overlapResults = [];
        this.isAnalyzing = false;
        this.analysisProgress = 0;
        
        // Frequency filters
        this.frequencyFilters = {
            full: { lowFreq: 20, highFreq: 20000 },
            speech: { lowFreq: 300, highFreq: 3400 },
            music: { lowFreq: 20, highFreq: 20000 }
        };
        
        // Analysis buffers
        this.fftBuffers = new Map();
        this.correlationBuffers = new Map();
        
        // ML models (simplified for demonstration)
        this.mlModels = {
            overlapClassifier: this.initializeMLModel(),
            contentClassifier: this.initializeContentClassifier()
        };
        
        // Event handlers
        this.eventHandlers = {
            'overlapDetected': [],
            'analysisProgress': [],
            'analysisComplete': [],
            'error': []
        };
        
        console.log('OverlapDetector initialized');
    }
    
    // Configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Configuration updated:', this.config);
    }
    
    // Audio Track Management
    addAudioTrack(trackId, audioBuffer, metadata = {}) {
        if (!audioBuffer || !audioBuffer.getChannelData) {
            throw new Error('Invalid audio buffer provided');
        }
        
        const trackData = {
            id: trackId,
            buffer: audioBuffer,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            name: metadata.name || `Track ${trackId}`,
            type: metadata.type || 'unknown', // 'speech', 'music', 'effects'
            color: metadata.color || this.generateTrackColor(trackId),
            analysisData: {
                spectralFeatures: null,
                temporalFeatures: null,
                overlapRegions: []
            }
        };
        
        this.audioTracks.set(trackId, trackData);
        
        // Pre-analyze track
        this.preAnalyzeTrack(trackId);
        
        console.log(`Audio track ${trackId} added: ${trackData.name} (${trackData.duration.toFixed(2)}s)`);
        return trackId;
    }
    
    removeAudioTrack(trackId) {
        if (this.audioTracks.has(trackId)) {
            this.audioTracks.delete(trackId);
            this.fftBuffers.delete(trackId);
            this.correlationBuffers.delete(trackId);
            console.log(`Audio track ${trackId} removed`);
            return true;
        }
        return false;
    }
    
    clearAllTracks() {
        this.audioTracks.clear();
        this.fftBuffers.clear();
        this.correlationBuffers.clear();
        this.overlapResults = [];
        console.log('All audio tracks cleared');
    }
    
    // Pre-analysis for optimization
    preAnalyzeTrack(trackId) {
        const track = this.audioTracks.get(trackId);
        if (!track) return;
        
        const channelData = track.buffer.getChannelData(0);
        const windowSize = this.config.fftSize;
        const hopSize = this.config.hopSize;
        
        // Calculate spectral features
        const spectralFeatures = [];
        const fftBuffer = [];
        
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const window = channelData.slice(i, i + windowSize);
            const spectrum = this.computeFFT(window);
            const features = this.extractSpectralFeatures(spectrum);
            
            spectralFeatures.push({
                time: i / track.sampleRate,
                ...features
            });
            
            fftBuffer.push(spectrum);
        }
        
        track.analysisData.spectralFeatures = spectralFeatures;
        this.fftBuffers.set(trackId, fftBuffer);
        
        console.log(`Pre-analysis complete for track ${trackId}`);
    }
    
    // Main overlap detection
    async detectOverlaps(trackIds = null, progressCallback = null) {\n        if (this.isAnalyzing) {\n            throw new Error('Analysis already in progress');\n        }\n        \n        const tracksToAnalyze = trackIds || Array.from(this.audioTracks.keys());\n        \n        if (tracksToAnalyze.length < 2) {\n            throw new Error('Need at least 2 tracks for overlap detection');\n        }\n        \n        console.log(`Starting overlap detection for ${tracksToAnalyze.length} tracks...`);\n        \n        this.isAnalyzing = true;\n        this.analysisProgress = 0;\n        this.overlapResults = [];\n        \n        const startTime = performance.now();\n        \n        try {\n            const totalPairs = (tracksToAnalyze.length * (tracksToAnalyze.length - 1)) / 2;\n            let completedPairs = 0;\n            \n            // Analyze each pair of tracks\n            for (let i = 0; i < tracksToAnalyze.length; i++) {\n                for (let j = i + 1; j < tracksToAnalyze.length; j++) {\n                    const track1Id = tracksToAnalyze[i];\n                    const track2Id = tracksToAnalyze[j];\n                    \n                    this.emit('analysisProgress', {\n                        current: completedPairs,\n                        total: totalPairs,\n                        percentage: (completedPairs / totalPairs) * 100,\n                        currentPair: [track1Id, track2Id]\n                    });\n                    \n                    const pairOverlaps = await this.detectPairOverlap(track1Id, track2Id);\n                    this.overlapResults.push(...pairOverlaps);\n                    \n                    completedPairs++;\n                    \n                    if (progressCallback) {\n                        progressCallback(completedPairs / totalPairs);\n                    }\n                }\n            }\n            \n            // Post-process results\n            this.postProcessOverlaps();\n            \n            const analysisTime = performance.now() - startTime;\n            \n            this.emit('analysisComplete', {\n                totalOverlaps: this.overlapResults.length,\n                analysisTime: analysisTime,\n                tracksAnalyzed: tracksToAnalyze.length\n            });\n            \n            console.log(`Overlap detection complete: ${this.overlapResults.length} overlaps found in ${analysisTime.toFixed(2)}ms`);\n            \n            return this.overlapResults;\n            \n        } catch (error) {\n            console.error('Overlap detection failed:', error);\n            this.emit('error', { type: 'detection', error });\n            throw error;\n        } finally {\n            this.isAnalyzing = false;\n        }\n    }\n    \n    async detectPairOverlap(track1Id, track2Id) {\n        const track1 = this.audioTracks.get(track1Id);\n        const track2 = this.audioTracks.get(track2Id);\n        \n        if (!track1 || !track2) {\n            throw new Error(`Track not found: ${track1Id} or ${track2Id}`);\n        }\n        \n        const overlaps = [];\n        \n        // Get audio data\n        const buffer1 = track1.buffer.getChannelData(0);\n        const buffer2 = track2.buffer.getChannelData(0);\n        \n        const windowSize = this.config.fftSize;\n        const hopSize = this.config.hopSize;\n        const minLength = Math.min(buffer1.length, buffer2.length);\n        \n        // Sliding window analysis\n        for (let i = 0; i < minLength - windowSize; i += hopSize) {\n            const window1 = buffer1.slice(i, i + windowSize);\n            const window2 = buffer2.slice(i, i + windowSize);\n            \n            const timeStart = i / track1.sampleRate;\n            const timeEnd = (i + windowSize) / track1.sampleRate;\n            \n            // Skip if either window is silent\n            if (this.isWindowSilent(window1) || this.isWindowSilent(window2)) {\n                continue;\n            }\n            \n            // Multiple detection methods\n            const results = {\n                crossCorrelation: 0,\n                spectralSimilarity: 0,\n                temporalSimilarity: 0,\n                harmonicSimilarity: 0\n            };\n            \n            // Cross-correlation analysis\n            if (this.config.enableCrossCorrelation) {\n                results.crossCorrelation = this.calculateCrossCorrelation(window1, window2);\n            }\n            \n            // Spectral similarity\n            if (this.config.enableSpectral) {\n                results.spectralSimilarity = this.calculateSpectralSimilarity(window1, window2);\n            }\n            \n            // Temporal similarity\n            results.temporalSimilarity = this.calculateTemporalSimilarity(window1, window2);\n            \n            // Harmonic analysis (if enabled)\n            if (this.config.enableHarmonic) {\n                results.harmonicSimilarity = this.calculateHarmonicSimilarity(window1, window2);\n            }\n            \n            // Combine results with ML model\n            const overlapScore = this.config.enableML ? \n                this.mlModels.overlapClassifier.predict(results) :\n                this.combineScores(results);\n            \n            // Check if overlap detected\n            if (overlapScore > this.getThreshold()) {\n                const overlapType = this.classifyOverlapType(window1, window2, track1, track2);\n                const confidence = this.calculateConfidence(results, overlapScore);\n                \n                overlaps.push({\n                    track1: track1Id,\n                    track2: track2Id,\n                    startTime: timeStart,\n                    endTime: timeEnd,\n                    duration: timeEnd - timeStart,\n                    type: overlapType,\n                    confidence: confidence,\n                    overlapScore: overlapScore,\n                    details: results,\n                    metadata: {\n                        track1Name: track1.name,\n                        track2Name: track2.name,\n                        track1Type: track1.type,\n                        track2Type: track2.type\n                    }\n                });\n            }\n        }\n        \n        // Merge nearby overlaps\n        return this.mergeNearbyOverlaps(overlaps);\n    }\n    \n    // Analysis algorithms\n    calculateCrossCorrelation(signal1, signal2) {\n        const length = Math.min(signal1.length, signal2.length);\n        \n        // Normalize signals\n        const norm1 = this.normalizeSignal(signal1);\n        const norm2 = this.normalizeSignal(signal2);\n        \n        let correlation = 0;\n        for (let i = 0; i < length; i++) {\n            correlation += norm1[i] * norm2[i];\n        }\n        \n        return Math.abs(correlation / length);\n    }\n    \n    calculateSpectralSimilarity(signal1, signal2) {\n        const spectrum1 = this.computeFFT(signal1);\n        const spectrum2 = this.computeFFT(signal2);\n        \n        // Apply frequency range filter\n        const filteredSpectrum1 = this.applyFrequencyFilter(spectrum1);\n        const filteredSpectrum2 = this.applyFrequencyFilter(spectrum2);\n        \n        // Calculate cosine similarity\n        let dotProduct = 0;\n        let norm1 = 0;\n        let norm2 = 0;\n        \n        for (let i = 0; i < filteredSpectrum1.length; i++) {\n            dotProduct += filteredSpectrum1[i] * filteredSpectrum2[i];\n            norm1 += filteredSpectrum1[i] * filteredSpectrum1[i];\n            norm2 += filteredSpectrum2[i] * filteredSpectrum2[i];\n        }\n        \n        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);\n        return magnitude > 0 ? dotProduct / magnitude : 0;\n    }\n    \n    calculateTemporalSimilarity(signal1, signal2) {\n        // Zero-crossing rate similarity\n        const zcr1 = this.calculateZeroCrossingRate(signal1);\n        const zcr2 = this.calculateZeroCrossingRate(signal2);\n        \n        // Energy similarity\n        const energy1 = this.calculateEnergy(signal1);\n        const energy2 = this.calculateEnergy(signal2);\n        \n        const zcrSim = 1 - Math.abs(zcr1 - zcr2) / Math.max(zcr1, zcr2, 0.001);\n        const energySim = 1 - Math.abs(energy1 - energy2) / Math.max(energy1, energy2, 0.001);\n        \n        return (zcrSim + energySim) / 2;\n    }\n    \n    calculateHarmonicSimilarity(signal1, signal2) {\n        const spectrum1 = this.computeFFT(signal1);\n        const spectrum2 = this.computeFFT(signal2);\n        \n        const peaks1 = this.findSpectralPeaks(spectrum1);\n        const peaks2 = this.findSpectralPeaks(spectrum2);\n        \n        // Compare harmonic structures\n        let matchingPeaks = 0;\n        const tolerance = 50; // Hz\n        \n        for (const peak1 of peaks1) {\n            for (const peak2 of peaks2) {\n                if (Math.abs(peak1.frequency - peak2.frequency) < tolerance) {\n                    matchingPeaks++;\n                    break;\n                }\n            }\n        }\n        \n        return peaks1.length > 0 ? matchingPeaks / peaks1.length : 0;\n    }\n    \n    // Utility functions\n    computeFFT(signal) {\n        // Simplified FFT - in production, use a proper FFT library\n        const N = signal.length;\n        const spectrum = new Array(N / 2);\n        \n        for (let k = 0; k < spectrum.length; k++) {\n            let real = 0;\n            let imag = 0;\n            \n            for (let n = 0; n < N; n++) {\n                const angle = -2 * Math.PI * k * n / N;\n                real += signal[n] * Math.cos(angle);\n                imag += signal[n] * Math.sin(angle);\n            }\n            \n            spectrum[k] = Math.sqrt(real * real + imag * imag);\n        }\n        \n        return spectrum;\n    }\n    \n    applyFrequencyFilter(spectrum) {\n        const filter = this.frequencyFilters[this.config.frequencyRange];\n        const binWidth = this.sampleRate / (spectrum.length * 2);\n        \n        const startBin = Math.floor(filter.lowFreq / binWidth);\n        const endBin = Math.floor(filter.highFreq / binWidth);\n        \n        return spectrum.slice(startBin, endBin);\n    }\n    \n    normalizeSignal(signal) {\n        const max = Math.max(...signal.map(Math.abs));\n        return max > 0 ? signal.map(s => s / max) : signal;\n    }\n    \n    isWindowSilent(window, threshold = -40) {\n        const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);\n        const dbLevel = rms > 0 ? 20 * Math.log10(rms) : -Infinity;\n        return dbLevel < threshold;\n    }\n    \n    calculateZeroCrossingRate(signal) {\n        let crossings = 0;\n        for (let i = 1; i < signal.length; i++) {\n            if ((signal[i] >= 0) !== (signal[i - 1] >= 0)) {\n                crossings++;\n            }\n        }\n        return crossings / signal.length;\n    }\n    \n    calculateEnergy(signal) {\n        return signal.reduce((sum, sample) => sum + sample * sample, 0) / signal.length;\n    }\n    \n    extractSpectralFeatures(spectrum) {\n        const total = spectrum.reduce((sum, bin) => sum + bin, 0);\n        \n        // Spectral centroid\n        let centroid = 0;\n        for (let i = 0; i < spectrum.length; i++) {\n            centroid += i * spectrum[i];\n        }\n        centroid = total > 0 ? (centroid / total) * (this.sampleRate / 2) / spectrum.length : 0;\n        \n        // Spectral rolloff (95%)\n        let rolloff = 0;\n        let cumSum = 0;\n        const rolloffThreshold = total * 0.95;\n        for (let i = 0; i < spectrum.length; i++) {\n            cumSum += spectrum[i];\n            if (cumSum >= rolloffThreshold) {\n                rolloff = (i / spectrum.length) * (this.sampleRate / 2);\n                break;\n            }\n        }\n        \n        // Spectral flux\n        let flux = 0;\n        for (let i = 1; i < spectrum.length; i++) {\n            const diff = spectrum[i] - spectrum[i - 1];\n            flux += diff * diff;\n        }\n        flux = Math.sqrt(flux);\n        \n        return { centroid, rolloff, flux, energy: total };\n    }\n    \n    findSpectralPeaks(spectrum, threshold = 0.1) {\n        const peaks = [];\n        const maxVal = Math.max(...spectrum);\n        const minPeakHeight = maxVal * threshold;\n        \n        for (let i = 1; i < spectrum.length - 1; i++) {\n            if (spectrum[i] > spectrum[i - 1] && \n                spectrum[i] > spectrum[i + 1] && \n                spectrum[i] > minPeakHeight) {\n                peaks.push({\n                    bin: i,\n                    frequency: (i / spectrum.length) * (this.sampleRate / 2),\n                    magnitude: spectrum[i]\n                });\n            }\n        }\n        \n        return peaks.sort((a, b) => b.magnitude - a.magnitude);\n    }\n    \n    combineScores(results) {\n        // Weighted combination of different similarity scores\n        const weights = {\n            crossCorrelation: 0.4,\n            spectralSimilarity: 0.3,\n            temporalSimilarity: 0.2,\n            harmonicSimilarity: 0.1\n        };\n        \n        let score = 0;\n        let totalWeight = 0;\n        \n        for (const [metric, value] of Object.entries(results)) {\n            if (weights[metric] && !isNaN(value)) {\n                score += value * weights[metric];\n                totalWeight += weights[metric];\n            }\n        }\n        \n        return totalWeight > 0 ? score / totalWeight : 0;\n    }\n    \n    getThreshold() {\n        // Map sensitivity (1-10) to threshold (0.1-0.9)\n        return 0.1 + (this.config.sensitivity - 1) * 0.08;\n    }\n    \n    calculateConfidence(results, overlapScore) {\n        // Calculate confidence based on consistency of different metrics\n        const scores = Object.values(results).filter(v => !isNaN(v));\n        if (scores.length === 0) return 0;\n        \n        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;\n        const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;\n        const consistency = 1 - Math.sqrt(variance);\n        \n        return Math.min(1, overlapScore * consistency);\n    }\n    \n    classifyOverlapType(window1, window2, track1, track2) {\n        // Use content classification to determine overlap type\n        const content1 = this.mlModels.contentClassifier.predict(window1);\n        const content2 = this.mlModels.contentClassifier.predict(window2);\n        \n        if (content1 === 'speech' && content2 === 'speech') {\n            return 'speech-speech';\n        } else if ((content1 === 'speech' && content2 === 'music') || \n                   (content1 === 'music' && content2 === 'speech')) {\n            return 'speech-music';\n        } else if (content1 === 'music' && content2 === 'music') {\n            return 'music-music';\n        } else {\n            return 'mixed';\n        }\n    }\n    \n    mergeNearbyOverlaps(overlaps, tolerance = 0.1) {\n        if (overlaps.length <= 1) return overlaps;\n        \n        const merged = [];\n        let current = overlaps[0];\n        \n        for (let i = 1; i < overlaps.length; i++) {\n            const next = overlaps[i];\n            \n            if (next.startTime - current.endTime <= tolerance) {\n                // Merge overlaps\n                current.endTime = Math.max(current.endTime, next.endTime);\n                current.duration = current.endTime - current.startTime;\n                current.confidence = Math.max(current.confidence, next.confidence);\n                current.overlapScore = Math.max(current.overlapScore, next.overlapScore);\n            } else {\n                merged.push(current);\n                current = next;\n            }\n        }\n        \n        merged.push(current);\n        return merged;\n    }\n    \n    postProcessOverlaps() {\n        // Filter out overlaps that are too short\n        this.overlapResults = this.overlapResults.filter(overlap => \n            overlap.duration >= this.config.minOverlapDuration\n        );\n        \n        // Sort by start time\n        this.overlapResults.sort((a, b) => a.startTime - b.startTime);\n        \n        // Add unique IDs\n        this.overlapResults.forEach((overlap, index) => {\n            overlap.id = `overlap_${index + 1}`;\n        });\n    }\n    \n    // ML Models (simplified implementations)\n    initializeMLModel() {\n        return {\n            predict: (results) => {\n                // Simple heuristic-based prediction\n                const { crossCorrelation, spectralSimilarity, temporalSimilarity } = results;\n                const avgScore = (crossCorrelation + spectralSimilarity + temporalSimilarity) / 3;\n                return avgScore;\n            }\n        };\n    }\n    \n    initializeContentClassifier() {\n        return {\n            predict: (audioWindow) => {\n                // Simple content classification based on spectral features\n                const spectrum = this.computeFFT(audioWindow);\n                const features = this.extractSpectralFeatures(spectrum);\n                \n                if (features.centroid > 1000 && features.centroid < 4000) {\n                    return 'speech';\n                } else if (features.centroid < 1000 || features.rolloff > 8000) {\n                    return 'music';\n                } else {\n                    return 'other';\n                }\n            }\n        };\n    }\n    \n    // Results and export\n    getOverlapResults() {\n        return this.overlapResults;\n    }\n    \n    getOverlapById(id) {\n        return this.overlapResults.find(overlap => overlap.id === id);\n    }\n    \n    exportOverlaps(format = 'json') {\n        const exportData = {\n            metadata: {\n                timestamp: new Date().toISOString(),\n                totalOverlaps: this.overlapResults.length,\n                tracksAnalyzed: Array.from(this.audioTracks.keys()),\n                config: this.config\n            },\n            overlaps: this.overlapResults.map(overlap => ({\n                ...overlap,\n                // Remove complex objects for export\n                details: {\n                    crossCorrelation: overlap.details.crossCorrelation,\n                    spectralSimilarity: overlap.details.spectralSimilarity,\n                    temporalSimilarity: overlap.details.temporalSimilarity\n                }\n            }))\n        };\n        \n        switch (format) {\n            case 'json':\n                return JSON.stringify(exportData, null, 2);\n            case 'csv':\n                return this.exportToCSV(exportData);\n            case 'xml':\n                return this.exportToXML(exportData);\n            default:\n                return exportData;\n        }\n    }\n    \n    exportToCSV(data) {\n        const headers = [\n            'ID', 'Track1', 'Track2', 'StartTime', 'EndTime', 'Duration',\n            'Type', 'Confidence', 'OverlapScore'\n        ];\n        \n        const rows = data.overlaps.map(overlap => [\n            overlap.id,\n            overlap.metadata.track1Name,\n            overlap.metadata.track2Name,\n            overlap.startTime.toFixed(3),\n            overlap.endTime.toFixed(3),\n            overlap.duration.toFixed(3),\n            overlap.type,\n            overlap.confidence.toFixed(3),\n            overlap.overlapScore.toFixed(3)\n        ]);\n        \n        return [headers, ...rows].map(row => row.join(',')).join('\\n');\n    }\n    \n    exportToXML(data) {\n        let xml = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\\n<overlapAnalysis>\\n';\n        \n        xml += `  <metadata>\\n`;\n        xml += `    <timestamp>${data.metadata.timestamp}</timestamp>\\n`;\n        xml += `    <totalOverlaps>${data.metadata.totalOverlaps}</totalOverlaps>\\n`;\n        xml += `  </metadata>\\n`;\n        \n        xml += `  <overlaps>\\n`;\n        data.overlaps.forEach(overlap => {\n            xml += `    <overlap id=\"${overlap.id}\">\\n`;\n            xml += `      <tracks track1=\"${overlap.track1}\" track2=\"${overlap.track2}\" />\\n`;\n            xml += `      <timing start=\"${overlap.startTime}\" end=\"${overlap.endTime}\" duration=\"${overlap.duration}\" />\\n`;\n            xml += `      <classification type=\"${overlap.type}\" confidence=\"${overlap.confidence}\" />\\n`;\n            xml += `    </overlap>\\n`;\n        });\n        xml += `  </overlaps>\\n`;\n        xml += `</overlapAnalysis>`;\n        \n        return xml;\n    }\n    \n    // Utility methods\n    generateTrackColor(trackId) {\n        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];\n        return colors[trackId % colors.length];\n    }\n    \n    // Event system\n    on(event, handler) {\n        if (!this.eventHandlers[event]) {\n            this.eventHandlers[event] = [];\n        }\n        this.eventHandlers[event].push(handler);\n    }\n    \n    off(event, handler) {\n        if (this.eventHandlers[event]) {\n            const index = this.eventHandlers[event].indexOf(handler);\n            if (index > -1) {\n                this.eventHandlers[event].splice(index, 1);\n            }\n        }\n    }\n    \n    emit(event, data) {\n        if (this.eventHandlers[event]) {\n            this.eventHandlers[event].forEach(handler => {\n                try {\n                    handler(data);\n                } catch (error) {\n                    console.error(`Error in event handler for ${event}:`, error);\n                }\n            });\n        }\n    }\n    \n    // Cleanup\n    destroy() {\n        this.clearAllTracks();\n        this.eventHandlers = {};\n        console.log('OverlapDetector destroyed');\n    }\n}\n\nexport default OverlapDetector;"
