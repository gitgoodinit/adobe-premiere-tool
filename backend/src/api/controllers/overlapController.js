/**
 * Overlap Detection Controller
 * Handles HTTP requests for audio overlap detection and resolution
 */

const { v4: uuidv4 } = require('uuid');
const OverlapService = require('../../services/overlapService');
const Logger = require('../../utils/logger');

class OverlapController {
    constructor() {
        this.overlapService = new OverlapService();
        this.logger = new Logger();
    }

    /**
     * Detect overlaps in a single audio file 
     */
    async detectOverlaps(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            // Handle single file upload for overlap detection within one file
            if (!req.file) {
                return res.status(400).json({
                    error: 'Audio file is required for overlap detection',
                    requestId
                });
            }

            const options = {
                algorithm: req.body.algorithm || 'frequency_domain',
                threshold: parseFloat(req.body.threshold) || 0.8,
                confidenceThreshold: parseFloat(req.body.confidenceThreshold) || 0.7,
                windowSize: parseInt(req.body.windowSize) || 1024,
                hopSize: parseInt(req.body.hopSize) || 512,
                maxLag: parseFloat(req.body.maxLag) || 5.0,
                sensitivity: parseInt(req.body.sensitivity) || 5,
                frequencyRange: req.body.frequencyRange || 'full',
                fftSize: parseInt(req.body.fftSize) || 2048,
                analysisMode: req.body.analysisMode || 'hybrid',
                overlapThreshold: parseFloat(req.body.overlapThreshold) || 0.3,
                minOverlapDuration: parseFloat(req.body.minOverlapDuration) || 0.1,
                enableML: req.body.enableML === 'true',
                enableCrossCorrelation: req.body.enableCrossCorrelation === 'true',
                enableHarmonicAnalysis: req.body.enableHarmonicAnalysis === 'true',
                enableBackgroundNoiseDetection: req.body.enableBackgroundNoiseDetection === 'true'
            };

            // Perform overlap detection on single file
            const results = await this.overlapService.detectOverlaps([req.file], options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                files: [{
                    originalName: req.file.originalname,
                    size: req.file.size
                }],
                detectionOptions: options,
                results: {
                    overlaps: results.overlaps || [],
                    totalOverlaps: results.totalOverlaps || 0,
                    overlapDuration: results.overlapDuration || 0,
                    severity: results.severity || 'none',
                    confidence: results.confidence || 0,
                    filePairs: results.filePairs || {},
                    resolutionSuggestions: results.resolutionSuggestions || []
                }
            });

        } catch (error) {
            this.logger.error('Overlap detection failed:', error);
            res.status(500).json({
                error: 'Overlap detection failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Resolve detected overlaps
     */
    async resolveOverlaps(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'No audio files provided',
                    requestId
                });
            }

            // Parse overlaps if provided as string
            let overlaps = req.body.overlaps;
            if (typeof overlaps === 'string') {
                try {
                    overlaps = JSON.parse(overlaps);
                } catch (parseError) {
                    return res.status(400).json({
                        error: 'Invalid overlaps JSON format',
                        details: parseError.message,
                        requestId
                    });
                }
            }

            const options = {
                overlaps: overlaps || [],
                resolutionMethod: req.body.resolutionMethod || 'trim',
                fadeInDuration: parseFloat(req.body.fadeInDuration) || 0.1,
                fadeOutDuration: parseFloat(req.body.fadeOutDuration) || 0.1,
                duckingLevel: parseFloat(req.body.duckingLevel) || 0.3,
                outputFormat: req.body.outputFormat || 'mp3',
                quality: req.body.quality || 'high'
            };

            // Perform overlap resolution
            const results = await this.overlapService.resolveOverlaps(req.files, options);

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                files: req.files.map(file => ({
                    originalName: file.originalname,
                    size: file.size
                })),
                resolutionOptions: options,
                results: {
                    resolvedFiles: results.resolvedFiles || [],
                    resolvedOverlaps: results.resolvedOverlaps || 0,
                    totalOverlaps: results.totalOverlaps || 0,
                    resolutionMethod: results.resolutionMethod || 'trim'
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Overlap resolution failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }

    /**
     * Get available overlap detection algorithms
     */
    getAlgorithms(req, res) {
        try {
            const algorithms = this.overlapService.getAvailableAlgorithms();
            
            res.json({
                success: true,
                algorithms: algorithms.map(algorithm => ({
                    id: algorithm.id,
                    name: algorithm.name,
                    description: algorithm.description,
                    accuracy: algorithm.accuracy,
                    speed: algorithm.speed,
                    requirements: algorithm.requirements,
                    supportedFormats: algorithm.supportedFormats
                }))
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get overlap detection algorithms',
                message: error.message
            });
        }
    }

    /**
     * Get status of an overlap detection job
     */
    async getJobStatus(req, res) {
        try {
            const { requestId } = req.params;
            const status = this.overlapService.getJobStatus(requestId);
            
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
            res.status(500).json({
                error: 'Failed to get job status',
                message: error.message
            });
        }
    }

    /**
     * Test overlap detection with sample files
     */
    async testOverlapDetection(req, res) {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            const options = {
                algorithm: req.body.algorithm || 'frequency_domain',
                testMode: true,
                sampleCount: parseInt(req.body.sampleCount) || 2
            };

            // Generate mock results for testing
            const mockResults = {
                overlaps: [
                    {
                        file1Index: 0,
                        file2Index: 1,
                        file1Name: 'sample1.mp3',
                        file2Name: 'sample2.mp3',
                        start: 5.2,
                        duration: 2.1,
                        confidence: 0.85,
                        severity: 'medium',
                        method: options.algorithm
                    }
                ],
                totalOverlaps: 1,
                overlapDuration: 2.1,
                severity: 'medium',
                confidence: 0.85,
                testMode: true
            };

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                requestId,
                processingTime: `${processingTime}ms`,
                testMode: true,
                detectionOptions: options,
                results: mockResults
            });

        } catch (error) {
            res.status(500).json({
                error: 'Test overlap detection failed',
                message: error.message,
                requestId,
                processingTime: `${Date.now() - startTime}ms`
            });
        }
    }
}

module.exports = OverlapController;