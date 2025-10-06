/**
 * Health Check Routes
 * Clean route definitions that delegate to controllers
 */

const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();
const healthController = new HealthController();

// Routes
router.get('/', 
    healthController.getHealth.bind(healthController)
);

router.get('/detailed', 
    healthController.getDetailedHealth.bind(healthController)
);

router.get('/info', 
    healthController.getApiInfo.bind(healthController)
);

router.get('/metrics', 
    healthController.getMetrics.bind(healthController)
);

module.exports = router;