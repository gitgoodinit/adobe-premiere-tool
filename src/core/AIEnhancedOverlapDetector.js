class AIEnhancedOverlapDetector {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.analysisState = {
            isRunning: false,
            progress: 0,
            results: []
        };
    }

    async analyzeAudio(audioData) {
        try {
            this.analysisState.isRunning = true;
            this.app.showUIMessage('🔍 Starting AI-Enhanced audio analysis...', 'processing');

            // Extract audio features
            const features = await this.extractAudioFeatures(audioData);
            
            // Prepare OpenAI prompt
            const prompt = {
                role: "system",
                content: `Analyze the following audio features for overlaps and issues:
                    Duration: ${features.duration}s
                    Peak Amplitude: ${features.peakAmplitude}
                    Average RMS: ${features.averageRMS}
                    Frequency Distribution: ${JSON.stringify(features.frequencyBands)}
                    Detected Segments: ${JSON.stringify(features.segments)}

                    Identify:
                    1. Overlapping audio segments
                    2. Background noise patterns
                    3. Audio conflicts or clashes
                    4. Potential quality issues

                    Return analysis in JSON format:
                    {
                        "overlaps": [
                            {
                                "timestamp": number,
                                "duration": number,
                                "severity": number (0-1),
                                "type": "overlap|noise|conflict",
                                "confidence": number (0-1),
                                "description": string,
                                "recommendation": string
                            }
                        ],
                        "overall_quality": number (0-100),
                        "recommendations": [string]
                    }`
            };

            // Get AI analysis
            const aiAnalysis = await this.app.openaiIntegration.analyze(prompt);
            
            // Validate and process results
            const processedResults = this.processAIResults(aiAnalysis, features);
            
            // Store results
            this.analysisState.results = processedResults;
            
            return processedResults;

        } catch (error) {
            this.app.log(`❌ AI-Enhanced analysis failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.analysisState.isRunning = false;
        }
    }

    async extractAudioFeatures(audioData) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createBufferSource();
        
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Extract features
        const features = {
            duration: audioData.duration,
            peakAmplitude: 0,
            averageRMS: 0,
            frequencyBands: {
                low: 0,    // 20-200Hz
                mid: 0,    // 200-2000Hz
                high: 0    // 2000-20000Hz
            },
            segments: []
        };
        
        // Analyze in chunks
        const chunkSize = 2048;
        for (let i = 0; i < audioData.length; i += chunkSize) {
            analyser.getFloatFrequencyData(dataArray);
            
            // Update features based on current chunk
            this.updateFeatures(features, dataArray);
            
            // Update progress
            const progress = (i / audioData.length) * 100;
            this.app.updateAnalysisProgress('Extracting audio features...', progress);
            
            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return features;
    }

    updateFeatures(features, dataArray) {
        // Calculate RMS and peak amplitude
        let sumSquares = 0;
        let peak = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            const amplitude = Math.abs(dataArray[i]);
            sumSquares += amplitude * amplitude;
            peak = Math.max(peak, amplitude);
        }
        
        features.peakAmplitude = Math.max(features.peakAmplitude, peak);
        features.averageRMS = Math.sqrt(sumSquares / dataArray.length);
        
        // Update frequency bands
        const lowEnd = Math.floor(dataArray.length * 0.1);  // ~20-200Hz
        const midEnd = Math.floor(dataArray.length * 0.5);  // ~200-2000Hz
        
        features.frequencyBands.low = this.calculateBandEnergy(dataArray, 0, lowEnd);
        features.frequencyBands.mid = this.calculateBandEnergy(dataArray, lowEnd, midEnd);
        features.frequencyBands.high = this.calculateBandEnergy(dataArray, midEnd, dataArray.length);
    }

    calculateBandEnergy(data, start, end) {
        let energy = 0;
        for (let i = start; i < end; i++) {
            energy += Math.abs(data[i]);
        }
        return energy / (end - start);
    }

    processAIResults(aiAnalysis, features) {
        if (!aiAnalysis || !aiAnalysis.overlaps) {
            throw new Error('Invalid AI analysis results');
        }

        // Validate and normalize results
        const processedResults = aiAnalysis.overlaps.map(overlap => ({
            timestamp: Math.max(0, Math.min(overlap.timestamp, features.duration)),
            duration: Math.max(0.1, Math.min(overlap.duration, 5.0)),
            severity: Math.max(0, Math.min(overlap.severity, 1)),
            confidence: Math.max(0, Math.min(overlap.confidence, 1)),
            type: this.validateOverlapType(overlap.type),
            description: overlap.description || 'Audio overlap detected',
            recommendation: overlap.recommendation || 'Review and adjust audio timing'
        }));

        // Sort by timestamp
        processedResults.sort((a, b) => a.timestamp - b.timestamp);

        return {
            overlaps: processedResults,
            overall_quality: Math.max(0, Math.min(aiAnalysis.overall_quality || 75, 100)),
            recommendations: aiAnalysis.recommendations || []
        };
    }

    validateOverlapType(type) {
        const validTypes = ['overlap', 'noise', 'conflict'];
        return validTypes.includes(type) ? type : 'overlap';
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEnhancedOverlapDetector;
}
