/**
 * Silence Detection Service
 * Orchestrates silence detection workflows using core logic
 */

const { v4: uuidv4 } = require('uuid');
const SilenceCore = require('../core/silenceCore');
const AudioCore = require('../core/audioCore');

class SilenceService {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Detect silence in audio file using multiple methods
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Detection options
     * @returns {Promise<Object>} Detection results
     */
    async detectSilence(filePath, options = {}) {
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
            const audioInfo = await AudioCore.getAudioInfo(filePath);
            this.updateJobProgress(jobId, 20);

            // Run detection methods
            const results = {
                silenceSegments: [],
                totalSilenceDuration: 0,
                silencePercentage: 0,
                confidence: 0,
                methods: [],
                audioDuration: audioInfo.duration,
                sampleRate: audioInfo.sampleRate,
                channels: audioInfo.channels,
                bitDepth: audioInfo.bitDepth || 16
            };

            // FFmpeg detection
            if (options.methods?.includes('ffmpeg')) {
                this.updateJobProgress(jobId, 40);
                const ffmpegResults = await SilenceCore.detectWithFFmpeg(filePath, options);
                const enhancedResults = ffmpegResults.map(segment => ({
                    ...segment,
                    method: 'ffmpeg',
                    confidence: 0.9
                }));
                results.silenceSegments.push(...enhancedResults);
                results.methods.push('ffmpeg');
            }

            // Web Audio API detection (simulated)
            if (options.methods?.includes('webAudio')) {
                this.updateJobProgress(jobId, 60);
                const webAudioResults = await SilenceCore.detectWithWebAudio(filePath, options);
                results.silenceSegments.push(...webAudioResults);
                results.methods.push('webAudio');
            }

            // AI/Transcript detection
            if (options.methods?.includes('transcript') && options.enableAI) {
                this.updateJobProgress(jobId, 80);
                const transcriptResults = SilenceCore.detectWithTranscript(audioInfo, options);
                results.silenceSegments.push(...transcriptResults);
                results.methods.push('transcript');
            }

            // Process and merge results
            this.updateJobProgress(jobId, 90);
            const processedResults = this.processResults(results, options);

            // Complete job
            this.jobs.set(jobId, {
                ...this.jobs.get(jobId),
                status: 'completed',
                progress: 100,
                results: processedResults,
                endTime: new Date(),
                duration: Date.now() - startTime
            });

            return processedResults;

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
     * Trim silence from audio file
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Trimming options
     * @returns {Promise<Object>} Trimming results
     */
    async trimSilence(filePath, options) {
        const startTime = Date.now();

        try {
            // Get audio information
            const audioInfo = await AudioCore.getAudioInfo(filePath);
            
            // Generate output path
            const outputPath = this.generateTempPath(`.${options.outputFormat || 'mp3'}`);
            
            // Perform trimming using core logic
            const result = await SilenceCore.trimSilence(filePath, outputPath, options);
            
            // Get output file info
            const outputInfo = await AudioCore.getAudioInfo(outputPath);
            
            const processingTime = Date.now() - startTime;

            return {
                outputFileName: require('path').basename(outputPath),
                outputFileSize: outputInfo.size,
                originalDuration: audioInfo.duration,
                trimmedDuration: outputInfo.duration,
                segmentsRemoved: options.silenceSegments?.length || 0,
                timeSaved: audioInfo.duration - outputInfo.duration,
                compressionRatio: outputInfo.duration / audioInfo.duration,
                quality: options.quality || 'high',
                processingTime
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Process batch silence detection
     * @param {Array} files - Array of files
     * @param {Object} options - Detection options
     * @returns {Promise<Array>} Batch results
     */
    async detectSilenceBatch(files, options) {
        if (options.parallel) {
            // Process files in parallel
            const promises = files.map(async (file, index) => {
                try {
                    const result = await this.detectSilence(file.path, options);
                    return {
                        fileIndex: index,
                        fileName: file.originalname,
                        success: true,
                        ...result
                    };
                } catch (error) {
                    return {
                        fileIndex: index,
                        fileName: file.originalname,
                        success: false,
                        error: error.message
                    };
                }
            });
            
            return Promise.all(promises);
        } else {
            // Process files sequentially
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const result = await this.detectSilence(file.path, options);
                    results.push({
                        fileIndex: i,
                        fileName: file.originalname,
                        success: true,
                        ...result
                    });
                } catch (error) {
                    results.push({
                        fileIndex: i,
                        fileName: file.originalname,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return results;
        }
    }

    /**
     * Process and merge detection results
     * @param {Object} results - Raw detection results
     * @param {Object} options - Detection options
     * @returns {Object} Processed results
     */
    processResults(results, options) {
        // Merge overlapping segments using core logic
        const mergedSegments = SilenceCore.mergeOverlappingSegments(results.silenceSegments);
        
        // Calculate statistics
        const totalSilenceDuration = mergedSegments.reduce((sum, segment) => sum + segment.duration, 0);
        const silencePercentage = (totalSilenceDuration / results.audioDuration) * 100;
        
        // Calculate confidence using core logic
        const confidence = SilenceCore.calculateConfidence(mergedSegments, results.methods);

        return {
            ...results,
            silenceSegments: mergedSegments,
            totalSilenceDuration,
            silencePercentage,
            confidence
        };
    }

    /**
     * Get available detection methods
     * @returns {Array} Available methods
     */
    getAvailableMethods() {
        return [
            {
                id: 'ffmpeg',
                name: 'FFmpeg Silence Detection',
                description: 'High-accuracy silence detection using FFmpeg',
                accuracy: 'high',
                speed: 'fast',
                requirements: ['ffmpeg'],
                supportedFormats: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac']
            },
            {
                id: 'webAudio',
                name: 'Web Audio API Analysis',
                description: 'Real-time audio analysis using Web Audio API',
                accuracy: 'medium',
                speed: 'very_fast',
                requirements: ['browser'],
                supportedFormats: ['wav', 'mp3']
            },
            {
                id: 'transcript',
                name: 'AI Transcript Analysis',
                description: 'AI-powered silence detection using speech transcription',
                accuracy: 'very_high',
                speed: 'slow',
                requirements: ['openai_api_key'],
                supportedFormats: ['mp3', 'wav', 'm4a', 'ogg']
            }
        ];
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

module.exports = SilenceService;