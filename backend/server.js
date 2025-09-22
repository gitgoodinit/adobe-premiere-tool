const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Bull = require('bull');
const Redis = require('redis');
const WebSocket = require('ws');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Redis connection
const redisClient = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Bull queue for job processing
const audioProcessingQueue = new Bull('audio processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    }
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3002 });

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit
    }
});

// Store active WebSocket connections
const activeConnections = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const jobId = req.url.split('=')[1];
    if (jobId) {
        activeConnections.set(jobId, ws);
        console.log(`WebSocket connected for job: ${jobId}`);
    }
    
    ws.on('close', () => {
        if (jobId) {
            activeConnections.delete(jobId);
            console.log(`WebSocket disconnected for job: ${jobId}`);
        }
    });
});

// Send progress update to client
function sendProgressUpdate(jobId, progress, message) {
    const ws = activeConnections.get(jobId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'progress',
            jobId: jobId,
            progress: progress,
            message: message,
            timestamp: new Date().toISOString()
        }));
    }
}

// Audio processing job
audioProcessingQueue.process('process-audio', async (job) => {
    const { filePath, options, jobId } = job.data;
    
    try {
        console.log(`Starting audio processing job: ${jobId}`);
        sendProgressUpdate(jobId, 0, 'Starting audio processing...');
        
        // Import the audio processor
        const AudioProcessor = require('./services/AudioProcessor');
        const processor = new AudioProcessor();
        
        // Process the audio file
        const result = await processor.processLargeFile(filePath, options, (progress, message) => {
            sendProgressUpdate(jobId, progress, message);
        });
        
        sendProgressUpdate(jobId, 100, 'Processing completed successfully!');
        
        return {
            success: true,
            result: result,
            jobId: jobId
        };
        
    } catch (error) {
        console.error(`Audio processing job failed: ${jobId}`, error);
        sendProgressUpdate(jobId, -1, `Processing failed: ${error.message}`);
        
        throw error;
    }
});

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Upload and process audio file
app.post('/process-audio', upload.single('audioFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        
        const jobId = uuidv4();
        const filePath = req.file.path;
        const options = req.body.options ? JSON.parse(req.body.options) : {};
        
        console.log(`Received audio file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);
        
        // Add job to queue
        const job = await audioProcessingQueue.add('process-audio', {
            filePath: filePath,
            options: options,
            jobId: jobId
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        });
        
        res.json({
            success: true,
            jobId: jobId,
            message: 'Audio processing job started',
            websocketUrl: `ws://localhost:3002?jobId=${jobId}`
        });
        
    } catch (error) {
        console.error('Error starting audio processing:', error);
        res.status(500).json({ 
            error: 'Failed to start audio processing',
            message: error.message 
        });
    }
});

// Get job status
app.get('/job/:jobId/status', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await audioProcessingQueue.getJob(jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const state = await job.getState();
        const progress = job.progress();
        
        res.json({
            jobId: jobId,
            state: state,
            progress: progress,
            data: job.data,
            result: job.returnvalue,
            error: job.failedReason
        });
        
    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ 
            error: 'Failed to get job status',
            message: error.message 
        });
    }
});

// Get job result
app.get('/job/:jobId/result', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await audioProcessingQueue.getJob(jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const state = await job.getState();
        
        if (state === 'completed') {
            res.json({
                success: true,
                result: job.returnvalue
            });
        } else if (state === 'failed') {
            res.status(500).json({
                success: false,
                error: job.failedReason
            });
        } else {
            res.json({
                success: false,
                message: 'Job is still processing',
                state: state
            });
        }
        
    } catch (error) {
        console.error('Error getting job result:', error);
        res.status(500).json({ 
            error: 'Failed to get job result',
            message: error.message 
        });
    }
});

// Cancel job
app.delete('/job/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await audioProcessingQueue.getJob(jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        await job.remove();
        
        res.json({
            success: true,
            message: 'Job cancelled successfully'
        });
        
    } catch (error) {
        console.error('Error cancelling job:', error);
        res.status(500).json({ 
            error: 'Failed to cancel job',
            message: error.message 
        });
    }
});

// List active jobs
app.get('/jobs', async (req, res) => {
    try {
        const jobs = await audioProcessingQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 50);
        
        const jobList = await Promise.all(jobs.map(async (job) => {
            const state = await job.getState();
            return {
                id: job.id,
                jobId: job.data.jobId,
                state: state,
                progress: job.progress(),
                data: job.data,
                result: job.returnvalue,
                error: job.failedReason
            };
        }));
        
        res.json({
            jobs: jobList
        });
        
    } catch (error) {
        console.error('Error listing jobs:', error);
        res.status(500).json({ 
            error: 'Failed to list jobs',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Audio Tools Backend Server running on port ${PORT}`);
    console.log(`📡 WebSocket server running on port 3002`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    // Close WebSocket server
    wss.close();
    
    // Close Redis connection
    await redisClient.quit();
    
    // Close Bull queue
    await audioProcessingQueue.close();
    
    process.exit(0);
});

module.exports = app;

