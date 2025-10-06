/**
 * Silence Controller
 * Handles HTTP requests for silence detection and processing
 */

const { v4: uuidv4 } = require('uuid');
const SilenceService = require('../../services/silenceService');
const Logger = require('../../utils/logger');

class SilenceController {
    constructor() {
        this.silenceService = new SilenceService();
        this.logger = new Logger();
    }

    /**
     * Detect silence in uploaded audio file
     */
    async detectSilence(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No audio file provided',
                    requestId
                });
            }

            // Parse methods array if it's a string
            if (req.body.methods && typeof req.body.methods === 'string') {
                try {
                    req.body.methods = JSON.parse(req.body.methods);
                } catch (e) {
                    // Keep original if parsing fails
                }
            }

            const options = {
                methods: req.body.methods || ['ffmpeg', 'webAudio', 'transcript'],
                noiseThreshold: parseFloat(req.body.noiseThreshold) || -30,
                minDuration: parseFloat(req.body.minDuration) || 0.5,
                confidenceThreshold: parseFloat(req.body.confidenceThreshold) || 0.7,
                enableAI: req.body.enableAI !== false,
                enablePreprocessing: req.body.enablePreprocessing !== false,
                language: req.body.language
            };

            // Perform silence detection
            const results = await this.silenceService.detectSilence(req.file.path, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                audioFile: {
                    originalName: req.file.originalname,
                    size: req.file.size,
                    uploadedAt: new Date().toISOString()
                },
                detectionOptions: options,
                results: {
                    silenceSegments: results.silenceSegments || [],
                    totalSilenceDuration: results.totalSilenceDuration || 0,
                    silencePercentage: results.silencePercentage || 0,
                    confidence: results.confidence || 0,
                    methods: results.methods || []
                },
                metadata: {
                    audioDuration: results.audioDuration || 0,
                    sampleRate: results.sampleRate || 0,
                    channels: results.channels || 0,
                    bitDepth: results.bitDepth || 0
                }
            });

        } catch (error) {
            this.logger.error(`[${requestId}] Silence detection failed:`, error);
            
            res.status(500).json({
                error: 'Silence detection failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Trim silence from audio file
     */
    async trimSilence(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No audio file provided',
                    requestId
                });
            }

            // Parse JSON fields from FormData
            const requestBody = { ...req.body };
            
            if (requestBody.silenceSegments && typeof requestBody.silenceSegments === 'string') {
                try {
                    requestBody.silenceSegments = JSON.parse(requestBody.silenceSegments);
                } catch (parseError) {
                    return res.status(400).json({
                        error: 'Invalid silenceSegments JSON format',
                        details: parseError.message,
                        requestId
                    });
                }
            }

            const options = {
                silenceSegments: requestBody.silenceSegments || [],
                trimMode: requestBody.trimMode || 'remove',
                fadeInDuration: parseFloat(requestBody.fadeInDuration) || 0.1,
                fadeOutDuration: parseFloat(requestBody.fadeOutDuration) || 0.1,
                compressionRatio: parseFloat(requestBody.compressionRatio) || 0.5,
                outputFormat: requestBody.outputFormat || 'mp3',
                quality: requestBody.quality || 'high'
            };

            // Perform silence trimming
            const result = await this.silenceService.trimSilence(req.file.path, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                originalFile: {
                    name: req.file.originalname,
                    size: req.file.size,
                    duration: result.originalDuration
                },
                trimmedFile: {
                    name: result.outputFileName,
                    size: result.outputFileSize,
                    duration: result.trimmedDuration,
                    downloadUrl: `/temp/${result.outputFileName}`
                },
                trimmingOptions: options,
                results: {
                    segmentsRemoved: result.segmentsRemoved || 0,
                    timeSaved: result.timeSaved || 0,
                    compressionRatio: result.compressionRatio || 0,
                    quality: result.quality || 'high'
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Silence trimming failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Get available silence detection methods
     */
    getMethods(req, res) {
        try {
            const methods = this.silenceService.getAvailableMethods();
            
            res.json({
                success: true,
                methods: methods.map(method => ({
                    id: method.id,
                    name: method.name,
                    description: method.description,
                    accuracy: method.accuracy,
                    speed: method.speed,
                    requirements: method.requirements,
                    supportedFormats: method.supportedFormats
                }))
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get detection methods',
                message: error.message
            });
        }
    }

    /**
     * Process multiple audio files for silence detection
     */
    async batchDetectSilence(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'No audio files provided',
                    requestId
                });
            }

            const options = {
                methods: req.body.methods || ['ffmpeg', 'webAudio'],
                noiseThreshold: parseFloat(req.body.noiseThreshold) || -30,
                minDuration: parseFloat(req.body.minDuration) || 0.5,
                parallel: req.body.parallel !== false
            };

            // Process files in batch
            const results = await this.silenceService.detectSilenceBatch(req.files, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                batchOptions: options,
                results: results.map((result, index) => ({
                    fileIndex: index,
                    fileName: req.files[index].originalname,
                    success: result.success,
                    silenceSegments: result.silenceSegments || [],
                    totalSilenceDuration: result.totalSilenceDuration || 0,
                    silencePercentage: result.silencePercentage || 0,
                    error: result.error || null
                }))
            });

        } catch (error) {
            res.status(500).json({
                error: 'Batch silence detection failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Get status of a silence detection job
     */
    async getJobStatus(req, res) {
        try {
            const { requestId } = req.params;
            const status = this.silenceService.getJobStatus(requestId);
            
            if (!status) {
                return res.status(404).json({
                    error: 'Job not found',
                    requestId
                });
            }

            res.json({
                success: true,
                requestId,
                status: status.status,
                progress: status.progress,
                results: status.results,
                error: status.error,
                createdAt: status.createdAt,
                updatedAt: status.updatedAt
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get job status',
                message: error.message
            });
        }
    }

    /**
     * Download the last processed audio file
     */
    downloadLastProcessed(req, res) {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // Find the most recent processed file
            const uploadsDir = path.join(__dirname, '../../../uploads');
            const files = fs.readdirSync(uploadsDir)
                .filter(file => file.includes('trimmed_'))
                .map(file => ({
                    name: file,
                    path: path.join(uploadsDir, file),
                    mtime: fs.statSync(path.join(uploadsDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            if (files.length === 0) {
                return res.status(404).json({
                    error: 'No processed audio files found'
                });
            }

            const latestFile = files[0];
            
            // Set headers for download
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Disposition', `attachment; filename="${latestFile.name}"`);
            
            // Stream the file
            const fileStream = fs.createReadStream(latestFile.path);
            fileStream.pipe(res);
            
        } catch (error) {
            res.status(500).json({
                error: 'Download failed',
                details: error.message
            });
        }
    }
}

module.exports = SilenceController;