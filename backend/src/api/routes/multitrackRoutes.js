/**
 * Multi-Track Audio Routes
 * HTTP route definitions for multi-track audio operations
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const MultitrackController = require('../controllers/multitrackController');
const validation = require('../../middleware/validation');

const router = express.Router();
const controller = new MultitrackController();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads');
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

/**
 * @route POST /api/multitrack/analyze
 * @desc Analyze multiple audio tracks for silence, overlaps, and sync
 * @access Public
 */
router.post('/analyze', 
    upload.array('audio', 6), 
    validation.validateMultiTrackAnalysis, 
    controller.analyzeTracks.bind(controller)
);

/**
 * @route POST /api/multitrack/sync
 * @desc Sync multiple audio tracks
 * @access Public
 */
router.post('/sync', 
    upload.array('audio', 6), 
    validation.validateMultiTrackSync, 
    controller.syncTracks.bind(controller)
);

/**
 * @route POST /api/multitrack/ducking
 * @desc Configure dynamic ducking for multiple tracks
 * @access Public
 */
router.post('/ducking', 
    upload.array('audio', 6), 
    validation.validateDynamicDucking, 
    controller.configureDucking.bind(controller)
);

/**
 * @route POST /api/multitrack/submix
 * @desc Configure submix routing for multiple tracks
 * @access Public
 */
router.post('/submix', 
    upload.array('audio', 6), 
    validation.validateSubmixRouting, 
    controller.configureSubmixRouting.bind(controller)
);

/**
 * @route GET /api/multitrack/capabilities
 * @desc Get multi-track processing capabilities
 * @access Public
 */
router.get('/capabilities', controller.getCapabilities.bind(controller));

/**
 * @route GET /api/multitrack/status/:requestId
 * @desc Get status of a long-running multi-track job
 * @access Public
 */
router.get('/status/:requestId', controller.getJobStatus.bind(controller));

module.exports = router;