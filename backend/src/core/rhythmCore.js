/**
 * Rhythm Analysis Core Logic
 * Pure algorithms for rhythm and timing analysis
 */

class RhythmCore {
    /**
     * Analyze speech rhythm patterns
     * @param {Object} audioInfo - Audio file information
     * @param {Object} options - Analysis options
     * @returns {Object} Rhythm analysis results
     */
    static analyzeSpeechRhythm(audioInfo, options = {}) {
        const {
            segmentLength = 2.0,
            overlapRatio = 0.5
        } = options;

        const duration = audioInfo.duration;
        const segments = [];
        
        // Generate mock speech rhythm segments
        let currentTime = 0;
        while (currentTime < duration) {
            const segmentDuration = segmentLength + (Math.random() - 0.5) * 0.5;
            const segment = {
                start: currentTime,
                end: Math.min(currentTime + segmentDuration, duration),
                duration: Math.min(segmentDuration, duration - currentTime),
                speechRate: Math.random() * 3 + 2, // 2-5 words per second
                pauseDuration: Math.random() * 0.5 + 0.1, // 0.1-0.6 seconds
                intensity: Math.random() * 0.5 + 0.5, // 0.5-1.0
                pitch: Math.random() * 100 + 100 // 100-200 Hz
            };
            
            segments.push(segment);
            currentTime += segmentDuration * (1 - overlapRatio);
        }
        
        return {
            segments,
            averageSpeechRate: this.calculateAverageSpeechRate(segments),
            averagePauseDuration: this.calculateAveragePause(segments),
            rhythmConsistency: this.calculateRhythmConsistency(segments)
        };
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