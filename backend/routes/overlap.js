/**
 * Audio Overlap Detection API Routes
 * Handles all audio overlap detection and resolution operations
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const OverlapDetector = require('../services/OverlapDetector');
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
        files: 10 // Allow up to 10 files for multi-track analysis
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg',
            'audio/wave', 'audio/x-wav', 'audio/vnd.wav', // Additional WAV MIME types
            'application/octet-stream' // For files with generic MIME type
        ];
        
        // Also check file extension as fallback
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.wave'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'), false);
        }
    }
});

// Initialize services
const overlapDetector = new OverlapDetector();
const audioProcessor = new AudioProcessor();

/**
 * @route POST /api/overlap/detect
 * @desc Detect audio overlaps in uploaded audio files
 * @access Public
 */
router.post('/detect', upload.array('audio', 10), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting overlap detection`, {
            fileCount: req.files?.length || 0
        });

        // Handle single file by duplicating it for self-overlap detection
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No audio files provided for overlap detection',
                requestId
            });
        }

        let filesToProcess = req.files;
        
        // If only one file provided, duplicate it for self-overlap detection
        if (req.files.length === 1) {
            logger.info(`[${requestId}] Single file provided, enabling self-overlap detection`);
            filesToProcess = [req.files[0], req.files[0]];
        }

        // Validate request body
        const validationResult = validation.validateOverlapDetection(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            sensitivity: parseInt(req.body.sensitivity) || 5,
            frequencyRange: req.body.frequencyRange || 'full',
            fftSize: parseInt(req.body.fftSize) || 2048,
            analysisMode: req.body.analysisMode || 'hybrid',
            overlapThreshold: parseFloat(req.body.overlapThreshold) || 0.3,
            minOverlapDuration: parseFloat(req.body.minOverlapDuration) || 0.1,
            enableML: req.body.enableML !== false,
            enableCrossCorrelation: req.body.enableCrossCorrelation !== false,
            enableHarmonicAnalysis: req.body.enableHarmonicAnalysis || false,
            enableBackgroundNoiseDetection: req.body.enableBackgroundNoiseDetection !== false
        };

        // Perform overlap detection
        const results = await overlapDetector.detectOverlaps(filesToProcess, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Overlap detection completed`, {
            processingTime: `${processingTime}ms`,
            overlapsFound: results.overlaps?.length || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            audioFiles: filesToProcess.map(file => ({
                originalName: file.originalname,
                size: file.size,
                uploadedAt: new Date().toISOString()
            })),
            detectionOptions: options,
            results: {
                overlaps: results.overlaps || [],
                totalOverlaps: results.totalOverlaps || 0,
                overlapDuration: results.overlapDuration || 0,
                severity: results.severity || 'low',
                confidence: results.confidence || 0,
                algorithms: results.algorithms || []
            },
            analysis: {
                frequencyAnalysis: results.frequencyAnalysis || {},
                crossCorrelation: results.crossCorrelation || {},
                harmonicAnalysis: results.harmonicAnalysis || {},
                backgroundNoise: results.backgroundNoise || {}
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Overlap detection failed:`, error);
        
        res.status(500).json({
            error: 'Overlap detection failed',
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
 * @route POST /api/overlap/resolve
 * @desc Resolve detected audio overlaps
 * @access Public
 */
router.post('/resolve', upload.array('audio', 10), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting overlap resolution`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 audio files required for overlap resolution',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateOverlapResolution(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            resolutionMethod: req.body.resolutionMethod || 'auto', // 'auto', 'shift', 'duck', 'trim'
            overlaps: req.body.overlaps || [],
            shiftAmount: parseFloat(req.body.shiftAmount) || 0.1,
            duckingRatio: parseFloat(req.body.duckingRatio) || 0.3,
            trimMode: req.body.trimMode || 'fade',
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'high',
            preserveOriginal: req.body.preserveOriginal !== false
        };

        // Perform overlap resolution
        const result = await overlapDetector.resolveOverlaps(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Overlap resolution completed`, {
            processingTime: `${processingTime}ms`,
            resolvedOverlaps: result.resolvedOverlaps || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            originalFiles: req.files.map(file => ({
                name: file.originalname,
                size: file.size
            })),
            resolvedFiles: result.resolvedFiles?.map(file => ({
                name: file.name,
                size: file.size,
                downloadUrl: `/temp/${file.name}`
            })) || [],
            resolutionOptions: options,
            results: {
                resolvedOverlaps: result.resolvedOverlaps || 0,
                totalOverlaps: result.totalOverlaps || 0,
                resolutionMethods: result.resolutionMethods || [],
                quality: result.quality || 'high',
                processingTime: result.processingTime || 0
            },
            statistics: {
                timeShifted: result.timeShifted || 0,
                audioDucked: result.audioDucked || 0,
                segmentsTrimmed: result.segmentsTrimmed || 0,
                volumeAdjustments: result.volumeAdjustments || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Overlap resolution failed:`, error);
        
        res.status(500).json({
            error: 'Overlap resolution failed',
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
 * @route GET /api/overlap/algorithms
 * @desc Get available overlap detection algorithms
 * @access Public
 */
router.get('/algorithms', (req, res) => {
    try {
        const algorithms = overlapDetector.getAvailableAlgorithms();
        
        res.json({
            success: true,
            algorithms: algorithms.map(algorithm => ({
                id: algorithm.id,
                name: algorithm.name,
                description: algorithm.description,
                accuracy: algorithm.accuracy,
                speed: algorithm.speed,
                requirements: algorithm.requirements,
                supportedFormats: algorithm.supportedFormats,
                parameters: algorithm.parameters
            }))
        });
    } catch (error) {
        logger.error('Failed to get overlap detection algorithms:', error);
        res.status(500).json({
            error: 'Failed to get detection algorithms',
            message: error.message
        });
    }
});

/**
 * @route POST /api/overlap/analyze-frequency
 * @desc Perform frequency-domain analysis on audio files
 * @access Public
 */
router.post('/analyze-frequency', upload.array('audio', 10), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting frequency analysis`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No audio files provided',
                requestId
            });
        }

        const options = {
            fftSize: parseInt(req.body.fftSize) || 2048,
            frequencyRange: req.body.frequencyRange || 'full',
            smoothingTimeConstant: parseFloat(req.body.smoothingTimeConstant) || 0.8,
            enableHarmonicAnalysis: req.body.enableHarmonicAnalysis || false,
            enableSpectralAnalysis: req.body.enableSpectralAnalysis !== false
        };

        // Perform frequency analysis
        const results = await overlapDetector.analyzeFrequency(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Frequency analysis completed`, {
            processingTime: `${processingTime}ms`
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            audioFiles: req.files.map(file => ({
                originalName: file.originalname,
                size: file.size
            })),
            analysisOptions: options,
            results: {
                frequencyData: results.frequencyData || [],
                spectralAnalysis: results.spectralAnalysis || {},
                harmonicAnalysis: results.harmonicAnalysis || {},
                frequencyOverlaps: results.frequencyOverlaps || []
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Frequency analysis failed:`, error);
        
        res.status(500).json({
            error: 'Frequency analysis failed',
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
 * @route POST /api/overlap/cross-correlation
 * @desc Perform cross-correlation analysis on audio files
 * @access Public
 */
router.post('/cross-correlation', upload.array('audio', 10), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting cross-correlation analysis`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 audio files required for cross-correlation analysis',
                requestId
            });
        }

        const options = {
            correlationThreshold: parseFloat(req.body.correlationThreshold) || 0.7,
            windowSize: parseInt(req.body.windowSize) || 1024,
            hopSize: parseInt(req.body.hopSize) || 512,
            enableNormalization: req.body.enableNormalization !== false,
            enableTimeAlignment: req.body.enableTimeAlignment || false
        };

        // Perform cross-correlation analysis
        const results = await overlapDetector.analyzeCrossCorrelation(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Cross-correlation analysis completed`, {
            processingTime: `${processingTime}ms`
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            audioFiles: req.files.map(file => ({
                originalName: file.originalname,
                size: file.size
            })),
            analysisOptions: options,
            results: {
                correlationMatrix: results.correlationMatrix || [],
                correlationPeaks: results.correlationPeaks || [],
                timeAlignment: results.timeAlignment || {},
                overlapRegions: results.overlapRegions || []
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Cross-correlation analysis failed:`, error);
        
        res.status(500).json({
            error: 'Cross-correlation analysis failed',
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
 * @route GET /api/overlap/status/:requestId
 * @desc Get status of a long-running overlap detection job
 * @access Public
 */
router.get('/status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = await overlapDetector.getJobStatus(requestId);
        
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

module.exports = router;
