/**
 * Overlap Detection Service
 * Orchestrates overlap detection workflows using core logic
 */

const { v4: uuidv4 } = require('uuid');
const OverlapCore = require('../core/overlapCore');
const AudioCore = require('../core/audioCore');

class OverlapService {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Detect overlaps in multiple audio files
     * @param {Array} files - Array of audio files
     * @param {Object} options - Detection options
     * @returns {Promise<Object>} Detection results
     */
    async detectOverlaps(files, options = {}) {
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

            // Get audio information for each file
            this.updateJobProgress(jobId, 20);
            const audioFiles = await Promise.all(
                files.map(async (file, index) => ({
                    index,
                    name: file.originalname || file.name,
                    path: file.path,
                    info: await AudioCore.getAudioInfo(file.path)
                }))
            );

            this.updateJobProgress(jobId, 40);

            // Detect overlaps using different algorithms
            let overlaps = [];
            
            if (options.algorithm === 'frequency_domain' || !options.algorithm) {
                const frequencyOverlaps = OverlapCore.detectWithFrequencyDomain(audioFiles, options);
                overlaps.push(...frequencyOverlaps);
            }

            if (options.algorithm === 'cross_correlation') {
                const correlationOverlaps = OverlapCore.detectWithCrossCorrelation(audioFiles, options);
                overlaps.push(...correlationOverlaps);
            }

            this.updateJobProgress(jobId, 70);

            // Analyze severity and filter by confidence
            overlaps = OverlapCore.analyzeSeverity(overlaps);
            overlaps = OverlapCore.filterByConfidence(overlaps, options.confidenceThreshold || 0.7);

            this.updateJobProgress(jobId, 90);

            // Prepare final results
            const results = {
                overlaps,
                totalOverlaps: overlaps.length,
                overlapDuration: OverlapCore.calculateTotalDuration(overlaps),
                severity: this.calculateOverallSeverity(overlaps),
                confidence: this.calculateAverageConfidence(overlaps),
                filePairs: OverlapCore.groupByFilePairs(overlaps),
                resolutionSuggestions: OverlapCore.generateResolutionSuggestions(overlaps)
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
     * Resolve detected overlaps
     * @param {Array} files - Array of audio files
     * @param {Object} options - Resolution options
     * @returns {Promise<Object>} Resolution results
     */
    async resolveOverlaps(files, options) {
        const startTime = Date.now();

        try {
            // Mock resolution implementation
            // In real scenario, this would apply the suggested resolution methods
            const resolvedFiles = files.map((file, index) => ({
                originalFile: file.originalname || file.name,
                resolvedFile: `resolved_${file.originalname || file.name}`,
                resolutionMethod: options.resolutionMethod || 'trim',
                processingTime: Math.random() * 1000 + 500 // 0.5-1.5 seconds
            }));

            const results = {
                resolvedFiles,
                resolvedOverlaps: options.overlaps?.length || 0,
                totalOverlaps: options.overlaps?.length || 0,
                resolutionMethod: options.resolutionMethod || 'trim',
                processingTime: Date.now() - startTime
            };

            return results;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get available overlap detection algorithms
     * @returns {Array} Available algorithms
     */
    getAvailableAlgorithms() {
        return [
            {
                id: 'frequency_domain',
                name: 'Frequency Domain Analysis',
                description: 'FFT-based frequency analysis for overlap detection',
                accuracy: 'high',
                speed: 'medium',
                requirements: ['ffmpeg'],
                supportedFormats: ['mp3', 'wav', 'm4a', 'ogg']
            },
            {
                id: 'cross_correlation',
                name: 'Cross-Correlation Analysis',
                description: 'Time-domain cross-correlation for overlap detection',
                accuracy: 'very_high',
                speed: 'slow',
                requirements: ['ffmpeg'],
                supportedFormats: ['wav', 'mp3']
            },
            {
                id: 'ai_analysis',
                name: 'AI-Powered Analysis',
                description: 'Machine learning-based overlap detection',
                accuracy: 'very_high',
                speed: 'slow',
                requirements: ['openai_api_key'],
                supportedFormats: ['mp3', 'wav', 'm4a']
            }
        ];
    }

    /**
     * Calculate overall severity from overlaps
     * @param {Array} overlaps - Array of overlap segments
     * @returns {string} Overall severity level
     */
    calculateOverallSeverity(overlaps) {
        if (overlaps.length === 0) return 'none';

        const severityCounts = {
            low: 0,
            medium: 0,
            high: 0
        };

        overlaps.forEach(overlap => {
            severityCounts[overlap.severity]++;
        });

        if (severityCounts.high > 0) return 'high';
        if (severityCounts.medium > severityCounts.low) return 'medium';
        return 'low';
    }

    /**
     * Calculate average confidence from overlaps
     * @param {Array} overlaps - Array of overlap segments
     * @returns {number} Average confidence score
     */
    calculateAverageConfidence(overlaps) {
        if (overlaps.length === 0) return 0;

        const totalConfidence = overlaps.reduce((sum, overlap) => sum + overlap.confidence, 0);
        return totalConfidence / overlaps.length;
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

module.exports = OverlapService;