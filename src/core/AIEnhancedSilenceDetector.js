 /**
 * AI-Enhanced Silence Detection System
 * Advanced AI-powered silence detection with confidence scoring and intelligent analysis
 */

class AIEnhancedSilenceDetector {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.analysisResults = {
            whisper: [],
            webAudio: [],
            transcript: [],
            combined: [],
            confidence: 0,
            quality: 0,
            recommendations: []
        };
        
        this.config = {
            whisper: {
                model: 'whisper-1',
                language: 'en', // Fixed: Use 'en' instead of 'auto' (OpenAI doesn't support 'auto')
                temperature: 0.0,
                confidenceThreshold: 0.7
            },
            webAudio: {
                fftSize: 4096,
                smoothingTimeConstant: 0.8,
                silenceThreshold: 0.005, // More sensitive threshold (was 0.01)
                minDuration: 0.2, // Shorter minimum duration (was 0.3)
                adaptiveThreshold: true, // Enable adaptive threshold
                backgroundNoiseCompensation: true
            },
            analysis: {
                enableConfidenceScoring: true,
                enableQualityAnalysis: true,
                enableRecommendations: true,
                minConfidenceForAutoApply: 0.8
            }
        };
        
        this.initializeAudioContext();
    }

    // ========================================
    // MAIN AI-ENHANCED DETECTION ORCHESTRATOR
    // ========================================

    async detectSilenceWithAI(audioFile, options = {}) {
        const startTime = Date.now();
        const sessionId = `ai_session_${Date.now()}`;
        
        this.app.log('🧠 Starting AI-Enhanced Silence Detection...', 'info');
        this.app.updateProgress('AI Analysis in Progress...', 10);
        this.app.updateProgress('Initializing AI engine...', 0);
        
        try {
            // Step 1: AI Transcription Analysis (Primary Method)
            this.app.updateProgress('Running Whisper AI transcription...', 20);
            const whisperResults = await this.runWhisperAnalysis(audioFile, options);
            
            // Step 2: Web Audio API Analysis (Secondary Validation)
            this.app.updateProgress('Running Web Audio analysis...', 40);
            const webAudioResults = await this.runWebAudioAnalysis(audioFile, options);
            
            // Step 3: Transcript-based Pause Detection
            this.app.updateProgress('Analyzing speech patterns...', 60);
            const transcriptResults = await this.analyzeSpeechPatterns(whisperResults.transcript);
            
            // Step 4: AI Confidence Scoring
            this.app.updateProgress('Calculating AI confidence scores...', 75);
            const confidenceAnalysis = this.calculateAIConfidence({
                whisper: whisperResults,
                webAudio: webAudioResults,
                transcript: transcriptResults
            });
            
            // Step 5: Quality Analysis
            this.app.updateProgress('Analyzing audio quality...', 85);
            const qualityAnalysis = this.analyzeAudioQuality(webAudioResults);
            
            // Step 6: Generate AI Recommendations
            this.app.updateProgress('Generating AI recommendations...', 95);
            const recommendations = this.generateAIRecommendations({
                confidence: confidenceAnalysis,
                quality: qualityAnalysis,
                results: { whisper: whisperResults, webAudio: webAudioResults, transcript: transcriptResults }
            });
            
            // Step 7: Combine and Finalize Results
            const finalResults = this.combineAIResults({
                whisper: whisperResults,
                webAudio: webAudioResults,
                transcript: transcriptResults,
                confidence: confidenceAnalysis,
                quality: qualityAnalysis,
                recommendations: recommendations
            });
            
            const duration = (Date.now() - startTime) / 1000;
            this.app.log(`✅ AI-Enhanced silence detection completed in ${duration.toFixed(2)}s`, 'success');
            this.app.log(`🧠 AI Confidence: ${(confidenceAnalysis.overall * 100).toFixed(1)}%`, 'info');
            this.app.log(`📊 Found ${finalResults.silenceSegments.length} silence segments`, 'info');
            
            return {
                success: true,
                sessionId: sessionId,
                results: finalResults,
                metadata: {
                    duration: duration,
                    methods: ['whisper', 'webAudio', 'transcript'],
                    audioFile: audioFile.name || audioFile,
                    aiConfidence: confidenceAnalysis.overall,
                    audioQuality: qualityAnalysis.overall
                }
            };
            
        } catch (error) {
            this.app.log(`❌ AI-Enhanced silence detection failed: ${error.message}`, 'error');
            this.app.updateProgress('AI Analysis Failed', 0);
            throw error;
        } finally {
            this.app.updateProgress('Analysis complete', 100);
        }
    }

    // ========================================
    // WHISPER AI ANALYSIS
    // ========================================

    async runWhisperAnalysis(audioFile, options) {
        this.app.log('🎤 Running Whisper AI transcription...', 'info');
        
        try {
            // Check if OpenAI API is available
            if (!this.app.openaiIntegration || !this.app.openaiIntegration.apiKey) {
                throw new Error('OpenAI API key not configured');
            }
            
            // Create audio blob for Whisper
            const audioBlob = await this.prepareAudioForWhisper(audioFile);
            
            // Run Whisper transcription
            const transcription = await this.app.openaiIntegration.transcribeAudio(audioBlob, {
                model: this.config.whisper.model,
                language: this.config.whisper.language,
                temperature: this.config.whisper.temperature
            });
            
            // Analyze transcription for silence patterns
            const silenceSegments = this.extractSilenceFromTranscript(transcription);
            
            return {
                transcript: transcription,
                silenceSegments: silenceSegments,
                confidence: transcription.confidence || 0.8,
                method: 'whisper'
            };
            
        } catch (error) {
            this.app.log(`⚠️ Whisper analysis failed: ${error.message}`, 'warning');
            return {
                transcript: null,
                silenceSegments: [],
                confidence: 0,
                method: 'whisper',
                error: error.message
            };
        }
    }

    // ========================================
    // WEB AUDIO API ANALYSIS
    // ========================================

    async runWebAudioAnalysis(audioFile, options) {
        this.app.log('🔊 Running Web Audio API analysis...', 'info');
        
        try {
            const audioBuffer = await this.loadAudioBuffer(audioFile);
            const analysisResults = await this.analyzeAudioBuffer(audioBuffer);
            
            return {
                silenceSegments: analysisResults.silenceSegments,
                audioLevels: analysisResults.audioLevels,
                frequencyData: analysisResults.frequencyData,
                confidence: analysisResults.confidence,
                method: 'webAudio'
            };
            
        } catch (error) {
            this.app.log(`⚠️ Web Audio analysis failed: ${error.message}`, 'warning');
            return {
                silenceSegments: [],
                audioLevels: [],
                frequencyData: [],
                confidence: 0,
                method: 'webAudio',
                error: error.message
            };
        }
    }

    // ========================================
    // SPEECH PATTERN ANALYSIS
    // ========================================

    async analyzeSpeechPatterns(transcript) {
        if (!transcript || !transcript.segments) {
            return { silenceSegments: [], confidence: 0, method: 'transcript' };
        }
        
        this.app.log('🗣️ Analyzing speech patterns...', 'info');
        
        const silenceSegments = [];
        const segments = transcript.segments || [];
        
        for (let i = 0; i < segments.length - 1; i++) {
            const currentSegment = segments[i];
            const nextSegment = segments[i + 1];
            
            const gap = nextSegment.start - currentSegment.end;
            
            // More aggressive gap detection - look for any gap > 0.2 seconds
            if (gap > 0.2) {
                const confidence = this.calculateGapConfidence(gap, currentSegment, nextSegment);
                
                silenceSegments.push({
                    start: currentSegment.end,
                    end: nextSegment.start,
                    duration: gap,
                    confidence: confidence,
                    type: gap > 1.0 ? 'speech_gap' : 'short_pause',
                    context: {
                        before: currentSegment.text,
                        after: nextSegment.text
                    }
                });
            }
        }
        
        this.app.log(`🗣️ Transcript analysis found ${silenceSegments.length} speech gaps`, 'info');
        
        return {
            silenceSegments: silenceSegments,
            confidence: this.calculateTranscriptConfidence(segments),
            method: 'transcript'
        };
    }

    // ========================================
    // AI CONFIDENCE CALCULATION
    // ========================================

    calculateAIConfidence(results) {
        const weights = {
            whisper: 0.5,
            webAudio: 0.3,
            transcript: 0.2
        };
        
        let overallConfidence = 0;
        let methodConfidences = {};
        
        // Calculate confidence for each method
        if (results.whisper && results.whisper.confidence > 0) {
            methodConfidences.whisper = results.whisper.confidence;
            overallConfidence += results.whisper.confidence * weights.whisper;
        }
        
        if (results.webAudio && results.webAudio.confidence > 0) {
            methodConfidences.webAudio = results.webAudio.confidence;
            overallConfidence += results.webAudio.confidence * weights.webAudio;
        }
        
        if (results.transcript && results.transcript.confidence > 0) {
            methodConfidences.transcript = results.transcript.confidence;
            overallConfidence += results.transcript.confidence * weights.transcript;
        }
        
        return {
            overall: Math.min(overallConfidence, 1.0),
            methods: methodConfidences,
            reliability: this.calculateReliability(methodConfidences)
        };
    }

    // ========================================
    // AUDIO QUALITY ANALYSIS
    // ========================================

    analyzeAudioQuality(webAudioResults) {
        if (!webAudioResults || !webAudioResults.audioLevels) {
            return { overall: 0.5, details: {} };
        }
        
        const levels = webAudioResults.audioLevels;
        const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
        const dynamicRange = Math.max(...levels) - Math.min(...levels);
        const noiseFloor = Math.min(...levels);
        
        // Calculate quality score (0-1)
        const levelScore = Math.min(avgLevel / -20, 1.0); // -20dB is good level
        const dynamicScore = Math.min(dynamicRange / 40, 1.0); // 40dB is good range
        const noiseScore = Math.max(0, (noiseFloor + 60) / 40); // -60dB noise floor is excellent
        
        const overallQuality = (levelScore + dynamicScore + noiseScore) / 3;
        
        return {
            overall: overallQuality,
            details: {
                averageLevel: avgLevel,
                dynamicRange: dynamicRange,
                noiseFloor: noiseFloor,
                levelScore: levelScore,
                dynamicScore: dynamicScore,
                noiseScore: noiseScore
            }
        };
    }

    // ========================================
    // AI RECOMMENDATIONS
    // ========================================

    generateAIRecommendations(analysis) {
        const recommendations = [];
        
        // Confidence-based recommendations
        if (analysis.confidence.overall > 0.9) {
            recommendations.push({
                type: 'auto_apply',
                priority: 'high',
                message: 'High confidence detection - Auto-apply recommended',
                action: 'apply_silence_cuts'
            });
        } else if (analysis.confidence.overall > 0.7) {
            recommendations.push({
                type: 'review_apply',
                priority: 'medium',
                message: 'Good confidence - Review and apply',
                action: 'review_silence_cuts'
            });
        } else {
            recommendations.push({
                type: 'manual_review',
                priority: 'high',
                message: 'Low confidence - Manual review required',
                action: 'manual_review'
            });
        }
        
        // Quality-based recommendations
        if (analysis.quality.overall < 0.3) {
            recommendations.push({
                type: 'quality_warning',
                priority: 'medium',
                message: 'Audio quality is poor - Results may be inaccurate',
                action: 'improve_audio_quality'
            });
        }
        
        // Segment-specific recommendations
        if (analysis.results.whisper.silenceSegments.length > 10) {
            recommendations.push({
                type: 'segment_count',
                priority: 'low',
                message: 'Many silence segments detected - Consider batch processing',
                action: 'batch_process'
            });
        }
        
        return recommendations;
    }

    // ========================================
    // RESULT COMBINATION
    // ========================================

    combineAIResults(results) {
        const allSegments = [];
        
        this.app.log('🔄 Combining results from all AI methods...', 'info');
        
        // Combine segments from all methods with detailed logging
        if (results.whisper.silenceSegments) {
            const whisperSegments = results.whisper.silenceSegments.map(s => ({ ...s, source: 'whisper' }));
            allSegments.push(...whisperSegments);
            this.app.log(`   🎤 Whisper: ${whisperSegments.length} segments`, 'info');
        }
        
        if (results.webAudio.silenceSegments) {
            const webAudioSegments = results.webAudio.silenceSegments.map(s => ({ ...s, source: 'webAudio' }));
            allSegments.push(...webAudioSegments);
            this.app.log(`   🔊 Web Audio: ${webAudioSegments.length} segments`, 'info');
        }
        
        if (results.transcript.silenceSegments) {
            const transcriptSegments = results.transcript.silenceSegments.map(s => ({ ...s, source: 'transcript' }));
            allSegments.push(...transcriptSegments);
            this.app.log(`   🗣️ Transcript: ${transcriptSegments.length} segments`, 'info');
        }
        
        this.app.log(`🔄 Total segments before merging: ${allSegments.length}`, 'info');
        
        // If no segments found from any method, this is unusual - log for debugging
        if (allSegments.length === 0) {
            this.app.log('⚠️ WARNING: No silence segments found from any detection method!', 'warning');
            this.app.log('🔍 This could indicate:', 'info');
            this.app.log('   - Audio has very little actual silence', 'info');
            this.app.log('   - Thresholds may be too strict', 'info');
            this.app.log('   - Audio analysis failed', 'info');
        }
        
        // Merge overlapping segments
        const mergedSegments = this.mergeOverlappingSegments(allSegments);
        this.app.log(`🔄 Segments after merging: ${mergedSegments.length}`, 'info');
        
        // Calculate final confidence for each segment
        const finalSegments = mergedSegments.map(segment => ({
            ...segment,
            finalConfidence: this.calculateSegmentConfidence(segment, results),
            aiRecommendation: this.getSegmentRecommendation(segment, results)
        }));
        
        return {
            silenceSegments: finalSegments,
            confidence: results.confidence,
            quality: results.quality,
            recommendations: results.recommendations,
            // FIXED: Preserve audioLevels from Web Audio analysis for waveform visualization
            audioLevels: results.webAudio.audioLevels || [],
            frequencyData: results.webAudio.frequencyData || {},
            adaptiveThreshold: results.webAudio.adaptiveThreshold,
            statistics: results.webAudio.statistics || {},
            metadata: {
                totalSegments: finalSegments.length,
                totalSilenceTime: finalSegments.reduce((sum, s) => sum + s.duration, 0),
                averageConfidence: finalSegments.length > 0 ? finalSegments.reduce((sum, s) => sum + s.finalConfidence, 0) / finalSegments.length : 0,
                methods: ['whisper', 'webAudio', 'transcript'],
                methodResults: {
                    whisper: results.whisper.silenceSegments ? results.whisper.silenceSegments.length : 0,
                    webAudio: results.webAudio.silenceSegments ? results.webAudio.silenceSegments.length : 0,
                    transcript: results.transcript.silenceSegments ? results.transcript.silenceSegments.length : 0
                }
            }
        };
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.app.log('⚠️ Web Audio API not supported', 'warning');
        }
    }

    async loadAudioBuffer(audioFile) {
        if (!this.audioContext) {
            throw new Error('Audio context not available');
        }
        
        const arrayBuffer = await audioFile.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }

    async analyzeAudioBuffer(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        
        this.app.log(`🎵 Analyzing audio buffer: ${duration.toFixed(1)}s, ${sampleRate}Hz, ${channelData.length} samples`, 'info');
        
        // Analyze audio levels with enhanced detection
        const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows for better precision
        const hopSize = Math.floor(windowSize / 2); // 50% overlap
        const audioLevels = [];
        const rmsValues = [];
        const silenceSegments = [];
        
        // First pass: Calculate RMS values for adaptive threshold
        this.app.log('🔍 First pass: Calculating RMS energy levels...', 'info');
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const window = channelData.slice(i, i + windowSize);
            const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
            const db = 20 * Math.log10(rms + 1e-10);
            
            audioLevels.push({ time: i / sampleRate, rms: rms, db: db });
            rmsValues.push(rms);
        }
        
        // Calculate adaptive threshold with improved sensitivity
        let silenceThreshold = this.config.webAudio.silenceThreshold;
        if (this.config.webAudio.adaptiveThreshold) {
            // Calculate statistics for adaptive threshold
            rmsValues.sort((a, b) => a - b);
            const median = rmsValues[Math.floor(rmsValues.length / 2)];
            const percentile10 = rmsValues[Math.floor(rmsValues.length * 0.1)];
            const percentile25 = rmsValues[Math.floor(rmsValues.length * 0.25)];
            const percentile5 = rmsValues[Math.floor(rmsValues.length * 0.05)];
            
            // Use more aggressive adaptive threshold - choose the MINIMUM of multiple methods
            const adaptiveThreshold1 = percentile10 * 0.3; // 10th percentile * 30%
            const adaptiveThreshold2 = percentile5 * 0.5;  // 5th percentile * 50%
            const adaptiveThreshold3 = median * 0.15;      // Median * 15%
            
            // Choose the most sensitive (lowest) threshold, but ensure it's reasonable
            const candidateThreshold = Math.min(adaptiveThreshold1, adaptiveThreshold2, adaptiveThreshold3);
            silenceThreshold = Math.max(candidateThreshold, this.config.webAudio.silenceThreshold * 0.5); // Allow going lower than base
            
            this.app.log(`🎯 ENHANCED Adaptive threshold: ${silenceThreshold.toFixed(6)}`, 'info');
            this.app.log(`   📊 Statistics: median=${median.toFixed(6)}, 10th=${percentile10.toFixed(6)}, 5th=${percentile5.toFixed(6)}`, 'info');
            this.app.log(`   🔍 Candidates: method1=${adaptiveThreshold1.toFixed(6)}, method2=${adaptiveThreshold2.toFixed(6)}, method3=${adaptiveThreshold3.toFixed(6)}`, 'info');
            this.app.log(`   ✅ Selected: ${silenceThreshold.toFixed(6)} (vs base: ${this.config.webAudio.silenceThreshold})`, 'info');
        } else {
            this.app.log(`🎯 Fixed threshold: ${silenceThreshold.toFixed(6)}`, 'info');
        }
        
        // Second pass: Detect silence segments
        this.app.log('🔍 Second pass: Detecting silence segments...', 'info');
        let currentSilenceStart = null;
        let silentWindows = 0;
        let totalWindows = 0;
        
        for (let i = 0; i < audioLevels.length; i++) {
            const level = audioLevels[i];
            const isSilent = level.rms < silenceThreshold;
            
            totalWindows++;
            if (isSilent) silentWindows++;
            
            if (isSilent && currentSilenceStart === null) {
                currentSilenceStart = level.time;
            } else if (!isSilent && currentSilenceStart !== null) {
                const silenceDuration = level.time - currentSilenceStart;
                if (silenceDuration >= this.config.webAudio.minDuration) {
                    silenceSegments.push({
                        start: currentSilenceStart,
                        end: level.time,
                        duration: silenceDuration,
                        confidence: this.calculateWebAudioConfidence(level.rms, silenceDuration),
                        type: 'webAudio',
                        threshold: silenceThreshold,
                        averageLevel: level.rms
                    });
                }
                currentSilenceStart = null;
            }
        }
        
        // Handle silence at the end
        if (currentSilenceStart !== null) {
            const silenceDuration = duration - currentSilenceStart;
            if (silenceDuration >= this.config.webAudio.minDuration) {
                silenceSegments.push({
                    start: currentSilenceStart,
                    end: duration,
                    duration: silenceDuration,
                    confidence: this.calculateWebAudioConfidence(silenceThreshold, silenceDuration),
                    type: 'webAudio',
                    threshold: silenceThreshold,
                    averageLevel: silenceThreshold
                });
            }
        }
        
        const silencePercentage = (silentWindows / totalWindows * 100).toFixed(1);
        this.app.log(`📊 Web Audio analysis complete: ${silenceSegments.length} segments, ${silencePercentage}% silence`, 'info');
        
        // If no segments found with adaptive threshold, try relative quiet detection
        if (silenceSegments.length === 0) {
            this.app.log(`🔍 No absolute silence found, trying relative quiet detection...`, 'info');
            const relativeQuietSegments = this.detectRelativeQuietPeriods(audioLevels, duration);
            silenceSegments.push(...relativeQuietSegments);
            this.app.log(`📊 Relative quiet detection found ${relativeQuietSegments.length} additional segments`, 'info');
        }
        
        // Log details of found segments
        silenceSegments.forEach((segment, index) => {
            this.app.log(`   🔇 Segment ${index + 1}: ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s (${segment.duration.toFixed(2)}s) [${segment.type || 'silence'}]`, 'info');
        });
        
        return {
            silenceSegments: silenceSegments,
            audioLevels: audioLevels,
            frequencyData: this.analyzeFrequencyData(channelData, sampleRate),
            confidence: this.calculateWebAudioConfidence(audioLevels),
            adaptiveThreshold: silenceThreshold,
            statistics: {
                totalWindows: totalWindows,
                silentWindows: silentWindows,
                silencePercentage: parseFloat(silencePercentage)
            }
        };
    }

    calculateWebAudioConfidence(levels, duration = null) {
        if (Array.isArray(levels)) {
            const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
            return Math.max(0, Math.min(1, (avgLevel + 60) / 40)); // -60dB to -20dB range
        }
        
        if (duration) {
            const durationScore = Math.min(duration / 2, 1); // Longer silence = higher confidence
            const levelScore = Math.max(0, Math.min(1, (levels + 60) / 40));
            return (durationScore + levelScore) / 2;
        }
        
        return 0.5;
    }
    
    // Detect relative quiet periods when no absolute silence is found
    detectRelativeQuietPeriods(audioLevels, duration) {
        if (!audioLevels || audioLevels.length === 0) return [];
        
        this.app.log('🔍 Analyzing relative quiet periods...', 'info');
        
        // Calculate moving average to smooth out short variations
        const windowSize = 10; // 10 samples for moving average
        const smoothedLevels = [];
        
        for (let i = 0; i < audioLevels.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(audioLevels.length, i + Math.floor(windowSize / 2));
            const window = audioLevels.slice(start, end);
            const avgRms = window.reduce((sum, level) => sum + level.rms, 0) / window.length;
            
            smoothedLevels.push({
                time: audioLevels[i].time,
                rms: avgRms,
                originalRms: audioLevels[i].rms
            });
        }
        
        // Find the quietest 20% of the audio as potential "quiet" periods
        const sortedByRms = [...smoothedLevels].sort((a, b) => a.rms - b.rms);
        const quietestThreshold = sortedByRms[Math.floor(sortedByRms.length * 0.2)].rms;
        
        this.app.log(`🔍 Relative quiet threshold: ${quietestThreshold.toFixed(6)} (20th percentile of smoothed levels)`, 'info');
        
        // Find continuous quiet periods
        const quietSegments = [];
        let currentQuietStart = null;
        
        for (let i = 0; i < smoothedLevels.length; i++) {
            const level = smoothedLevels[i];
            const isQuiet = level.rms <= quietestThreshold;
            
            if (isQuiet && currentQuietStart === null) {
                currentQuietStart = level.time;
            } else if (!isQuiet && currentQuietStart !== null) {
                const quietDuration = level.time - currentQuietStart;
                if (quietDuration >= this.config.webAudio.minDuration) {
                    quietSegments.push({
                        start: currentQuietStart,
                        end: level.time,
                        duration: quietDuration,
                        confidence: 0.6, // Lower confidence for relative quiet
                        type: 'relative_quiet',
                        threshold: quietestThreshold,
                        averageLevel: quietestThreshold
                    });
                }
                currentQuietStart = null;
            }
        }
        
        // Handle quiet period at the end
        if (currentQuietStart !== null) {
            const quietDuration = duration - currentQuietStart;
            if (quietDuration >= this.config.webAudio.minDuration) {
                quietSegments.push({
                    start: currentQuietStart,
                    end: duration,
                    duration: quietDuration,
                    confidence: 0.6,
                    type: 'relative_quiet',
                    threshold: quietestThreshold,
                    averageLevel: quietestThreshold
                });
            }
        }
        
        this.app.log(`🔍 Found ${quietSegments.length} relative quiet periods`, 'info');
        return quietSegments;
    }

    calculateGapConfidence(gap, beforeSegment, afterSegment) {
        let confidence = 0.5;
        
        // Longer gaps are more likely to be silence
        if (gap > 2) confidence += 0.3;
        else if (gap > 1) confidence += 0.2;
        else if (gap > 0.5) confidence += 0.1;
        
        // Check for sentence boundaries
        if (beforeSegment.text && afterSegment.text) {
            const beforeEnds = /[.!?]$/.test(beforeSegment.text.trim());
            const afterStarts = /^[A-Z]/.test(afterSegment.text.trim());
            if (beforeEnds && afterStarts) confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }

    calculateTranscriptConfidence(segments) {
        if (!segments || segments.length === 0) return 0;
        
        const avgConfidence = segments.reduce((sum, seg) => sum + (seg.confidence || 0.8), 0) / segments.length;
        return Math.min(avgConfidence, 1.0);
    }

    calculateReliability(methodConfidences) {
        const methods = Object.keys(methodConfidences);
        if (methods.length === 0) return 0;
        
        const avgConfidence = methods.reduce((sum, method) => sum + methodConfidences[method], 0) / methods.length;
        const variance = methods.reduce((sum, method) => sum + Math.pow(methodConfidences[method] - avgConfidence, 2), 0) / methods.length;
        
        return Math.max(0, 1 - Math.sqrt(variance));
    }

    mergeOverlappingSegments(segments) {
        if (segments.length === 0) return [];
        
        // Sort by start time
        const sorted = segments.sort((a, b) => a.start - b.start);
        const merged = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            
            if (current.start <= last.end) {
                // Overlapping segments - merge them
                last.end = Math.max(last.end, current.end);
                last.duration = last.end - last.start;
                last.sources = last.sources ? [...last.sources, current.source] : [last.source, current.source];
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    calculateSegmentConfidence(segment, results) {
        const sources = segment.sources || [segment.source];
        let totalConfidence = 0;
        let count = 0;
        
        sources.forEach(source => {
            if (results[source] && results[source].confidence) {
                totalConfidence += results[source].confidence;
                count++;
            }
        });
        
        return count > 0 ? totalConfidence / count : segment.confidence || 0.5;
    }

    getSegmentRecommendation(segment, results) {
        if (segment.finalConfidence > 0.9) {
            return 'auto_apply';
        } else if (segment.finalConfidence > 0.7) {
            return 'review_apply';
        } else {
            return 'manual_review';
        }
    }

    analyzeFrequencyData(channelData, sampleRate) {
        // Simple frequency analysis - could be enhanced with FFT
        const windowSize = Math.floor(sampleRate * 0.1);
        const frequencyData = [];
        
        for (let i = 0; i < channelData.length; i += windowSize) {
            const window = channelData.slice(i, i + windowSize);
            const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
            frequencyData.push(rms);
        }
        
        return frequencyData;
    }

    async prepareAudioForWhisper(audioFile) {
        // Convert audio file to format suitable for Whisper API
        if (audioFile instanceof Blob) {
            return audioFile;
        }
        
        // If it's a file path, we need to load it
        const response = await fetch(audioFile);
        return await response.blob();
    }

    extractSilenceFromTranscript(transcription) {
        if (!transcription || !transcription.segments) {
            return [];
        }
        
        const silenceSegments = [];
        const segments = transcription.segments;
        
        for (let i = 0; i < segments.length - 1; i++) {
            const current = segments[i];
            const next = segments[i + 1];
            const gap = next.start - current.end;
            
            if (gap > 0.3) { // Minimum 0.3 second gap
                silenceSegments.push({
                    start: current.end,
                    end: next.start,
                    duration: gap,
                    confidence: transcription.confidence || 0.8,
                    type: 'whisper_gap',
                    context: {
                        before: current.text,
                        after: next.text
                    }
                });
            }
        }
        
        return silenceSegments;
    }

    // ========================================
    // ENHANCED UI DISPLAY FUNCTIONS
    // ========================================

    displayAIEnhancedResults(results, audioPath = null) {
        this.app.log('🎨 Displaying AI-Enhanced silence detection results...', 'info');
        
        const resultsContainer = document.getElementById('silenceResults');
        if (!resultsContainer) {
            this.app.log('❌ silenceResults container not found', 'error');
            return;
        }
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (!results || !results.silenceSegments || results.silenceSegments.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-volume-up"></i>
                    <p>No silence segments detected</p>
                    <span class="empty-state-subtitle">Your audio appears to have continuous content</span>
                </div>
            `;
            return;
        }
        
        const segments = results.silenceSegments;
        const metadata = results.metadata || {};
        const confidence = metadata.aiConfidence || 0;
        
        // Create enhanced results display
        let resultsHTML = `
            <div class="ai-enhanced-results">
                <div class="ai-results-header">
                    <h4><i class="fas fa-robot"></i> AI-Enhanced Silence Detection Results</h4>
                    <div class="ai-badges">
                        <span class="ai-badge">🤖 AI-Powered</span>
                        <span class="confidence-badge">Confidence: ${(confidence * 100).toFixed(1)}%</span>
                        <span class="segments-badge">${segments.length} segments found</span>
                    </div>
                </div>
                
                <div class="audio-visualization">
                    <h5><i class="fas fa-chart-line"></i> Audio Waveform & Silence Map</h5>
                    <div class="waveform-container">
                        <canvas id="silenceWaveform" width="800" height="200"></canvas>
                    </div>
                </div>
                
                <div class="silence-segments-list">
                    <h5><i class="fas fa-list"></i> Detected Silence Segments</h5>
                    ${segments.map((segment, index) => `
                        <div class="silence-segment-item" data-index="${index}">
                            <div class="segment-header">
                                <div class="segment-info">
                                    <span class="segment-number">#${index + 1}</span>
                                    <span class="segment-time">${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}</span>
                                    <span class="segment-duration">${segment.duration.toFixed(2)}s</span>
                                </div>
                                <div class="segment-confidence">
                                    <span class="confidence-bar" style="width: ${(segment.confidence * 100)}%"></span>
                                    <span class="confidence-text">${(segment.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <div class="segment-actions">
                                <button class="segment-btn play-btn" onclick="window.audioToolsPro.seekToTime(${segment.start})">
                                    <i class="fas fa-play"></i> Play
                                </button>
                                <button class="segment-btn trim-btn" onclick="window.audioToolsPro.trimSilenceSegment(${index})">
                                    <i class="fas fa-cut"></i> Trim
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="bulk-actions">
                    <button class="action-btn primary" onclick="window.audioToolsPro.resolveAllSilence()">
                        <i class="fas fa-magic"></i> Resolve All Silence
                    </button>
                    <button class="action-btn secondary" onclick="window.audioToolsPro.downloadTrimmedAudio()">
                        <i class="fas fa-download"></i> Download Trimmed Audio
                    </button>
                    <button class="action-btn secondary" onclick="window.audioToolsPro.previewTrimmedAudio()">
                        <i class="fas fa-headphones"></i> Preview Result
                    </button>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
        
        // Draw waveform with silence visualization
        setTimeout(() => {
            this.drawSilenceWaveform(segments, results.audioLevels || [], audioPath);
        }, 100);
        
        // Store results for resolve functions
        this.app.lastSilenceResults = segments;
        
        this.app.log(`✅ AI-Enhanced results displayed: ${segments.length} segments`, 'success');
    }
    
    drawSilenceWaveform(silenceSegments, audioLevels, audioPath) {
        const canvas = document.getElementById('silenceWaveform');
        if (!canvas) {
            this.app.log('❌ Canvas element #silenceWaveform not found', 'error');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        this.app.log(`🎨 Drawing waveform: ${width}x${height}, audioLevels: ${audioLevels ? audioLevels.length : 0} samples`, 'info');
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw audio waveform if available
        if (audioLevels && audioLevels.length > 0) {
            this.app.log(`🎨 Drawing real waveform with ${audioLevels.length} data points`, 'info');
            const maxTime = Math.max(...audioLevels.map(level => level.time || 0));
            const maxDb = Math.max(...audioLevels.map(level => level.db || -60));
            const minDb = Math.min(...audioLevels.map(level => level.db || -60));
            
            // Draw waveform
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            audioLevels.forEach((level, index) => {
                const x = (level.time / maxTime) * width;
                const normalizedDb = (level.db - minDb) / (maxDb - minDb);
                const y = height - (normalizedDb * height * 0.8) - height * 0.1;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw silence regions
            ctx.fillStyle = 'rgba(255, 87, 87, 0.3)';
            silenceSegments.forEach(segment => {
                const startX = (segment.start / maxTime) * width;
                const endX = (segment.end / maxTime) * width;
                ctx.fillRect(startX, 0, endX - startX, height);
            });
            
            // Draw silence segment labels
            ctx.fillStyle = '#FF5757';
            ctx.font = '12px Arial';
            silenceSegments.forEach((segment, index) => {
                const startX = (segment.start / maxTime) * width;
                ctx.fillText(`S${index + 1}`, startX + 5, 20);
            });
            
        } else {
            // Enhanced fallback visualization with silence segment timeline
            this.app.log(`🎨 No audio level data available, drawing fallback visualization`, 'warning');
            
            // Draw timeline background
            ctx.fillStyle = '#333';
            ctx.fillRect(0, height * 0.4, width, height * 0.2);
            
            // If we have silence segments, show them on timeline
            if (silenceSegments && silenceSegments.length > 0) {
                // Estimate total duration from segments
                const maxTime = Math.max(...silenceSegments.map(s => s.end || s.start + s.duration));
                
                ctx.fillStyle = 'rgba(255, 87, 87, 0.6)';
                silenceSegments.forEach((segment, index) => {
                    const startX = (segment.start / maxTime) * width;
                    const endX = (segment.end / maxTime) * width;
                    ctx.fillRect(startX, height * 0.3, endX - startX, height * 0.4);
                    
                    // Add segment labels
                    ctx.fillStyle = '#FF5757';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`S${index + 1}`, startX + 2, height * 0.25);
                    ctx.fillStyle = 'rgba(255, 87, 87, 0.6)';
                });
                
                // Add title
                ctx.fillStyle = '#4CAF50';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${silenceSegments.length} Silence Segments Found`, width / 2, height * 0.15);
                
                ctx.fillStyle = '#ccc';
                ctx.font = '10px Arial';
                ctx.fillText('Audio level data not available for detailed waveform', width / 2, height * 0.85);
            } else {
                // No segments found
                ctx.fillStyle = '#FF5757';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No audio level data available for waveform', width / 2, height / 2);
            }
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEnhancedSilenceDetector;
} else if (typeof window !== 'undefined') {
    window.AIEnhancedSilenceDetector = AIEnhancedSilenceDetector;
    console.log('🧠 AIEnhancedSilenceDetector loaded and available globally');
}
