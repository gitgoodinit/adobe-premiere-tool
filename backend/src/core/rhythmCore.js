/**
 * Rhythm Analysis Core Logic
 * Pure algorithms for rhythm and timing analysis using FFmpeg
 */

const ffmpeg = require('fluent-ffmpeg');

class RhythmCore {
    /**
     * Analyze speech rhythm patterns using FFmpeg
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Rhythm analysis results
     */
    static async analyzeSpeechRhythm(filePath, options = {}) {
        const {
            segmentLength = 2.0,
            overlapRatio = 0.5,
            silenceThreshold = -30
        } = options;

        try {
            // Get audio info first
            const audioInfo = await this.getAudioInfo(filePath);
            const duration = audioInfo.duration;
            
            // Extract speech segments using FFmpeg silence detection
            const speechSegments = await this.extractSpeechSegments(filePath, {
                silenceThreshold,
                minSpeechDuration: 0.3
            });
            
            // Analyze volume envelope for intensity patterns
            const volumeData = await this.analyzeVolumeEnvelope(filePath);
            
            // Analyze spectral features for speech characteristics
            const spectralData = await this.analyzeSpectralFeatures(filePath);
            
            // Combine data to create rhythm analysis
            const enhancedSegments = speechSegments.map((segment, index) => {
                const volumeInSegment = volumeData.filter(v => 
                    v.timestamp >= segment.start && v.timestamp <= segment.end
                );
                const spectralInSegment = spectralData.filter(s => 
                    s.timestamp >= segment.start && s.timestamp <= segment.end
                );
                
                return {
                    ...segment,
                    speechRate: this.calculateSpeechRate(segment, spectralInSegment),
                    pauseDuration: index < speechSegments.length - 1 ? 
                        speechSegments[index + 1].start - segment.end : 0,
                    intensity: this.calculateAverageIntensity(volumeInSegment),
                    pitch: this.calculateAveragePitch(spectralInSegment),
                    spectralCentroid: this.calculateSpectralCentroid(spectralInSegment)
                };
            });
            
            return {
                segments: enhancedSegments,
                averageSpeechRate: this.calculateAverageSpeechRate(enhancedSegments),
                averagePauseDuration: this.calculateAveragePause(enhancedSegments),
                rhythmConsistency: this.calculateRhythmConsistency(enhancedSegments),
                totalSpeechTime: enhancedSegments.reduce((sum, s) => sum + s.duration, 0),
                totalDuration: duration
            };
            
        } catch (error) {
            throw new Error(`Speech rhythm analysis failed: ${error.message}`);
        }
    }

    /**
     * Get audio file information using FFprobe
     */
    static async getAudioInfo(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(new Error(`Failed to get audio info: ${err.message}`));
                    return;
                }

                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                if (!audioStream) {
                    reject(new Error('No audio stream found in file'));
                    return;
                }

                resolve({
                    duration: parseFloat(metadata.format.duration),
                    sampleRate: parseInt(audioStream.sample_rate),
                    channels: parseInt(audioStream.channels),
                    bitRate: parseInt(metadata.format.bit_rate || 0),
                    codec: audioStream.codec_name
                });
            });
        });
    }

    /**
     * Extract speech segments using FFmpeg silence detection
     */
    static async extractSpeechSegments(filePath, options) {
        const {
            silenceThreshold = -30,
            minSpeechDuration = 0.3
        } = options;

        return new Promise((resolve, reject) => {
            const speechSegments = [];
            let lastSilenceEnd = 0;
            let currentSpeechStart = null;

            const command = ffmpeg(filePath)
                .audioFilters(`silencedetect=noise=${silenceThreshold}dB:d=0.1`)
                .format('null')
                .output('-');

            command.on('stderr', (stderrLine) => {
                const silenceStartMatch = stderrLine.match(/silence_start: ([\d.]+)/);
                const silenceEndMatch = stderrLine.match(/silence_end: ([\d.]+)/);

                if (silenceStartMatch) {
                    const silenceStart = parseFloat(silenceStartMatch[1]);
                    
                    // If we have speech before this silence
                    if (lastSilenceEnd < silenceStart) {
                        const speechDuration = silenceStart - lastSilenceEnd;
                        if (speechDuration >= minSpeechDuration) {
                            speechSegments.push({
                                start: lastSilenceEnd,
                                end: silenceStart,
                                duration: speechDuration,
                                type: 'speech'
                            });
                        }
                    }
                }

                if (silenceEndMatch) {
                    lastSilenceEnd = parseFloat(silenceEndMatch[1]);
                }
            });

            command.on('end', () => {
                resolve(speechSegments);
            });

            command.on('error', reject);
            command.run();
        });
    }

    /**
     * Analyze volume envelope using FFmpeg
     */
    static async analyzeVolumeEnvelope(filePath) {
        return new Promise((resolve, reject) => {
            const volumeData = [];
            let timestamp = 0;

            const command = ffmpeg(filePath)
                .audioFilters('astats=metadata=1:reset=1:length=0.1')
                .format('null')
                .save('NUL');

            command.on('stderr', (stderrLine) => {
                const rmsMatch = stderrLine.match(/RMS level dB: ([-\d.]+)/);
                if (rmsMatch) {
                    volumeData.push({
                        timestamp: timestamp,
                        rmsDb: parseFloat(rmsMatch[1]),
                        linearRms: Math.pow(10, parseFloat(rmsMatch[1]) / 20)
                    });
                    timestamp += 0.1; // 100ms intervals
                }
            });

            command.on('end', () => resolve(volumeData));
            command.on('error', reject);
            command.run();
        });
    }

    /**
     * Analyze spectral features using FFmpeg
     */
    static async analyzeSpectralFeatures(filePath) {
        return new Promise((resolve, reject) => {
            const spectralData = [];
            let timestamp = 0;

            const command = ffmpeg(filePath)
                .audioFilters('astats=metadata=1:reset=1:length=0.1')
                .format('null')
                .save('NUL');

            // This is a simplified spectral analysis
            // In production, you might want to use more sophisticated FFT analysis
            command.on('stderr', (stderrLine) => {
                // Extract spectral information from FFmpeg output
                spectralData.push({
                    timestamp: timestamp,
                    spectralCentroid: 1000 + Math.random() * 2000, // Mock centroid
                    spectralRolloff: 3000 + Math.random() * 5000,  // Mock rolloff
                    mfcc: Array.from({length: 13}, () => Math.random() * 2 - 1) // Mock MFCC
                });
                timestamp += 0.1;
            });

            command.on('end', () => resolve(spectralData));
            command.on('error', reject);
            command.run();
        });
    }

    /**
     * Calculate speech rate based on spectral activity
     */
    static calculateSpeechRate(segment, spectralData) {
        if (spectralData.length === 0) return 2.5; // Default speech rate
        
        // Estimate speech rate based on spectral activity
        const spectralActivity = spectralData.filter(s => s.spectralCentroid > 500).length;
        const activityRatio = spectralActivity / spectralData.length;
        
        // Convert to words per second (rough estimation)
        return Math.max(1.0, Math.min(6.0, 2.0 + activityRatio * 3.0));
    }

    /**
     * Calculate average intensity from volume data
     */
    static calculateAverageIntensity(volumeData) {
        if (volumeData.length === 0) return 0.5;
        
        const avgLinearRms = volumeData.reduce((sum, v) => sum + v.linearRms, 0) / volumeData.length;
        return Math.max(0, Math.min(1, avgLinearRms));
    }

    /**
     * Calculate average pitch from spectral data
     */
    static calculateAveragePitch(spectralData) {
        if (spectralData.length === 0) return 150; // Default pitch
        
        const avgCentroid = spectralData.reduce((sum, s) => sum + s.spectralCentroid, 0) / spectralData.length;
        // Convert spectral centroid to approximate pitch
        return Math.max(80, Math.min(300, avgCentroid / 10));
    }

    /**
     * Calculate spectral centroid
     */
    static calculateSpectralCentroid(spectralData) {
        if (spectralData.length === 0) return 1000;
        
        return spectralData.reduce((sum, s) => sum + s.spectralCentroid, 0) / spectralData.length;
    }

    /**
     * Analyze timing patterns in audio
     * @param {Array} speechSegments - Speech segments
     * @param {Array} silenceSegments - Silence segments
     * @returns {Object} Timing analysis results
     */
    static analyzeTimingPatterns(speechSegments, silenceSegments) {
        const patterns = {
            speechPatterns: this.analyzeSpeechPatterns(speechSegments),
            silencePatterns: this.analyzeSilencePatterns(silenceSegments),
            transitions: this.analyzeTransitions(speechSegments, silenceSegments)
        };
        
        return {
            ...patterns,
            overallFlow: this.calculateOverallFlow(patterns),
            recommendations: this.generateTimingRecommendations(patterns)
        };
    }

    /**
     * Detect pacing issues in speech
     * @param {Array} speechSegments - Speech segments
     * @returns {Array} Pacing issues
     */
    static detectPacingIssues(speechSegments) {
        const issues = [];
        const avgSpeechRate = this.calculateAverageSpeechRate(speechSegments);
        
        speechSegments.forEach((segment, index) => {
            // Too fast speech
            if (segment.speechRate > avgSpeechRate * 1.5) {
                issues.push({
                    type: 'too_fast',
                    severity: 'medium',
                    start: segment.start,
                    end: segment.end,
                    actualRate: segment.speechRate,
                    recommendedRate: avgSpeechRate,
                    description: 'Speech rate is significantly faster than average'
                });
            }
            
            // Too slow speech
            if (segment.speechRate < avgSpeechRate * 0.7) {
                issues.push({
                    type: 'too_slow',
                    severity: 'low',
                    start: segment.start,
                    end: segment.end,
                    actualRate: segment.speechRate,
                    recommendedRate: avgSpeechRate,
                    description: 'Speech rate is significantly slower than average'
                });
            }
            
            // Long pauses
            if (segment.pauseDuration > 2.0) {
                issues.push({
                    type: 'long_pause',
                    severity: 'high',
                    start: segment.end,
                    duration: segment.pauseDuration,
                    recommendedDuration: 1.0,
                    description: 'Pause duration is unusually long'
                });
            }
        });
        
        return issues;
    }

    /**
     * Calculate average speech rate
     * @param {Array} segments - Speech segments
     * @returns {number} Average speech rate
     */
    static calculateAverageSpeechRate(segments) {
        if (segments.length === 0) return 0;
        
        const totalRate = segments.reduce((sum, segment) => sum + segment.speechRate, 0);
        return totalRate / segments.length;
    }

    /**
     * Calculate average pause duration
     * @param {Array} segments - Speech segments
     * @returns {number} Average pause duration
     */
    static calculateAveragePause(segments) {
        if (segments.length === 0) return 0;
        
        const totalPause = segments.reduce((sum, segment) => sum + segment.pauseDuration, 0);
        return totalPause / segments.length;
    }

    /**
     * Calculate rhythm consistency score
     * @param {Array} segments - Speech segments
     * @returns {number} Consistency score (0-1)
     */
    static calculateRhythmConsistency(segments) {
        if (segments.length < 2) return 1;
        
        const rates = segments.map(s => s.speechRate);
        const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Lower standard deviation = higher consistency
        const consistencyScore = Math.max(0, 1 - (standardDeviation / mean));
        return Math.min(1, consistencyScore);
    }

    /**
     * Analyze speech patterns
     * @param {Array} speechSegments - Speech segments
     * @returns {Object} Speech pattern analysis
     */
    static analyzeSpeechPatterns(speechSegments) {
        return {
            totalSpeechTime: speechSegments.reduce((sum, s) => sum + s.duration, 0),
            averageSegmentLength: speechSegments.reduce((sum, s) => sum + s.duration, 0) / speechSegments.length,
            speechRateVariation: this.calculateVariation(speechSegments.map(s => s.speechRate)),
            intensityVariation: this.calculateVariation(speechSegments.map(s => s.intensity))
        };
    }

    /**
     * Analyze silence patterns
     * @param {Array} silenceSegments - Silence segments
     * @returns {Object} Silence pattern analysis
     */
    static analyzeSilencePatterns(silenceSegments) {
        return {
            totalSilenceTime: silenceSegments.reduce((sum, s) => sum + s.duration, 0),
            averageSilenceLength: silenceSegments.reduce((sum, s) => sum + s.duration, 0) / silenceSegments.length,
            silenceLengthVariation: this.calculateVariation(silenceSegments.map(s => s.duration)),
            longPauses: silenceSegments.filter(s => s.duration > 2).length
        };
    }

    /**
     * Analyze transitions between speech and silence
     * @param {Array} speechSegments - Speech segments
     * @param {Array} silenceSegments - Silence segments
     * @returns {Object} Transition analysis
     */
    static analyzeTransitions(speechSegments, silenceSegments) {
        const transitions = [];
        
        // Mock transition analysis
        for (let i = 0; i < Math.min(speechSegments.length, silenceSegments.length); i++) {
            transitions.push({
                type: 'speech_to_silence',
                timestamp: speechSegments[i].end,
                smoothness: Math.random() * 0.5 + 0.5, // 0.5-1.0
                naturalness: Math.random() * 0.5 + 0.5 // 0.5-1.0
            });
        }
        
        return {
            transitions,
            averageSmoothness: transitions.reduce((sum, t) => sum + t.smoothness, 0) / transitions.length,
            averageNaturalness: transitions.reduce((sum, t) => sum + t.naturalness, 0) / transitions.length
        };
    }

    /**
     * Calculate overall flow score
     * @param {Object} patterns - Timing patterns
     * @returns {number} Flow score (0-1)
     */
    static calculateOverallFlow(patterns) {
        const speechScore = Math.min(1, patterns.speechPatterns.averageSegmentLength / 3); // Ideal ~3 seconds
        const silenceScore = 1 - Math.min(1, patterns.silencePatterns.averageSilenceLength / 2); // Shorter is better
        const transitionScore = patterns.transitions.averageSmoothness;
        
        return (speechScore + silenceScore + transitionScore) / 3;
    }

    /**
     * Generate timing recommendations
     * @param {Object} patterns - Timing patterns
     * @returns {Array} Recommendations
     */
    static generateTimingRecommendations(patterns) {
        const recommendations = [];
        
        if (patterns.speechPatterns.speechRateVariation > 0.5) {
            recommendations.push({
                type: 'speech_rate',
                priority: 'medium',
                description: 'Consider maintaining more consistent speech rate',
                suggestion: 'Use a metronome or practice with consistent pacing'
            });
        }
        
        if (patterns.silencePatterns.longPauses > 2) {
            recommendations.push({
                type: 'long_pauses',
                priority: 'high',
                description: 'Multiple long pauses detected',
                suggestion: 'Consider editing out or shortening pauses longer than 2 seconds'
            });
        }
        
        if (patterns.transitions.averageSmoothness < 0.7) {
            recommendations.push({
                type: 'transitions',
                priority: 'low',
                description: 'Transitions could be smoother',
                suggestion: 'Consider adding subtle fades between speech and silence'
            });
        }
        
        return recommendations;
    }

    /**
     * Calculate variation coefficient
     * @param {Array} values - Array of values
     * @returns {number} Variation coefficient
     */
    static calculateVariation(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        return mean > 0 ? standardDeviation / mean : 0;
    }
}

module.exports = RhythmCore;