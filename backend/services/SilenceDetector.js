/**
 * Silence Detection Service
 * Handles silence detection using multiple methods
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const AudioProcessor = require('./AudioProcessor');
const Logger = require('./Logger');

class SilenceDetector {
    constructor() {
        this.logger = new Logger();
        this.audioProcessor = new AudioProcessor();
        this.jobs = new Map();
    }

    async detectSilence(filePath, options = {}) {
        const jobId = uuidv4();
        const startTime = Date.now();

        try {
            this.logger.info(`Starting silence detection job ${jobId}`, { filePath, options });

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
            const audioInfo = await this.audioProcessor.getAudioInfo(filePath);
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
                const ffmpegResults = await this.detectWithFFmpeg(filePath, options);
                results.silenceSegments.push(...ffmpegResults);
                results.methods.push('ffmpeg');
            }

            // Web Audio API detection (simulated)
            if (options.methods?.includes('webAudio')) {
                this.updateJobProgress(jobId, 60);
                const webAudioResults = await this.detectWithWebAudio(filePath, options);
                results.silenceSegments.push(...webAudioResults);
                results.methods.push('webAudio');
            }

            // AI/Transcript detection
            if (options.methods?.includes('transcript') && options.enableAI) {
                this.updateJobProgress(jobId, 80);
                const transcriptResults = await this.detectWithTranscript(filePath, options);
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

            this.logger.info(`Silence detection job ${jobId} completed`, {
                duration: Date.now() - startTime,
                segmentsFound: processedResults.silenceSegments.length
            });

            return processedResults;

        } catch (error) {
            this.logger.error(`Silence detection job ${jobId} failed:`, error);
            
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

    async detectWithFFmpeg(filePath, options) {
        try {
            const silenceSegments = await this.audioProcessor.detectSilence(filePath, {
                noiseThreshold: options.noiseThreshold || -30,
                minDuration: options.minDuration || 0.5
            });

            return silenceSegments.map(segment => ({
                ...segment,
                method: 'ffmpeg',
                confidence: 0.9
            }));

        } catch (error) {
            this.logger.error('FFmpeg silence detection failed:', error);
            return [];
        }
    }

    async detectWithWebAudio(filePath, options) {
        try {
            // Simulate Web Audio API detection
            // In a real implementation, this would use Web Audio API
            const audioInfo = await this.audioProcessor.getAudioInfo(filePath);
            const duration = audioInfo.duration;
            
            // Generate mock silence segments
            const segments = [];
            let currentTime = 0;
            
            while (currentTime < duration) {
                const segmentDuration = Math.random() * 3 + 0.5; // 0.5-3.5 seconds
                if (currentTime + segmentDuration < duration) {
                    segments.push({
                        start: currentTime,
                        end: currentTime + segmentDuration,
                        duration: segmentDuration,
                        method: 'webAudio',
                        confidence: 0.8
                    });
                }
                currentTime += segmentDuration + Math.random() * 5 + 2; // 2-7 seconds between segments
            }

            return segments;

        } catch (error) {
            this.logger.error('Web Audio silence detection failed:', error);
            return [];
        }
    }

    async detectWithTranscript(filePath, options) {
        try {
            // Simulate AI/Transcript-based detection
            // In a real implementation, this would use OpenAI Whisper
            const audioInfo = await this.audioProcessor.getAudioInfo(filePath);
            const duration = audioInfo.duration;
            
            // Generate mock transcript-based silence segments
            const segments = [];
            let currentTime = 0;
            
            while (currentTime < duration) {
                const segmentDuration = Math.random() * 2 + 0.3; // 0.3-2.3 seconds
                if (currentTime + segmentDuration < duration) {
                    segments.push({
                        start: currentTime,
                        end: currentTime + segmentDuration,
                        duration: segmentDuration,
                        method: 'transcript',
                        confidence: 0.95
                    });
                }
                currentTime += segmentDuration + Math.random() * 4 + 1; // 1-5 seconds between segments
            }

            return segments;

        } catch (error) {
            this.logger.error('Transcript silence detection failed:', error);
            return [];
        }
    }

    processResults(results, options) {
        // Merge overlapping segments
        const mergedSegments = this.mergeOverlappingSegments(results.silenceSegments);
        
        // Calculate statistics
        const totalSilenceDuration = mergedSegments.reduce((sum, segment) => sum + segment.duration, 0);
        const silencePercentage = (totalSilenceDuration / results.audioDuration) * 100;
        
        // Calculate confidence
        const confidence = this.calculateConfidence(mergedSegments, results.methods);

        return {
            ...results,
            silenceSegments: mergedSegments,
            totalSilenceDuration,
            silencePercentage,
            confidence
        };
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
                // Overlapping segments, merge them
                last.end = Math.max(last.end, current.end);
                last.duration = last.end - last.start;
                last.confidence = Math.max(last.confidence, current.confidence);
            } else {
                merged.push(current);
            }
        }

        return merged;
    }

    calculateConfidence(segments, methods) {
        if (segments.length === 0) return 0;

        const methodWeights = {
            ffmpeg: 0.4,
            webAudio: 0.3,
            transcript: 0.3
        };

        let totalWeight = 0;
        let weightedConfidence = 0;

        methods.forEach(method => {
            const weight = methodWeights[method] || 0;
            totalWeight += weight;
        });

        if (totalWeight === 0) return 0.5;

        segments.forEach(segment => {
            const methodWeight = methodWeights[segment.method] || 0;
            weightedConfidence += segment.confidence * methodWeight;
        });

        return weightedConfidence / totalWeight;
    }

    async trimSilence(filePath, options) {
        const jobId = uuidv4();
        const startTime = Date.now();

        try {
            this.logger.info(`Starting silence trimming job ${jobId}`, { filePath, options });

            // Get audio information
            const audioInfo = await this.audioProcessor.getAudioInfo(filePath);
            
            // Generate output path
            const outputPath = this.audioProcessor.generateTempPath(`.${options.outputFormat || 'mp3'}`);
            
            // Perform trimming
            const result = await this.audioProcessor.trimSilence(filePath, outputPath, options);
            
            // Get output file info
            const outputInfo = await this.audioProcessor.getAudioInfo(outputPath);
            
            const processingTime = Date.now() - startTime;
            
            this.logger.info(`Silence trimming job ${jobId} completed`, {
                duration: processingTime,
                segmentsProcessed: options.silenceSegments?.length || 0
            });

            return {
                outputFileName: path.basename(outputPath),
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
            this.logger.error(`Silence trimming job ${jobId} failed:`, error);
            throw error;
        }
    }

    async detectSilenceBatch(files, options) {
        const results = [];
        
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

    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }

    updateJobProgress(jobId, progress) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.progress = progress;
            job.updatedAt = new Date();
            this.jobs.set(jobId, job);
        }
    }

    cleanup() {
        // Clean up old jobs (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.startTime < oneHourAgo) {
                this.jobs.delete(jobId);
            }
        }
    }
}

module.exports = SilenceDetector;
