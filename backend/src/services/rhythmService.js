/**
 * Rhythm Analysis Service
 * Orchestrates rhythm analysis workflows using core logic
 */

const { v4: uuidv4 } = require('uuid');
const RhythmCore = require('../core/rhythmCore');
const AudioCore = require('../core/audioCore');

class RhythmService {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Analyze rhythm and timing in audio file
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeRhythm(filePath, options = {}) {
        const jobId = uuidv4();
        const startTime = Date.now();

        try {
            // Initialize job tracking
            this.jobs.set(jobId, {
                id: jobId,
                status: 'processing',
                progress: 0,
                startTime: new Date(),
                results: null,
                error: null
            });

            // Get audio information
            this.updateJobProgress(jobId, 20);
            const audioInfo = await AudioCore.getAudioInfo(filePath);

            // Analyze speech rhythm using FFmpeg-based core logic
            this.updateJobProgress(jobId, 40);
            const speechAnalysis = await RhythmCore.analyzeSpeechRhythm(filePath, options);

            // Extract silence segments from speech analysis gaps
            this.updateJobProgress(jobId, 60);
            const silenceSegments = this.extractSilenceFromSpeechGaps(speechAnalysis.segments, speechAnalysis.totalDuration);

            // Analyze timing patterns
            this.updateJobProgress(jobId, 80);
            const timingAnalysis = RhythmCore.analyzeTimingPatterns(
                speechAnalysis.segments,
                silenceSegments
            );

            // Detect pacing issues
            const pacingIssues = RhythmCore.detectPacingIssues(speechAnalysis.segments);

            this.updateJobProgress(jobId, 95);

            // Compile final results
            const results = {
                speechRegions: speechAnalysis.segments,
                silenceRegions: silenceSegments,
                pacingAnalysis: {
                    averageSpeechRate: speechAnalysis.averageSpeechRate,
                    averagePauseDuration: speechAnalysis.averagePauseDuration,
                    rhythmConsistency: speechAnalysis.rhythmConsistency,
                    issues: pacingIssues
                },
                flowAnalysis: {
                    overallFlow: timingAnalysis.overallFlow,
                    speechPatterns: timingAnalysis.speechPatterns,
                    silencePatterns: timingAnalysis.silencePatterns,
                    transitions: timingAnalysis.transitions
                },
                totalDuration: speechAnalysis.totalDuration,
                confidence: this.calculateAnalysisConfidence(speechAnalysis, timingAnalysis),
                recommendations: timingAnalysis.recommendations
            };

            // Complete job
            this.jobs.set(jobId, {
                ...this.jobs.get(jobId),
                status: 'completed',
                progress: 100,
                results,
                endTime: new Date(),
                duration: Date.now() - startTime
            });

            return results;

        } catch (error) {
            this.jobs.set(jobId, {
                ...this.jobs.get(jobId),
                status: 'failed',
                error: error.message,
                endTime: new Date(),
                duration: Date.now() - startTime
            });

            throw error;
        }
    }

    /**
     * Apply timing corrections to audio file
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Correction options
     * @returns {Promise<Object>} Correction results
     */
    async correctTiming(filePath, options = {}) {
        const startTime = Date.now();

        try {
            // Real FFmpeg-based timing correction implementation
            const audioInfo = await AudioCore.getAudioInfo(filePath);
            
            // Generate output path
            const outputPath = this.generateTempPath(`.${options.outputFormat || 'mp3'}`);
            
            // Apply actual timing corrections using FFmpeg
            const result = await this.applyTimingCorrectionsWithFFmpeg(filePath, outputPath, options);
            
            return {
                outputFileName: require('path').basename(outputPath),
                outputPath: outputPath,
                originalDuration: audioInfo.duration,
                correctedDuration: result.correctedDuration,
                correctionsApplied: options.corrections?.length || 0,
                method: options.method || 'time_stretching',
                processingTime: Date.now() - startTime,
                success: true,
                appliedCorrections: result.appliedCorrections
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get available correction algorithms
     * @returns {Array} Available algorithms
     */
    getAvailableAlgorithms() {
        return [
            {
                id: 'time_stretching',
                name: 'Time Stretching',
                description: 'Adjust timing without changing pitch',
                accuracy: 'high',
                quality: 'good',
                requirements: ['ffmpeg']
            },
            {
                id: 'silence_adjustment',
                name: 'Silence Adjustment',
                description: 'Modify pause durations for better flow',
                accuracy: 'very_high',
                quality: 'excellent',
                requirements: ['ffmpeg']
            },
            {
                id: 'dynamic_pacing',
                name: 'Dynamic Pacing',
                description: 'AI-powered dynamic pacing adjustment',
                accuracy: 'very_high',
                quality: 'excellent',
                requirements: ['openai_api_key', 'ffmpeg']
            }
        ];
    }

    /**
     * Apply timing corrections using FFmpeg
     */
    async applyTimingCorrectionsWithFFmpeg(inputPath, outputPath, options) {
        const ffmpeg = require('fluent-ffmpeg');
        const { corrections = [], method = 'time_stretching', speedAdjustment = 1.0 } = options;
        
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);
            let appliedCorrections = [];
            
            try {
                // Apply different correction methods
                switch (method) {
                    case 'time_stretching':
                        if (speedAdjustment !== 1.0) {
                            command = command.audioFilters(`atempo=${speedAdjustment}`);
                            appliedCorrections.push({ type: 'speed_adjustment', value: speedAdjustment });
                        }
                        break;
                        
                    case 'silence_adjustment':
                        // Apply silence duration modifications
                        const silenceFilters = corrections
                            .filter(c => c.type === 'silence_duration')
                            .map(c => {
                                appliedCorrections.push(c);
                                return `adelay=${c.start * 1000}|${c.start * 1000}`;
                            });
                        if (silenceFilters.length > 0) {
                            command = command.audioFilters(silenceFilters);
                        }
                        break;
                        
                    case 'dynamic_pacing':
                        // Apply complex pacing adjustments
                        const pacingFilters = [];
                        corrections.forEach(c => {
                            if (c.type === 'speed_change') {
                                pacingFilters.push(`atempo=${c.factor}`);
                                appliedCorrections.push(c);
                            }
                        });
                        if (pacingFilters.length > 0) {
                            command = command.audioFilters(pacingFilters);
                        }
                        break;
                }
                
                command
                    .audioCodec('libmp3lame')
                    .audioBitrate('192k')
                    .output(outputPath)
                    .on('end', () => {
                        // Get duration of corrected file
                        ffmpeg.ffprobe(outputPath, (err, metadata) => {
                            const correctedDuration = err ? 0 : parseFloat(metadata.format.duration);
                            resolve({
                                correctedDuration,
                                appliedCorrections
                            });
                        });
                    })
                    .on('error', reject)
                    .run();
                    
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Extract silence segments from gaps between speech segments
     * @param {Array} speechSegments - Speech segments
     * @param {number} totalDuration - Total audio duration
     * @returns {Array} Silence segments
     */
    extractSilenceFromSpeechGaps(speechSegments, totalDuration) {
        const silenceSegments = [];
        
        // Add silence before first speech segment
        if (speechSegments.length > 0 && speechSegments[0].start > 0) {
            silenceSegments.push({
                start: 0,
                end: speechSegments[0].start,
                duration: speechSegments[0].start,
                type: 'silence'
            });
        }
        
        // Add silence between speech segments
        for (let i = 0; i < speechSegments.length - 1; i++) {
            const currentEnd = speechSegments[i].end;
            const nextStart = speechSegments[i + 1].start;
            
            if (nextStart > currentEnd) {
                silenceSegments.push({
                    start: currentEnd,
                    end: nextStart,
                    duration: nextStart - currentEnd,
                    type: 'silence'
                });
            }
        }
        
        // Add silence after last speech segment
        if (speechSegments.length > 0) {
            const lastEnd = speechSegments[speechSegments.length - 1].end;
            if (lastEnd < totalDuration) {
                silenceSegments.push({
                    start: lastEnd,
                    end: totalDuration,
                    duration: totalDuration - lastEnd,
                    type: 'silence'
                });
            }
        }
        
        return silenceSegments;
    }

    /**
     * Generate mock silence segments for testing
     * @param {number} duration - Audio duration
     * @returns {Array} Mock silence segments
     */
    generateMockSilenceSegments(duration) {
        const segments = [];
        let currentTime = 0;
        
        while (currentTime < duration) {
            const segmentDuration = Math.random() * 2 + 0.5; // 0.5-2.5 seconds
            if (currentTime + segmentDuration < duration) {
                segments.push({
                    start: currentTime,
                    end: currentTime + segmentDuration,
                    duration: segmentDuration,
                    confidence: 0.9
                });
            }
            currentTime += segmentDuration + Math.random() * 5 + 2; // 2-7 seconds between segments
        }
        
        return segments;
    }

    /**
     * Calculate analysis confidence score
     * @param {Object} speechAnalysis - Speech analysis results
     * @param {Object} timingAnalysis - Timing analysis results
     * @returns {number} Confidence score (0-1)
     */
    calculateAnalysisConfidence(speechAnalysis, timingAnalysis) {
        const speechConfidence = speechAnalysis.rhythmConsistency;
        const timingConfidence = timingAnalysis.overallFlow;
        
        return (speechConfidence + timingConfidence) / 2;
    }

    /**
     * Get job status
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job status
     */
    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }

    /**
     * Update job progress
     * @param {string} jobId - Job ID
     * @param {number} progress - Progress percentage
     */
    updateJobProgress(jobId, progress) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.progress = progress;
            job.updatedAt = new Date();
            this.jobs.set(jobId, job);
        }
    }

    /**
     * Generate temporary file path
     * @param {string} extension - File extension
     * @returns {string} Temporary file path
     */
    generateTempPath(extension = '.tmp') {
        const path = require('path');
        const fs = require('fs');
        const { v4: uuidv4 } = require('uuid');
        
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        return path.join(tempDir, `${uuidv4()}${extension}`);
    }

    /**
     * Clean up old jobs
     */
    cleanup() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.startTime < oneHourAgo) {
                this.jobs.delete(jobId);
            }
        }
    }
}

module.exports = RhythmService;