/**
 * Silence Detection API Routes
 * Handles all silence detection and trimming operations
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const SilenceDetector = require('../services/SilenceDetector');
const AudioProcessor = require('../services/AudioProcessor');
const validation = require('../middleware/validation');
const Logger = require('../services/Logger');

const router = express.Router();
const logger = new Logger();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/mp4', 'video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'), false);
        }
    }
});

// Initialize services
const silenceDetector = new SilenceDetector();
const audioProcessor = new AudioProcessor();

/**
 * @route POST /api/silence/detect
 * @desc Detect silence in uploaded audio file
 * @access Public
 */
router.post('/detect', upload.single('audio'), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting silence detection`, {
            file: req.file?.originalname,
            size: req.file?.size
        });

        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                requestId
            });
        }

        if (req.body.methods && typeof req.body.methods === 'string') {
            try {
                req.body.methods = JSON.parse(req.body.methods);
            } catch (e) {
                logger.error(`[${requestId}] Failed to parse methods array: ${e.message}`);
            }
        }
        
        logger.info(`[${requestId}] Request body after parsing`, { body: req.body });
        
        const validationResult = validation.validateSilenceDetection(req.body);
        if (validationResult.error) {
            logger.error(`[${requestId}] Validation failed`, {
                error: validationResult.error.message,
                details: validationResult.error.details,
                requestBody: req.body
            });
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            methods: req.body.methods || ['ffmpeg', 'webAudio', 'transcript'],
            noiseThreshold: parseFloat(req.body.noiseThreshold) || -30,
            minDuration: parseFloat(req.body.minDuration) || 0.5,
            confidenceThreshold: parseFloat(req.body.confidenceThreshold) || 0.7,
            enableAI: req.body.enableAI !== false,
            enablePreprocessing: req.body.enablePreprocessing !== false,
            language: req.body.language // Optional language for OpenAI
        };

        // Configure OpenAI API key if provided
        if (req.body.openaiApiKey) {
            silenceDetector.setOpenAIApiKey(req.body.openaiApiKey);
            logger.info(`[${requestId}] OpenAI API key configured for request`);
        }

        // Perform silence detection
        const results = await silenceDetector.detectSilence(req.file.path, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Silence detection completed`, {
            processingTime: `${processingTime}ms`,
            silenceSegments: results.silenceSegments?.length || 0
        });

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
        logger.error(`[${requestId}] Silence detection failed:`, error);
        
        res.status(500).json({
            error: 'Silence detection failed',
            message: error.message,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
        });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) logger.error(`Failed to delete uploaded file: ${err.message}`);
            });
        }
    }
});

/**
 * @route POST /api/silence/trim
 * @desc Trim silence from audio file
 * @access Public
 */
router.post('/trim', upload.single('audio'), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting silence trimming`, {
            file: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                requestId
            });
        }

        // Parse JSON fields from FormData
        const requestBody = { ...req.body };
        logger.info(`[${requestId}] Raw request body:`, requestBody);
        
        if (requestBody.silenceSegments && typeof requestBody.silenceSegments === 'string') {
            try {
                requestBody.silenceSegments = JSON.parse(requestBody.silenceSegments);
                logger.info(`[${requestId}] Parsed silenceSegments:`, requestBody.silenceSegments);
            } catch (parseError) {
                logger.error(`[${requestId}] JSON parse error:`, parseError.message);
                return res.status(400).json({
                    error: 'Invalid silenceSegments JSON format',
                    details: parseError.message,
                    requestId
                });
            }
        }

        // Validate request body
        const validationResult = validation.validateSilenceTrimming(requestBody);
        if (validationResult.error) {
            logger.error(`[${requestId}] Validation failed:`, {
                error: validationResult.error.details,
                requestBody: requestBody
            });
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            silenceSegments: requestBody.silenceSegments || [],
            trimMode: requestBody.trimMode || 'remove', // 'remove', 'fade', 'compress'
            fadeInDuration: parseFloat(requestBody.fadeInDuration) || 0.1,
            fadeOutDuration: parseFloat(requestBody.fadeOutDuration) || 0.1,
            compressionRatio: parseFloat(requestBody.compressionRatio) || 0.5,
            outputFormat: requestBody.outputFormat || 'mp3',
            quality: requestBody.quality || 'high'
        };

        // Perform silence trimming
        const result = await silenceDetector.trimSilence(req.file.path, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Silence trimming completed`, {
            processingTime: `${processingTime}ms`,
            originalDuration: result.originalDuration,
            trimmedDuration: result.trimmedDuration
        });

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
        logger.error(`[${requestId}] Silence trimming failed:`, error);
        
        res.status(500).json({
            error: 'Silence trimming failed',
            message: error.message,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
        });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) logger.error(`Failed to delete uploaded file: ${err.message}`);
            });
        }
    }
});

/**
 * @route GET /api/silence/methods
 * @desc Get available silence detection methods
 * @access Public
 */
router.get('/methods', (req, res) => {
    try {
        const methods = silenceDetector.getAvailableMethods();
        
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
        logger.error('Failed to get silence detection methods:', error);
        res.status(500).json({
            error: 'Failed to get detection methods',
            message: error.message
        });
    }
});

/**
 * @route POST /api/silence/batch
 * @desc Process multiple audio files for silence detection
 * @access Public
 */
router.post('/batch', upload.array('audio', 10), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting batch silence detection`, {
            fileCount: req.files?.length || 0
        });

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

        // Process files in parallel or sequential
        const results = await silenceDetector.detectSilenceBatch(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Batch silence detection completed`, {
            processingTime: `${processingTime}ms`,
            processedFiles: results.length
        });

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
        logger.error(`[${requestId}] Batch silence detection failed:`, error);
        
        res.status(500).json({
            error: 'Batch silence detection failed',
            message: error.message,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
        });
    } finally {
        // Clean up uploaded files
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlink(file.path, (err) => {
                        if (err) logger.error(`Failed to delete uploaded file: ${err.message}`);
                    });
                }
            });
        }
    }
});

/**
 * @route GET /api/silence/status/:requestId
 * @desc Get status of a long-running silence detection job
 * @access Public
 */
router.get('/status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = await silenceDetector.getJobStatus(requestId);
        
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
        logger.error('Failed to get job status:', error);
        res.status(500).json({
            error: 'Failed to get job status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/silence/download-last
 * @desc Download the last processed audio file
 * @access Public
 */
router.get('/download-last', (req, res) => {
    try {
        // Find the most recent processed file
        const uploadsDir = path.join(__dirname, '../uploads');
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
        logger.error('Download failed:', error);
        res.status(500).json({
            error: 'Download failed',
            details: error.message
        });
    }
});

module.exports = router;
