/**
 * Rhythm & Timing Correction API Routes
 * Handles all rhythm analysis and timing correction operations
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const RhythmAnalyzer = require('../services/RhythmAnalyzer');
const TimingCorrector = require('../services/TimingCorrector');
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
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'), false);
        }
    }
});

// Initialize services
const rhythmAnalyzer = new RhythmAnalyzer();
const timingCorrector = new TimingCorrector();
const audioProcessor = new AudioProcessor();

/**
 * @route POST /api/rhythm/analyze
 * @desc Analyze rhythm and timing patterns in audio file
 * @access Public
 */
router.post('/analyze', upload.single('audio'), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting rhythm analysis`, {
            file: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateRhythmAnalysis(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            analysisTypes: req.body.analysisTypes || ['speech', 'silence', 'pacing', 'flow'],
            timingTolerance: parseFloat(req.body.timingTolerance) || 150, // ±150ms
            enableGPTAnalysis: req.body.enableGPTAnalysis !== false,
            enableFlowAnalysis: req.body.enableFlowAnalysis !== false,
            enablePreciseTiming: req.body.enablePreciseTiming !== false,
            language: req.body.language || 'en',
            confidenceThreshold: parseFloat(req.body.confidenceThreshold) || 0.7
        };

        // Perform rhythm analysis
        const results = await rhythmAnalyzer.analyzeRhythm(req.file.path, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Rhythm analysis completed`, {
            processingTime: `${processingTime}ms`,
            speechRegions: results.speechRegions?.length || 0,
            silenceRegions: results.silenceRegions?.length || 0
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
            analysisOptions: options,
            results: {
                speechRegions: results.speechRegions || [],
                silenceRegions: results.silenceRegions || [],
                pacingAnalysis: results.pacingAnalysis || {},
                flowAnalysis: results.flowAnalysis || {},
                timingPatterns: results.timingPatterns || {},
                rhythmMetrics: results.rhythmMetrics || {}
            },
            analysis: {
                totalDuration: results.totalDuration || 0,
                speechDuration: results.speechDuration || 0,
                silenceDuration: results.silenceDuration || 0,
                averagePace: results.averagePace || 0,
                flowScore: results.flowScore || 0,
                rhythmConsistency: results.rhythmConsistency || 0,
                confidence: results.confidence || 0
            },
            recommendations: results.recommendations || [],
            gptAnalysis: results.gptAnalysis || null
        });

    } catch (error) {
        logger.error(`[${requestId}] Rhythm analysis failed:`, error);
        
        res.status(500).json({
            error: 'Rhythm analysis failed',
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
 * @route POST /api/rhythm/correct
 * @desc Apply timing corrections to audio file
 * @access Public
 */
router.post('/correct', upload.single('audio'), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting timing correction`, {
            file: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateTimingCorrection(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            corrections: req.body.corrections || [],
            stretchAlgorithm: req.body.stretchAlgorithm || 'phase_vocoder',
            timingTolerance: parseFloat(req.body.timingTolerance) || 150,
            enablePreciseTiming: req.body.enablePreciseTiming !== false,
            enableValidation: req.body.enableValidation !== false,
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'high',
            preserveOriginal: req.body.preserveOriginal !== false
        };

        // Apply timing corrections
        const result = await timingCorrector.applyCorrections(req.file.path, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Timing correction completed`, {
            processingTime: `${processingTime}ms`,
            correctionsApplied: result.correctionsApplied || 0
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
            correctedFile: {
                name: result.outputFileName,
                size: result.outputFileSize,
                duration: result.correctedDuration,
                downloadUrl: `/temp/${result.outputFileName}`
            },
            correctionOptions: options,
            results: {
                correctionsApplied: result.correctionsApplied || 0,
                totalCorrections: result.totalCorrections || 0,
                timeSaved: result.timeSaved || 0,
                quality: result.quality || 'high',
                algorithm: result.algorithm || 'phase_vocoder'
            },
            timingStats: {
                averageTimingError: result.averageTimingError || 0,
                maxTimingError: result.maxTimingError || 0,
                timingAccuracy: result.timingAccuracy || 0,
                correctedSegments: result.correctedSegments || 0
            },
            corrections: result.corrections || []
        });

    } catch (error) {
        logger.error(`[${requestId}] Timing correction failed:`, error);
        
        res.status(500).json({
            error: 'Timing correction failed',
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
 * @route POST /api/rhythm/generate-corrections
 * @desc Generate timing corrections from analysis results
 * @access Public
 */
router.post('/generate-corrections', async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting correction generation`);

        // Validate request body
        const validationResult = validation.validateCorrectionGeneration(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            analysisResults: req.body.analysisResults || {},
            correctionTypes: req.body.correctionTypes || ['long_pause', 'short_segment', 'pacing'],
            timingTolerance: parseFloat(req.body.timingTolerance) || 150,
            enableGPTAnalysis: req.body.enableGPTAnalysis !== false,
            confidenceThreshold: parseFloat(req.body.confidenceThreshold) || 0.7,
            maxCorrections: parseInt(req.body.maxCorrections) || 50
        };

        // Generate corrections
        const corrections = await timingCorrector.generateCorrections(options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Correction generation completed`, {
            processingTime: `${processingTime}ms`,
            correctionsGenerated: corrections.length
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            generationOptions: options,
            corrections: corrections.map((correction, index) => ({
                id: index,
                type: correction.type,
                name: correction.name,
                severity: correction.severity,
                description: correction.description,
                timestamp: correction.timestamp,
                originalDuration: correction.originalDuration,
                suggestedDuration: correction.suggestedDuration,
                timingSavings: correction.timingSavings,
                confidence: correction.confidence,
                apply: correction.apply,
                gptSuggestion: correction.gptSuggestion
            })),
            summary: {
                totalCorrections: corrections.length,
                highSeverity: corrections.filter(c => c.severity === 'high').length,
                mediumSeverity: corrections.filter(c => c.severity === 'medium').length,
                lowSeverity: corrections.filter(c => c.severity === 'low').length,
                totalTimeSavings: corrections.reduce((sum, c) => sum + (c.timingSavings || 0), 0),
                averageConfidence: corrections.reduce((sum, c) => sum + (c.confidence || 0), 0) / corrections.length
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Correction generation failed:`, error);
        
        res.status(500).json({
            error: 'Correction generation failed',
            message: error.message,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
        });
    }
});

/**
 * @route GET /api/rhythm/algorithms
 * @desc Get available timing correction algorithms
 * @access Public
 */
router.get('/algorithms', (req, res) => {
    try {
        const algorithms = timingCorrector.getAvailableAlgorithms();
        
        res.json({
            success: true,
            algorithms: algorithms.map(algorithm => ({
                id: algorithm.id,
                name: algorithm.name,
                description: algorithm.description,
                quality: algorithm.quality,
                speed: algorithm.speed,
                pitchPreservation: algorithm.pitchPreservation,
                artifacts: algorithm.artifacts,
                useCases: algorithm.useCases,
                parameters: algorithm.parameters
            }))
        });
    } catch (error) {
        logger.error('Failed to get timing correction algorithms:', error);
        res.status(500).json({
            error: 'Failed to get algorithms',
            message: error.message
        });
    }
});

/**
 * @route POST /api/rhythm/preview
 * @desc Preview timing corrections without applying them
 * @access Public
 */
router.post('/preview', upload.single('audio'), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting timing correction preview`, {
            file: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateTimingPreview(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            corrections: req.body.corrections || [],
            stretchAlgorithm: req.body.stretchAlgorithm || 'phase_vocoder',
            previewDuration: parseFloat(req.body.previewDuration) || 30, // 30 seconds
            previewStartTime: parseFloat(req.body.previewStartTime) || 0,
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'medium'
        };

        // Generate preview
        const result = await timingCorrector.generatePreview(req.file.path, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Timing correction preview completed`, {
            processingTime: `${processingTime}ms`,
            previewDuration: result.previewDuration
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
            previewFile: {
                name: result.previewFileName,
                size: result.previewFileSize,
                duration: result.previewDuration,
                downloadUrl: `/temp/${result.previewFileName}`
            },
            previewOptions: options,
            results: {
                previewDuration: result.previewDuration,
                correctionsInPreview: result.correctionsInPreview || 0,
                quality: result.quality || 'medium',
                algorithm: result.algorithm || 'phase_vocoder'
            },
            timingStats: {
                averageTimingError: result.averageTimingError || 0,
                timingAccuracy: result.timingAccuracy || 0,
                correctedSegments: result.correctedSegments || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Timing correction preview failed:`, error);
        
        res.status(500).json({
            error: 'Timing correction preview failed',
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
 * @route GET /api/rhythm/status/:requestId
 * @desc Get status of a long-running rhythm analysis job
 * @access Public
 */
router.get('/status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = await rhythmAnalyzer.getJobStatus(requestId);
        
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
