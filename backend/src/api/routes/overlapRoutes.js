/**
 * Overlap Detection Routes
 * Clean route definitions that delegate to controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const OverlapController = require('../controllers/overlapController');
const validation = require('../../middleware/validation');

const router = express.Router();
const overlapController = new OverlapController();

// Configure multer for multiple file uploads
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
        files: 10 // Max 10 files
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

// File cleanup middleware
const cleanupMiddleware = (req, res, next) => {
    res.on('finish', () => {
        // Handle both single file and multiple files
        if (req.file) {
            if (fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error(`Failed to delete uploaded file: ${err.message}`);
                });
            }
        }
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error(`Failed to delete uploaded file: ${err.message}`);
                    });
                }
            });
        }
    });
    next();
};

// Routes
router.post('/detect', 
    upload.single('audio'), // Changed from array to single since frontend sends one file
    cleanupMiddleware,
    validation.validateOverlapDetection,
    overlapController.detectOverlaps.bind(overlapController)
);

router.post('/resolve', 
    upload.array('audio', 10), 
    cleanupMiddleware,
    validation.validateOverlapResolution,
    overlapController.resolveOverlaps.bind(overlapController)
);

router.get('/algorithms', 
    overlapController.getAlgorithms.bind(overlapController)
);

router.get('/status/:requestId', 
    overlapController.getJobStatus.bind(overlapController)
);

router.post('/test', 
    overlapController.testOverlapDetection.bind(overlapController)
);

module.exports = router;