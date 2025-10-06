/**
 * Rhythm Analysis Routes
 * Clean route definitions that delegate to controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const RhythmController = require('../controllers/rhythmController');
const validation = require('../../middleware/validation');

const router = express.Router();
const rhythmController = new RhythmController();

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

// File cleanup middleware
const cleanupMiddleware = (req, res, next) => {
    res.on('finish', () => {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error(`Failed to delete uploaded file: ${err.message}`);
            });
        }
    });
    next();
};

// Routes
router.post('/analyze', 
    upload.single('audio'), 
    cleanupMiddleware,
    validation.validateRhythmAnalysis,
    rhythmController.analyzeRhythm.bind(rhythmController)
);

router.post('/correct', 
    upload.single('audio'), 
    cleanupMiddleware,
    validation.validateTimingCorrection,
    rhythmController.correctTiming.bind(rhythmController)
);

router.get('/algorithms', 
    rhythmController.getAlgorithms.bind(rhythmController)
);

router.get('/status/:requestId', 
    rhythmController.getJobStatus.bind(rhythmController)
);

router.post('/test', 
    rhythmController.testRhythmAnalysis.bind(rhythmController)
);

module.exports = router;