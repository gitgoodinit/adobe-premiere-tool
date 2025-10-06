/**
 * Settings Routes
 * Clean route definitions that delegate to controllers
 */

const express = require('express');
const multer = require('multer');

const SettingsController = require('../controllers/settingsController');
const validation = require('../../middleware/validation');

const router = express.Router();
const settingsController = new SettingsController();

// Configure multer for settings file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for settings files
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/json', 'text/plain', 'text/yaml', 'application/x-yaml'];
        const allowedExtensions = ['.json', '.yaml', '.yml', '.env'];
        
        const hasValidType = allowedTypes.includes(file.mimetype);
        const hasValidExt = allowedExtensions.some(ext => 
            file.originalname.toLowerCase().endsWith(ext)
        );
        
        if (hasValidType || hasValidExt) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JSON, YAML, and ENV files are allowed.'), false);
        }
    }
});

// Routes
router.get('/', 
    settingsController.getSettings.bind(settingsController)
);

router.put('/', 
    validation.validateSettingsUpdate,
    settingsController.updateSettings.bind(settingsController)
);

router.post('/export', 
    validation.validateSettingsExport,
    settingsController.exportSettings.bind(settingsController)
);

router.get('/export',
    settingsController.exportSettings.bind(settingsController)
);

router.post('/import', 
    upload.single('settingsFile'),
    validation.validateSettingsImport,
    settingsController.importSettings.bind(settingsController)
);

router.post('/reset', 
    validation.validateSettingsReset,
    settingsController.resetSettings.bind(settingsController)
);

router.get('/validate', 
    settingsController.validateSettings.bind(settingsController)
);

router.post('/test-api', 
    settingsController.testAPIConfiguration.bind(settingsController)
);

router.get('/test-api',
    settingsController.testAPIConfiguration.bind(settingsController)
);

router.get('/schema', 
    settingsController.getSettingsSchema.bind(settingsController)
);

module.exports = router;