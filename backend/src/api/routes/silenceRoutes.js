/**
 * Silence Detection Routes
 * Clean route definitions that delegate to controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const SilenceController = require('../controllers/silenceController');
const validation = require('../../middleware/validation');

const router = express.Router();
const silenceController = new SilenceController();

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
    upload.single('audio'), 
    cleanupMiddleware,
    validation.validateSilenceDetection,
    silenceController.detectSilence.bind(silenceController)
);

router.post('/trim', 
    upload.single('audio'), 
    cleanupMiddleware,
    validation.validateSilenceTrimming,
    silenceController.trimSilence.bind(silenceController)
);

router.get('/methods', 
    silenceController.getMethods.bind(silenceController)
);

router.post('/batch', 
    upload.array('audio', 10), 
    cleanupMiddleware,
    silenceController.batchDetectSilence.bind(silenceController)
);

router.get('/status/:requestId', 
    silenceController.getJobStatus.bind(silenceController)
);

router.get('/download-last', 
    silenceController.downloadLastProcessed.bind(silenceController)
);

module.exports = router;