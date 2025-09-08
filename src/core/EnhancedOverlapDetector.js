/**
 * Enhanced Audio Overlap Detection with Clipping & Loudness Analysis
 * Integrates FFT analysis, FFmpeg stats, EBU R128 loudness, and AI validation for overlapping voices/noises.
 * Detects overlaps, clipping, and overly loud sections
 */

class EnhancedOverlapDetector {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.audioContext = null;
        this.analyserNodes = [];
        this.audioSourceNode = null;
        
        // Enhanced configuration for comprehensive analysis
        this.config = {
            analysis: {
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                crossCorrelationThreshold: 0.7,
                overlapDetectionThreshold: 0.4,
                harmonicThreshold: 0.5,
                mlConfidenceThreshold: 0.7
            },
            clipping: {
                peakThreshold: -0.1, // dBFS - detect near-clipping
                rmsThreshold: -20,    // dBFS - detect overly loud sections
                enableEBUR128: true,  // EBU R128 loudness normalization
                targetLoudness: -16,  // LUFS target
                truePeak: -1.5,       // dBTP target
                lra: 11               // Loudness Range
            },
            ffmpeg: {
                executable: this.getFFmpegPath(),
                statsFilter: 'astats=metadata=1:reset=1',
                loudnessFilter: 'loudnorm=I=-16:TP=-1.5:LRA=11',
                clippingFilter: 'acompressor=threshold=0.1:ratio=20:attack=0.01:release=0.1'
            },
            ai: {
                enableValidation: true,
                openaiModel: 'gpt-4o-mini',
                validationPrompt: 'Analyze this audio segment and determine if it contains overlapping voices, background noise, or multiple audio sources. Return a JSON response with: {"hasOverlap": boolean, "overlapType": string, "confidence": number, "description": string}'
            }
        };
        
        this.analysisState = {
            isRunning: false,
            startTime: null,
            currentStep: 'idle',
            progress: 0,
            overlapsFound: 0,
            clippingDetected: 0,
            loudnessIssues: 0
        };
        
        this.lastAnalysisResults = [];
        this.initializeAudioContext();
    }

    // ========================================
    // MAIN ENHANCED OVERLAP DETECTION
    // ========================================

    async detectAudioOverlaps(audioFile, options = {}) {
        if (this.analysisState.isRunning) {
            this.app.log('⚠️ Analysis already in progress', 'warning');
            return;
        }

        this.initializeAnalysisState();
        this.showProgressPanel();
        
        try {
            this.app.log('🔍 Starting Enhanced Audio Overlap Detection...', 'info');
            this.showUIMessage('🔍 Starting Enhanced Analysis...', 'processing');
            
            // Step 1: Audio preprocessing and validation
            this.updateAnalysisProgress('Preprocessing audio...', 10);
            const preprocessedAudio = await this.preprocessAudioForAnalysis(audioFile);
            
            // Step 2: FFmpeg-based analysis (clipping, loudness, stats)
            this.updateAnalysisProgress('Running FFmpeg analysis...', 20);
            const ffmpegResults = await this.runFFmpegAnalysis(preprocessedAudio);
            
            // Step 3: Web Audio API frequency analysis
            this.updateAnalysisProgress('Running frequency analysis...', 40);
            const frequencyResults = await this.runFrequencyAnalysis(preprocessedAudio);
            
            // Step 4: Cross-correlation and overlap detection
            this.updateAnalysisProgress('Detecting overlaps...', 60);
            const overlapResults = await this.detectOverlapsWithDSP(preprocessedAudio);
            
            // Step 5: AI validation of detected overlaps
            this.updateAnalysisProgress('Validating with AI...', 80);
            const aiValidatedResults = await this.validateOverlapsWithAI(overlapResults);
            
            // Step 6: Merge and finalize results
            this.updateAnalysisProgress('Finalizing results...', 90);
            const finalResults = this.mergeAnalysisResults({
                ffmpeg: ffmpegResults,
                frequency: frequencyResults,
                overlaps: aiValidatedResults
            });
            
            // Store and display results
            this.lastAnalysisResults = finalResults;
            this.analysisState.overlapsFound = finalResults.length;
            
            // Generate visualizations
            await this.generateEnhancedVisualizations(finalResults);
            
            // Display results
            this.displayEnhancedOverlapResults(finalResults);
            
            // Enable resolution buttons
            this.enableOverlapResolution();
            
            this.updateAnalysisProgress('Enhanced analysis complete!', 100);
            this.showUIMessage(`✅ Enhanced detection complete: ${finalResults.length} issues found`, 'success');
            
            // Hide progress panel after delay
            setTimeout(() => this.hideProgressPanel(), 2000);
            
            return finalResults;
            
        } catch (error) {
            this.log(`❌ Enhanced audio overlap detection failed: ${error.message}`, 'error');
            this.hideProgressPanel();
            throw error;
        } finally {
            this.analysisState.isRunning = false;
        }
    }

    // ========================================
    // AUDIO PREPROCESSING FOR ANALYSIS
    // ========================================

    async preprocessAudioForAnalysis(audioFile) {
        this.app.log('🔧 Preprocessing audio for enhanced analysis...', 'info');
        
        try {
            const { enableEBUR128, targetLoudness, truePeak, lra } = this.config.clipping;
            
            // Build preprocessing filters
            const filters = [];
            
            // Convert to mono for analysis
            filters.push('aformat=channel_layouts=mono');
            
            // Resample to 48kHz for consistent analysis
            filters.push('aresample=48000');
            
            // Apply EBU R128 loudness normalization if enabled
            if (enableEBUR128) {
                filters.push(`loudnorm=I=${targetLoudness}:TP=${truePeak}:LRA=${lra}`);
            }
            
            // Apply gentle compression to prevent clipping
            filters.push('acompressor=threshold=0.1:ratio=4:attack=0.01:release=0.1');
            
            const filterChain = filters.join(',');
            
            if (filterChain) {
                const preprocessedPath = await this.runFFmpegPreprocessing(audioFile, filterChain);
                this.app.log('✅ Audio preprocessing completed', 'success');
                return preprocessedPath;
            }
            
            return audioFile;
            
        } catch (error) {
            this.app.log(`⚠️ Preprocessing failed, using original audio: ${error.message}`, 'warning');
            return audioFile;
        }
    }

    async runFFmpegPreprocessing(inputPath, filters) {
        return new Promise((resolve, reject) => {
            try {
                const { spawn } = require('child_process');
                const outputPath = inputPath.replace(/\.[^/.]+$/, '_preprocessed_analysis.wav');
                
                const args = [
                    '-i', inputPath,
                    '-af', filters,
                    '-y',
                    outputPath
                ];
                
                const process = spawn(this.config.ffmpeg.executable, args);
                let stderr = '';
                
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                process.on('close', (code) => {
                    if (code === 0) {
                        resolve(outputPath);
                    } else {
                        reject(new Error(`FFmpeg preprocessing failed: ${stderr}`));
                    }
                });
                
                process.on('error', (error) => {
                    reject(new Error(`FFmpeg execution failed: ${error.message}`));
                });
                
            } catch (error) {
                reject(new Error(`FFmpeg not available: ${error.message}`));
            }
        });
    }

    // ========================================
    // FFMPEG-BASED ANALYSIS (CLIPPING, LOUDNESS, STATS)
    // ========================================

    async runFFmpegAnalysis(audioFile) {
        this.app.log('🎬 Running FFmpeg audio analysis...', 'info');
        
        try {
            const results = {
                clipping: [],
                loudness: [],
                stats: {}
            };
            
            // Run multiple FFmpeg analyses in parallel
            const [clippingResults, loudnessResults, statsResults] = await Promise.all([
                this.detectClippingWithFFmpeg(audioFile),
                this.analyzeLoudnessWithFFmpeg(audioFile),
                this.getAudioStatsWithFFmpeg(audioFile)
            ]);
            
            results.clipping = clippingResults;
            results.loudness = loudnessResults;
            results.stats = statsResults;
            
            this.app.log(`🎬 FFmpeg analysis completed: ${clippingResults.length} clipping issues, ${loudnessResults.length} loudness issues`, 'success');
            return results;
            
        } catch (error) {
            this.app.log(`❌ FFmpeg analysis failed: ${error.message}`, 'error');
            return { clipping: [], loudness: [], stats: {} };
        }
    }

    async detectClippingWithFFmpeg(audioFile) {
        try {
            const { peakThreshold, rmsThreshold } = this.config.clipping;
            
            // Use astats filter to detect clipping
            const command = [
                this.config.ffmpeg.executable,
                '-i', audioFile,
                '-af', this.config.ffmpeg.statsFilter,
                '-f', 'null',
                '-'
            ];
            
            const result = await this.executeFFmpeg(command);
            return this.parseClippingFromFFmpegOutput(result.stderr, peakThreshold, rmsThreshold);
            
        } catch (error) {
            this.app.log(`⚠️ Clipping detection failed: ${error.message}`, 'warning');
            return [];
        }
    }

    parseClippingFromFFmpegOutput(output, peakThreshold, rmsThreshold) {
        const clippingIssues = [];
        
        // Parse peak levels
        const peakMatch = output.match(/Peak_level:\s*([-\d.]+)/);
        if (peakMatch) {
            const peakLevel = parseFloat(peakMatch[1]);
            if (peakLevel > peakThreshold) {
                clippingIssues.push({
                    type: 'clipping',
                    severity: 'high',
                    value: peakLevel,
                    threshold: peakThreshold,
                    description: `Peak level ${peakLevel}dB exceeds threshold ${peakThreshold}dB`,
                    confidence: 0.95,
                    method: 'ffmpeg_astats'
                });
            }
        }
        
        // Parse RMS levels
        const rmsMatch = output.match(/RMS_level:\s*([-\d.]+)/);
        if (rmsMatch) {
            const rmsLevel = parseFloat(rmsMatch[1]);
            if (rmsLevel > rmsThreshold) {
                clippingIssues.push({
                    type: 'loudness',
                    severity: 'medium',
                    value: rmsLevel,
                    threshold: rmsThreshold,
                    description: `RMS level ${rmsLevel}dB exceeds threshold ${rmsThreshold}dB`,
                    confidence: 0.9,
                    method: 'ffmpeg_astats'
                });
            }
        }
        
        // Parse other audio statistics
        const flatnessMatch = output.match(/Flatness:\s*([\d.]+)/);
        if (flatnessMatch) {
            const flatness = parseFloat(flatnessMatch[1]);
            if (flatness < 0.1) {
                clippingIssues.push({
                    type: 'distortion',
                    severity: 'medium',
                    value: flatness,
                    threshold: 0.1,
                    description: `Low flatness (${flatness}) indicates potential distortion`,
                    confidence: 0.8,
                    method: 'ffmpeg_astats'
                });
            }
        }
        
        return clippingIssues;
    }

    async analyzeLoudnessWithFFmpeg(audioFile) {
        try {
            const { targetLoudness, truePeak, lra } = this.config.clipping;
            
            // Run loudness analysis
            const command = [
                this.config.ffmpeg.executable,
                '-i', audioFile,
                '-af', `loudnorm=print_format=json:I=${targetLoudness}:TP=${truePeak}:LRA=${lra}`,
                '-f', 'null',
                '-'
            ];
            
            const result = await this.executeFFmpeg(command);
            return this.parseLoudnessFromFFmpegOutput(result.stderr, targetLoudness, truePeak);
            
        } catch (error) {
            this.app.log(`⚠️ Loudness analysis failed: ${error.message}`, 'warning');
            return [];
        }
    }

    parseLoudnessFromFFmpegOutput(output, targetLoudness, targetTruePeak) {
        const loudnessIssues = [];
        
        // Parse integrated loudness
        const integratedMatch = output.match(/input_i:\s*([-\d.]+)/);
        if (integratedMatch) {
            const integrated = parseFloat(integratedMatch[1]);
            const deviation = Math.abs(integrated - targetLoudness);
            
            if (deviation > 3) {
                loudnessIssues.push({
                    type: 'loudness_deviation',
                    severity: deviation > 5 ? 'high' : 'medium',
                    value: integrated,
                    target: targetLoudness,
                    deviation: deviation,
                    description: `Integrated loudness ${integrated}LUFS deviates ${deviation}LUFS from target ${targetLoudness}LUFS`,
                    confidence: 0.9,
                    method: 'ffmpeg_loudnorm'
                });
            }
        }
        
        // Parse true peak
        const truePeakMatch = output.match(/input_tp:\s*([-\d.]+)/);
        if (truePeakMatch) {
            const truePeak = parseFloat(truePeakMatch[1]);
            if (truePeak > targetTruePeak) {
                loudnessIssues.push({
                    type: 'true_peak_exceeded',
                    severity: 'high',
                    value: truePeak,
                    target: targetTruePeak,
                    description: `True peak ${truePeak}dBTP exceeds target ${targetTruePeak}dBTP`,
                    confidence: 0.95,
                    method: 'ffmpeg_loudnorm'
                });
            }
        }
        
        return loudnessIssues;
    }

    async getAudioStatsWithFFmpeg(audioFile) {
        try {
            const command = [
                this.config.ffmpeg.executable,
                '-i', audioFile,
                '-af', 'astats=metadata=1:reset=1',
                '-f', 'null',
                '-'
            ];
            
            const result = await this.executeFFmpeg(command);
            return this.parseAudioStatsFromFFmpegOutput(result.stderr);
            
        } catch (error) {
            this.app.log(`⚠️ Audio stats failed: ${error.message}`, 'warning');
            return {};
        }
    }

    parseAudioStatsFromFFmpegOutput(output) {
        const stats = {};
        
        // Extract various audio statistics
        const patterns = {
            'Peak_level': /Peak_level:\s*([-\d.]+)/,
            'RMS_level': /RMS_level:\s*([-\d.]+)/,
            'Flatness': /Flatness:\s*([\d.]+)/,
            'Peak_count': /Peak_count:\s*(\d+)/,
            'Bit_depth': /Bit_depth:\s*(\d+)/,
            'Sample_rate': /Sample_rate:\s*(\d+)/
        };
        
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = output.match(pattern);
            if (match) {
                stats[key] = parseFloat(match[1]);
            }
        }
        
        return stats;
    }

    // ========================================
    // FREQUENCY DOMAIN ANALYSIS
    // ========================================

    async runFrequencyAnalysis(audioFile) {
        this.app.log('🌊 Running frequency domain analysis...', 'info');
        
        try {
            const audioContext = this.initializeAudioContext();
            const audioSource = await this.setupAudioNodes(audioContext);
            
            // Perform FFT analysis
            const frequencyResults = await this.performFFTAnalysis(audioContext, audioSource);
            
            // Clean up audio nodes
            this.cleanupAudioNodes();
            
            this.app.log(`🌊 Frequency analysis completed: ${frequencyResults.length} frequency issues found`, 'success');
            return frequencyResults;
            
        } catch (error) {
            this.app.log(`❌ Frequency analysis failed: ${error.message}`, 'error');
            return [];
        }
    }

    async performFFTAnalysis(audioContext, audioSource) {
        return new Promise((resolve) => {
            const analyser = audioContext.createAnalyser();
            const { fftSize, smoothingTimeConstant } = this.config.analysis;
            
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;
            
            audioSource.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const results = [];
            let analysisTime = 0;
            const analysisInterval = 100; // ms
            
            const analyze = () => {
                analyser.getByteFrequencyData(dataArray);
                
                // Analyze frequency distribution
                const frequencyIssues = this.analyzeFrequencyData(dataArray, analysisTime);
                if (frequencyIssues.length > 0) {
                    results.push(...frequencyIssues);
                }
                
                analysisTime += analysisInterval;
                
                // Continue analysis for 5 seconds or until audio ends
                if (analysisTime < 5000 && audioSource.mediaElement && !audioSource.mediaElement.ended) {
                    setTimeout(analyze, analysisInterval);
                } else {
                    resolve(results);
                }
            };
            
            analyze();
        });
    }

    analyzeFrequencyData(dataArray, timestamp) {
        const issues = [];
        const { overlapDetectionThreshold, harmonicThreshold } = this.config.analysis;
        
        // Calculate frequency statistics
        let totalEnergy = 0;
        let peakFrequencies = [];
        let harmonicContent = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i] / 255; // Normalize to 0-1
            totalEnergy += value * value;
            
            if (value > 0.8) {
                peakFrequencies.push({
                    frequency: (i * 22050) / dataArray.length, // Approximate frequency
                    amplitude: value
                });
            }
        }
        
        const avgEnergy = totalEnergy / dataArray.length;
        
        // Detect potential overlaps based on energy distribution
        if (avgEnergy > overlapDetectionThreshold) {
            issues.push({
                type: 'frequency_overlap',
                severity: avgEnergy > 0.8 ? 'high' : 'medium',
                timestamp: timestamp,
                value: avgEnergy,
                threshold: overlapDetectionThreshold,
                description: `High frequency energy (${avgEnergy.toFixed(3)}) suggests overlapping audio`,
                confidence: Math.min(0.9, avgEnergy * 1.1),
                method: 'fft_analysis',
                frequencyData: {
                    peakFrequencies: peakFrequencies.slice(0, 5),
                    totalEnergy: avgEnergy
                }
            });
        }
        
        // Detect harmonic content (potential music/speech overlap)
        if (peakFrequencies.length > 3) {
            const frequencyGaps = [];
            for (let i = 1; i < peakFrequencies.length; i++) {
                frequencyGaps.push(peakFrequencies[i].frequency - peakFrequencies[i-1].frequency);
            }
            
            // Check for harmonic relationships
            const harmonicRatios = frequencyGaps.map(gap => gap / frequencyGaps[0]);
            const harmonicScore = harmonicRatios.filter(ratio => 
                Math.abs(ratio - Math.round(ratio)) < 0.1
            ).length / harmonicRatios.length;
            
            if (harmonicScore > harmonicThreshold) {
                issues.push({
                    type: 'harmonic_overlap',
                    severity: 'medium',
                    timestamp: timestamp,
                    value: harmonicScore,
                    threshold: harmonicThreshold,
                    description: `High harmonic content (${harmonicScore.toFixed(3)}) suggests musical overlap`,
                    confidence: harmonicScore * 0.8,
                    method: 'fft_analysis',
                    frequencyData: {
                        harmonicScore: harmonicScore,
                        peakFrequencies: peakFrequencies.slice(0, 5)
                    }
                });
            }
        }
        
        return issues;
    }

    // ========================================
    // DSP-BASED OVERLAP DETECTION
    // ========================================

    async detectOverlapsWithDSP(audioFile) {
        this.app.log('🔬 Running DSP overlap detection...', 'info');
        
        try {
            const audioContext = this.initializeAudioContext();
            const audioSource = await this.setupAudioNodes(audioContext);
            
            // Perform cross-correlation analysis
            const crossCorrelationResults = await this.performCrossCorrelationAnalysis(audioContext, audioSource);
            
            // Perform envelope analysis
            const envelopeResults = await this.performEnvelopeAnalysis(audioContext, audioSource);
            
            // Clean up audio nodes
            this.cleanupAudioNodes();
            
            const allResults = [...crossCorrelationResults, ...envelopeResults];
            this.app.log(`🔬 DSP analysis completed: ${allResults.length} overlap patterns found`, 'success');
            
            return allResults;
            
        } catch (error) {
            this.app.log(`❌ DSP analysis failed: ${error.message}`, 'error');
            return [];
        }
    }

    async performCrossCorrelationAnalysis(audioContext, audioSource) {
        return new Promise((resolve) => {
            const analyser = audioContext.createAnalyser();
            const { crossCorrelationThreshold } = this.config.analysis;
            
            analyser.fftSize = 4096; // Higher resolution for correlation
            audioSource.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            
            const results = [];
            let analysisTime = 0;
            const analysisInterval = 200; // ms
            
            const analyze = () => {
                analyser.getFloatTimeDomainData(dataArray);
                
                // Perform cross-correlation analysis
                const correlationIssues = this.analyzeCrossCorrelation(dataArray, analysisTime);
                if (correlationIssues.length > 0) {
                    results.push(...correlationIssues);
                }
                
                analysisTime += analysisInterval;
                
                if (analysisTime < 5000 && audioSource.mediaElement && !audioSource.mediaElement.ended) {
                    setTimeout(analyze, analysisInterval);
                } else {
                    resolve(results);
                }
            };
            
            analyze();
        });
    }

    analyzeCrossCorrelation(dataArray, timestamp) {
        const issues = [];
        const { crossCorrelationThreshold } = this.config.analysis;
        
        // Simple cross-correlation analysis
        const windowSize = Math.floor(dataArray.length / 4);
        const correlations = [];
        
        for (let lag = 1; lag < windowSize; lag++) {
            let correlation = 0;
            let count = 0;
            
            for (let i = 0; i < dataArray.length - lag; i++) {
                correlation += dataArray[i] * dataArray[i + lag];
                count++;
            }
            
            if (count > 0) {
                correlation /= count;
                correlations.push({ lag, correlation });
            }
        }
        
        // Find peaks in correlation
        const peaks = correlations.filter(c => c.correlation > crossCorrelationThreshold);
        
        if (peaks.length > 0) {
            const maxCorrelation = Math.max(...peaks.map(p => p.correlation));
            
            issues.push({
                type: 'cross_correlation_overlap',
                severity: maxCorrelation > 0.8 ? 'high' : 'medium',
                timestamp: timestamp,
                value: maxCorrelation,
                threshold: crossCorrelationThreshold,
                description: `Cross-correlation peak (${maxCorrelation.toFixed(3)}) suggests overlapping patterns`,
                confidence: maxCorrelation * 0.9,
                method: 'cross_correlation',
                correlationData: {
                    maxCorrelation: maxCorrelation,
                    peakCount: peaks.length,
                    averageLag: peaks.reduce((sum, p) => sum + p.lag, 0) / peaks.length
                }
            });
        }
        
        return issues;
    }

    async performEnvelopeAnalysis(audioContext, audioSource) {
        return new Promise((resolve) => {
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            audioSource.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const results = [];
            let analysisTime = 0;
            const analysisInterval = 150; // ms
            
            const analyze = () => {
                analyser.getByteFrequencyData(dataArray);
                
                // Analyze envelope characteristics
                const envelopeIssues = this.analyzeEnvelopeCharacteristics(dataArray, analysisTime);
                if (envelopeIssues.length > 0) {
                    results.push(...envelopeIssues);
                }
                
                analysisTime += analysisInterval;
                
                if (analysisTime < 5000 && audioSource.mediaElement && !audioSource.mediaElement.ended) {
                    setTimeout(analyze, analysisInterval);
                } else {
                    resolve(results);
                }
            };
            
            analyze();
        });
    }

    analyzeEnvelopeCharacteristics(dataArray, timestamp) {
        const issues = [];
        
        // Calculate envelope statistics
        let attackCount = 0;
        let releaseCount = 0;
        let suddenChanges = 0;
        
        for (let i = 1; i < dataArray.length; i++) {
            const current = dataArray[i] / 255;
            const previous = dataArray[i-1] / 255;
            const change = Math.abs(current - previous);
            
            if (change > 0.3) {
                suddenChanges++;
                
                if (current > previous) {
                    attackCount++;
                } else {
                    releaseCount++;
                }
            }
        }
        
        const changeRate = suddenChanges / dataArray.length;
        
        // Detect potential overlaps based on envelope characteristics
        if (changeRate > 0.1) {
            issues.push({
                type: 'envelope_overlap',
                severity: changeRate > 0.2 ? 'high' : 'medium',
                timestamp: timestamp,
                value: changeRate,
                threshold: 0.1,
                description: `High envelope change rate (${changeRate.toFixed(3)}) suggests overlapping audio sources`,
                confidence: Math.min(0.9, changeRate * 4),
                method: 'envelope_analysis',
                envelopeData: {
                    changeRate: changeRate,
                    attackCount: attackCount,
                    releaseCount: releaseCount,
                    suddenChanges: suddenChanges
                }
            });
        }
        
        return issues;
    }

    // ========================================
    // AI VALIDATION OF DETECTED OVERLAPS
    // ========================================

    async validateOverlapsWithAI(overlapResults) {
        if (!this.config.ai.enableValidation || !this.getOpenAIKey()) {
            this.app.log('⚠️ AI validation skipped - disabled or no API key', 'warning');
            return overlapResults;
        }
        
        this.app.log('🤖 Running AI validation of detected overlaps...', 'info');
        
        try {
            const validatedResults = [];
            
            for (const result of overlapResults) {
                if (result.confidence > 0.6) { // Only validate high-confidence results
                    try {
                        const aiValidation = await this.validateWithOpenAI(result);
                        if (aiValidation) {
                            result.aiValidation = aiValidation;
                            result.confidence = (result.confidence + aiValidation.confidence) / 2;
                        }
                    } catch (error) {
                        this.app.log(`⚠️ AI validation failed for result: ${error.message}`, 'warning');
                    }
                }
                validatedResults.push(result);
            }
            
            this.app.log(`🤖 AI validation completed: ${validatedResults.length} results validated`, 'success');
            return validatedResults;
            
        } catch (error) {
            this.app.log(`❌ AI validation failed: ${error.message}`, 'error');
            return overlapResults;
        }
    }

    async validateWithOpenAI(result) {
        try {
            const prompt = `${this.config.ai.validationPrompt}\n\nAudio Analysis Result:\nType: ${result.type}\nDescription: ${result.description}\nConfidence: ${result.confidence}\nMethod: ${result.method}`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getOpenAIKey()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.ai.openaiModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an audio analysis expert. Analyze the provided audio analysis result and determine if it indicates overlapping audio sources.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.3
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Parse JSON response
            try {
                const validation = JSON.parse(content);
                return validation;
            } catch (parseError) {
                // Fallback to text parsing
                return {
                    hasOverlap: content.toLowerCase().includes('overlap'),
                    confidence: 0.7,
                    description: content
                };
            }
            
        } catch (error) {
            throw new Error(`AI validation failed: ${error.message}`);
        }
    }

    // ========================================
    // RESULT MERGING AND FINALIZATION
    // ========================================

    mergeAnalysisResults(results) {
        this.app.log('🔄 Merging analysis results...', 'info');
        
        const allResults = [
            ...(results.ffmpeg?.clipping || []),
            ...(results.ffmpeg?.loudness || []),
            ...(results.frequency || []),
            ...(results.overlaps || [])
        ];
        
        if (allResults.length === 0) {
            return [];
        }
        
        // Sort by confidence (highest first)
        allResults.sort((a, b) => b.confidence - a.confidence);
        
        // Remove duplicates and merge similar results
        const merged = this.mergeSimilarResults(allResults);
        
        // Add metadata
        const enhanced = merged.map(result => ({
            ...result,
            id: `overlap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            analysisMethod: 'enhanced_multi_method'
        }));
        
        this.app.log(`🔄 Merged ${allResults.length} results into ${enhanced.length} unique issues`, 'info');
        return enhanced;
    }

    mergeSimilarResults(results) {
        const merged = [];
        const processed = new Set();
        
        for (let i = 0; i < results.length; i++) {
            if (processed.has(i)) continue;
            
            const current = results[i];
            const similar = [current];
            processed.add(i);
            
            // Find similar results
            for (let j = i + 1; j < results.length; j++) {
                if (processed.has(j)) continue;
                
                const other = results[j];
                if (this.resultsAreSimilar(current, other)) {
                    similar.push(other);
                    processed.add(j);
                }
            }
            
            // Merge similar results
            if (similar.length === 1) {
                merged.push(current);
            } else {
                merged.push(this.mergeSimilarResultGroup(similar));
            }
        }
        
        return merged;
    }

    resultsAreSimilar(result1, result2) {
        // Check if results are similar based on type, severity, and confidence
        if (result1.type !== result2.type) return false;
        if (result1.severity !== result2.severity) return false;
        
        // Check if they're close in time (within 500ms)
        if (result1.timestamp && result2.timestamp) {
            const timeDiff = Math.abs(result1.timestamp - result2.timestamp);
            if (timeDiff > 500) return false;
        }
        
        return true;
    }

    mergeSimilarResultGroup(similarResults) {
        const merged = { ...similarResults[0] };
        
        // Average confidence
        merged.confidence = similarResults.reduce((sum, r) => sum + r.confidence, 0) / similarResults.length;
        
        // Combine descriptions
        const descriptions = [...new Set(similarResults.map(r => r.description))];
        merged.description = descriptions.join('; ');
        
        // Combine methods
        const methods = [...new Set(similarResults.map(r => r.method))];
        merged.method = methods.join(' + ');
        
        // Update severity based on highest confidence
        const maxConfidence = Math.max(...similarResults.map(r => r.confidence));
        if (maxConfidence > 0.8) merged.severity = 'high';
        else if (maxConfidence > 0.6) merged.severity = 'medium';
        else merged.severity = 'low';
        
        return merged;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    initializeAnalysisState() {
        this.analysisState = {
            isRunning: true,
            startTime: Date.now(),
            currentStep: 'initializing',
            progress: 0,
            overlapsFound: 0,
            clippingDetected: 0,
            loudnessIssues: 0
        };
    }

    updateAnalysisProgress(message, progress) {
        this.analysisState.currentStep = message;
        this.analysisState.progress = progress;
        
        // Update UI progress
        if (this.app.updateProgressBar) {
            this.app.updateProgressBar(progress, message);
        }
        
        // Update progress panel if it exists
        const progressStatus = document.getElementById('progressStatus');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const currentStep = document.getElementById('currentStep');
        
        if (progressStatus) progressStatus.textContent = message;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
        if (currentStep) currentStep.textContent = message;
    }

    showProgressPanel() {
        const progressPanel = document.getElementById('progressPanel');
        if (progressPanel) {
            progressPanel.style.display = 'block';
        }
    }

    hideProgressPanel() {
        const progressPanel = document.getElementById('progressPanel');
        if (progressPanel) {
            progressPanel.style.display = 'none';
        }
    }

    showUIMessage(message, type = 'info') {
        if (this.app.showUIMessage) {
            this.app.showUIMessage(message, type);
        }
    }

    log(message, level = 'info') {
        if (this.app.log) {
            this.app.log(message, level);
        } else {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    }

    initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.log('🎵 Web Audio API context initialized', 'info');
                return this.audioContext;
            } else {
                throw new Error('Web Audio API not supported');
            }
        } catch (error) {
            this.log(`⚠️ Audio context initialization failed: ${error.message}`, 'warning');
            throw error;
        }
    }

    async setupAudioNodes(audioContext) {
        try {
            // Create audio source from file
            const audioBuffer = await this.loadAudioBuffer(this.currentAudioFile);
            const audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            
            // Connect to destination
            audioSource.connect(audioContext.destination);
            
            return audioSource;
            
        } catch (error) {
            throw new Error(`Failed to setup audio nodes: ${error.message}`);
        }
    }

    async loadAudioBuffer(audioFile) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        const arrayBuffer = await this.fileToArrayBuffer(audioFile);
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        return audioBuffer;
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read audio file'));
            reader.readAsArrayBuffer(file);
        });
    }

    cleanupAudioNodes() {
        try {
            this.analyserNodes.forEach(node => {
                if (node.disconnect) node.disconnect();
            });
            this.analyserNodes = [];
            
            this.log('🧹 Audio nodes cleaned up', 'info');
        } catch (error) {
            this.log(`⚠️ Error cleaning up audio nodes: ${error.message}`, 'warning');
        }
    }

    async executeFFmpeg(command) {
        const { spawn } = require('child_process');
        
        return new Promise((resolve, reject) => {
            const process = spawn(command[0], command.slice(1));
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`FFmpeg execution failed: ${error.message}`));
            });
        });
    }

    getFFmpegPath() {
        const os = require('os');
        const platform = os.platform();
        
        if (platform === 'win32') {
            return 'ffmpeg.exe';
        } else {
            return '/usr/local/bin/ffmpeg';
        }
    }

    getOpenAIKey() {
        return process.env.OPENAI_API_KEY || this.app.settings?.openaiApiKey;
    }

    // Placeholder methods for UI integration
    displayEnhancedOverlapResults(results) {
        this.log(`📊 Displaying ${results.length} enhanced overlap results`, 'info');
        // Call the main app's display function to show results in the UI
        if (this.app && this.app.displayEnhancedOverlapResults) {
            this.app.displayEnhancedOverlapResults(results);
        } else {
            this.log('❌ Main app display function not available', 'error');
        }
    }

    generateEnhancedVisualizations(results) {
        this.log(`🎨 Generating visualizations for ${results.length} results`, 'info');
        // This would create timeline visualizations with color coding
    }

    enableOverlapResolution() {
        this.log('🔧 Enabling overlap resolution controls', 'info');
        // This would enable UI buttons for resolving detected issues
    }

    // Configuration methods
    updateConfig(section, updates) {
        if (this.config[section]) {
            Object.assign(this.config[section], updates);
            this.log(`⚙️ Updated ${section} configuration`, 'info');
        }
    }

    getConfig() {
        return { ...this.config };
    }
}

module.exports = EnhancedOverlapDetector;
