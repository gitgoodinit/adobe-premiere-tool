/**
 * Multi-Track Audio Handling API Routes
 * Handles all multi-track audio operations including analysis, sync, and ducking
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const MultiTrackHandler = require('../services/MultiTrackHandler');
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
        fileSize: 100 * 1024 * 1024, // 100MB limit per file
        files: 6 // Maximum 6 tracks as per specification
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
const multiTrackHandler = new MultiTrackHandler();
const audioProcessor = new AudioProcessor();

/**
 * @route POST /api/multitrack/analyze
 * @desc Analyze multiple audio tracks for silence, overlaps, and sync
 * @access Public
 */
router.post('/analyze', upload.array('audio', 6), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting multi-track analysis`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 audio files required for multi-track analysis',
                requestId
            });
        }

        if (req.files.length > 6) {
            return res.status(400).json({
                error: 'Maximum 6 audio tracks supported',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateMultiTrackAnalysis(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            analysisTypes: req.body.analysisTypes || ['silence', 'overlap', 'sync'],
            trackTypes: req.body.trackTypes || [], // ['speech', 'music', 'effects']
            submixRouting: req.body.submixRouting || 'auto',
            silenceThreshold: parseFloat(req.body.silenceThreshold) || -30,
            overlapThreshold: parseFloat(req.body.overlapThreshold) || 0.3,
            syncTolerance: parseFloat(req.body.syncTolerance) || 0.1,
            enableRealTimeProcessing: req.body.enableRealTimeProcessing !== false,
            enableSubmixRouting: req.body.enableSubmixRouting !== false
        };

        // Perform multi-track analysis
        const results = await multiTrackHandler.analyzeTracks(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Multi-track analysis completed`, {
            processingTime: `${processingTime}ms`,
            tracksAnalyzed: results.tracksAnalyzed || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            audioTracks: req.files.map((file, index) => ({
                trackId: index,
                originalName: file.originalname,
                size: file.size,
                trackType: options.trackTypes[index] || 'audio',
                uploadedAt: new Date().toISOString()
            })),
            analysisOptions: options,
            results: {
                tracksAnalyzed: results.tracksAnalyzed || 0,
                silenceAnalysis: results.silenceAnalysis || {},
                overlapAnalysis: results.overlapAnalysis || {},
                syncAnalysis: results.syncAnalysis || {},
                submixRouting: results.submixRouting || {},
                recommendations: results.recommendations || []
            },
            statistics: {
                totalSilenceDuration: results.totalSilenceDuration || 0,
                totalOverlaps: results.totalOverlaps || 0,
                syncIssues: results.syncIssues || 0,
                processingQuality: results.processingQuality || 'high'
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Multi-track analysis failed:`, error);
        
        res.status(500).json({
            error: 'Multi-track analysis failed',
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
 * @route POST /api/multitrack/sync
 * @desc Sync multiple audio tracks
 * @access Public
 */
router.post('/sync', upload.array('audio', 6), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting multi-track sync`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 audio files required for sync',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateMultiTrackSync(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            syncMethod: req.body.syncMethod || 'auto', // 'auto', 'manual', 'cross-correlation'
            referenceTrack: parseInt(req.body.referenceTrack) || 0,
            syncTolerance: parseFloat(req.body.syncTolerance) || 0.1,
            manualOffsets: req.body.manualOffsets || [],
            enableMultiCamSync: req.body.enableMultiCamSync || false,
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'high'
        };

        // Perform multi-track sync
        const result = await multiTrackHandler.syncTracks(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Multi-track sync completed`, {
            processingTime: `${processingTime}ms`,
            tracksSynced: result.tracksSynced || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            originalTracks: req.files.map(file => ({
                name: file.originalname,
                size: file.size
            })),
            syncedTracks: result.syncedTracks?.map(track => ({
                name: track.name,
                size: track.size,
                offset: track.offset,
                downloadUrl: `/temp/${track.name}`
            })) || [],
            syncOptions: options,
            results: {
                tracksSynced: result.tracksSynced || 0,
                syncMethod: result.syncMethod || 'auto',
                averageOffset: result.averageOffset || 0,
                maxOffset: result.maxOffset || 0,
                syncQuality: result.syncQuality || 'high'
            },
            syncData: {
                offsets: result.offsets || [],
                correlationScores: result.correlationScores || [],
                timeAlignment: result.timeAlignment || {},
                syncConfidence: result.syncConfidence || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Multi-track sync failed:`, error);
        
        res.status(500).json({
            error: 'Multi-track sync failed',
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
 * @route POST /api/multitrack/ducking
 * @desc Configure dynamic ducking for multiple tracks
 * @access Public
 */
router.post('/ducking', upload.array('audio', 6), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting dynamic ducking configuration`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                error: 'At least 2 audio files required for ducking',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateDynamicDucking(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            primaryTrack: parseInt(req.body.primaryTrack) || 0,
            secondaryTracks: req.body.secondaryTracks || [],
            duckingRatio: parseFloat(req.body.duckingRatio) || 0.3,
            attackTime: parseFloat(req.body.attackTime) || 0.01,
            releaseTime: parseFloat(req.body.releaseTime) || 0.1,
            threshold: parseFloat(req.body.threshold) || -20,
            enableAutoDucking: req.body.enableAutoDucking !== false,
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'high'
        };

        // Configure dynamic ducking
        const result = await multiTrackHandler.configureDucking(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Dynamic ducking configuration completed`, {
            processingTime: `${processingTime}ms`,
            tracksProcessed: result.tracksProcessed || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            originalTracks: req.files.map(file => ({
                name: file.originalname,
                size: file.size
            })),
            duckedTracks: result.duckedTracks?.map(track => ({
                name: track.name,
                size: track.size,
                duckingApplied: track.duckingApplied,
                downloadUrl: `/temp/${track.name}`
            })) || [],
            duckingOptions: options,
            results: {
                tracksProcessed: result.tracksProcessed || 0,
                duckingEvents: result.duckingEvents || 0,
                averageDuckingRatio: result.averageDuckingRatio || 0,
                duckingQuality: result.duckingQuality || 'high'
            },
            duckingData: {
                duckingCurves: result.duckingCurves || [],
                volumeReductions: result.volumeReductions || [],
                timingData: result.timingData || {},
                duckingConfidence: result.duckingConfidence || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Dynamic ducking configuration failed:`, error);
        
        res.status(500).json({
            error: 'Dynamic ducking configuration failed',
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
 * @route POST /api/multitrack/submix
 * @desc Configure submix routing for multiple tracks
 * @access Public
 */
router.post('/submix', upload.array('audio', 6), async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info(`[${requestId}] Starting submix routing configuration`, {
            fileCount: req.files?.length || 0
        });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No audio files provided',
                requestId
            });
        }

        // Validate request body
        const validationResult = validation.validateSubmixRouting(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.details,
                requestId
            });
        }

        const options = {
            submixGroups: req.body.submixGroups || {
                main: { tracks: [], gain: 1.0 },
                speech: { tracks: [], gain: 1.0 },
                music: { tracks: [], gain: 1.0 },
                effects: { tracks: [], gain: 1.0 }
            },
            trackAssignments: req.body.trackAssignments || [],
            enableAutoRouting: req.body.enableAutoRouting !== false,
            outputFormat: req.body.outputFormat || 'mp3',
            quality: req.body.quality || 'high'
        };

        // Configure submix routing
        const result = await multiTrackHandler.configureSubmixRouting(req.files, options);

        const processingTime = Date.now() - startTime;
        
        logger.info(`[${requestId}] Submix routing configuration completed`, {
            processingTime: `${processingTime}ms`,
            submixGroups: result.submixGroups?.length || 0
        });

        res.json({
            success: true,
            requestId,
            processingTime: `${processingTime}ms`,
            originalTracks: req.files.map(file => ({
                name: file.originalname,
                size: file.size
            })),
            submixGroups: result.submixGroups?.map(group => ({
                name: group.name,
                tracks: group.tracks,
                gain: group.gain,
                outputFile: group.outputFile,
                downloadUrl: group.outputFile ? `/temp/${group.outputFile}` : null
            })) || [],
            routingOptions: options,
            results: {
                submixGroupsCreated: result.submixGroupsCreated || 0,
                tracksRouted: result.tracksRouted || 0,
                routingQuality: result.routingQuality || 'high'
            },
            routingData: {
                trackAssignments: result.trackAssignments || [],
                gainAdjustments: result.gainAdjustments || [],
                routingMatrix: result.routingMatrix || {},
                routingConfidence: result.routingConfidence || 0
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Submix routing configuration failed:`, error);
        
        res.status(500).json({
            error: 'Submix routing configuration failed',
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
 * @route GET /api/multitrack/capabilities
 * @desc Get multi-track processing capabilities
 * @access Public
 */
router.get('/capabilities', (req, res) => {
    try {
        const capabilities = multiTrackHandler.getCapabilities();
        
        res.json({
            success: true,
            capabilities: {
                maxTracks: capabilities.maxTracks || 6,
                supportedFormats: capabilities.supportedFormats || [],
                analysisTypes: capabilities.analysisTypes || [],
                syncMethods: capabilities.syncMethods || [],
                submixGroups: capabilities.submixGroups || [],
                duckingAlgorithms: capabilities.duckingAlgorithms || [],
                realTimeProcessing: capabilities.realTimeProcessing || false,
                audioWorkletSupport: capabilities.audioWorkletSupport || false
            }
        });
    } catch (error) {
        logger.error('Failed to get multi-track capabilities:', error);
        res.status(500).json({
            error: 'Failed to get capabilities',
            message: error.message
        });
    }
});

/**
 * @route GET /api/multitrack/status/:requestId
 * @desc Get status of a long-running multi-track job
 * @access Public
 */
router.get('/status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = await multiTrackHandler.getJobStatus(requestId);
        
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
