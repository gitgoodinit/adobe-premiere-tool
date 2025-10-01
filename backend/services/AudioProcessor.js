/**
 * Audio Processor Service
 * Core audio processing functionality using FFmpeg and Web Audio API
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Logger = require('./Logger');

class AudioProcessor {
    constructor() {
        this.logger = new Logger();
        this.isInitialized = false;
        this.ffmpegPath = null;
    }

    async initialize() {
        try {
            this.logger.info('Initializing Audio Processor...');
            
            // Set FFmpeg path based on platform
            this.ffmpegPath = this.getFFmpegPath();
            if (this.ffmpegPath) {
                ffmpeg.setFfmpegPath(this.ffmpegPath);
                this.logger.info(`FFmpeg path set to: ${this.ffmpegPath}`);
            }

            // Test FFmpeg availability
            await this.testFFmpeg();
            
            this.isInitialized = true;
            this.logger.info('Audio Processor initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Audio Processor:', error);
            throw error;
        }
    }

    getFFmpegPath() {
        const platform = process.platform;
        
        switch (platform) {
            case 'win32':
                return process.env.FFMPEG_PATH || './bin/ffmpeg.exe';
            case 'darwin':
                return process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg';
            case 'linux':
                return process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
            default:
                return process.env.FFMPEG_PATH || 'ffmpeg';
        }
    }

    async testFFmpeg() {
        return new Promise((resolve, reject) => {
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    this.logger.warn('FFmpeg not available, using fallback methods');
                    resolve(false);
                } else {
                    this.logger.info('FFmpeg is available and working');
                    resolve(true);
                }
            });
        });
    }

    async getAudioInfo(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(new Error(`Failed to get audio info: ${err.message}`));
                    return;
                }

                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                if (!audioStream) {
                    reject(new Error('No audio stream found in file'));
                    return;
                }

                resolve({
                    duration: parseFloat(metadata.format.duration),
                    sampleRate: parseInt(audioStream.sample_rate),
                    channels: parseInt(audioStream.channels),
                    bitRate: parseInt(metadata.format.bit_rate),
                    codec: audioStream.codec_name,
                    format: metadata.format.format_name,
                    size: parseInt(metadata.format.size)
                });
            });
        });
    }

    async detectSilence(filePath, options = {}) {
        const {
            noiseThreshold = -30,
            minDuration = 0.5,
            outputFormat = 'json'
        } = options;

        return new Promise((resolve, reject) => {
            const silenceSegments = [];
            let currentSilence = null;

            const command = ffmpeg(filePath)
                .audioFilters(`silencedetect=noise=${noiseThreshold}dB:d=${minDuration}`)
                .format('null')
                .output('-');

            command.on('stderr', (stderrLine) => {
                // Parse silence detection output
                const silenceStartMatch = stderrLine.match(/silence_start: ([\d.]+)/);
                const silenceEndMatch = stderrLine.match(/silence_end: ([\d.]+)/);

                if (silenceStartMatch) {
                    currentSilence = {
                        start: parseFloat(silenceStartMatch[1]),
                        end: null,
                        duration: null
                    };
                }

                if (silenceEndMatch && currentSilence) {
                    currentSilence.end = parseFloat(silenceEndMatch[1]);
                    currentSilence.duration = currentSilence.end - currentSilence.start;
                    silenceSegments.push({ ...currentSilence });
                    currentSilence = null;
                }
            });

            command.on('end', () => {
                // Handle case where silence continues to end of file
                if (currentSilence) {
                    currentSilence.end = null;
                    currentSilence.duration = null;
                    silenceSegments.push(currentSilence);
                }

                resolve(silenceSegments);
            });

            command.on('error', (err) => {
                reject(new Error(`Silence detection failed: ${err.message}`));
            });

            command.run();
        });
    }

    async trimSilence(inputPath, outputPath, options = {}) {
        const {
            silenceSegments = [],
            trimMode = 'remove',
            fadeInDuration = 0.1,
            fadeOutDuration = 0.1
        } = options;

        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);

            if (trimMode === 'remove') {
                // Remove silence segments
                const filters = [];
                silenceSegments.forEach((segment, index) => {
                    if (segment.start > 0) {
                        filters.push(`[0:a]atrim=start=0:end=${segment.start}[a${index * 2}]`);
                    }
                    if (segment.end) {
                        filters.push(`[0:a]atrim=start=${segment.end}[a${index * 2 + 1}]`);
                    }
                });
                
                if (filters.length > 0) {
                    command = command.complexFilter(filters);
                }
            } else if (trimMode === 'fade') {
                // Apply fade in/out to silence segments
                const filters = [];
                silenceSegments.forEach((segment, index) => {
                    filters.push(`[0:a]afade=t=in:st=${segment.start}:d=${fadeInDuration}[a${index}]`);
                    if (segment.end) {
                        filters.push(`[a${index}]afade=t=out:st=${segment.end - fadeOutDuration}:d=${fadeOutDuration}[a${index + 1}]`);
                    }
                });
                
                if (filters.length > 0) {
                    command = command.complexFilter(filters);
                }
            }

            command
                .output(outputPath)
                .on('end', () => {
                    resolve({
                        outputPath,
                        segmentsProcessed: silenceSegments.length,
                        trimMode
                    });
                })
                .on('error', (err) => {
                    reject(new Error(`Silence trimming failed: ${err.message}`));
                })
                .run();
        });
    }

    async analyzeAudioStats(filePath) {
        return new Promise((resolve, reject) => {
            const stats = {};

            const command = ffmpeg(filePath)
                .audioFilters('astats=metadata=1:reset=1')
                .format('null')
                .output('-');

            command.on('stderr', (stderrLine) => {
                // Parse audio statistics
                const peakMatch = stderrLine.match(/lavfi.astats.1.Peak_level: ([\d.-]+)/);
                const rmsMatch = stderrLine.match(/lavfi.astats.1.RMS_level: ([\d.-]+)/);
                const dcMatch = stderrLine.match(/lavfi.astats.1.DC_offset: ([\d.-]+)/);

                if (peakMatch) stats.peakLevel = parseFloat(peakMatch[1]);
                if (rmsMatch) stats.rmsLevel = parseFloat(rmsMatch[1]);
                if (dcMatch) stats.dcOffset = parseFloat(dcMatch[1]);
            });

            command.on('end', () => {
                resolve(stats);
            });

            command.on('error', (err) => {
                reject(new Error(`Audio analysis failed: ${err.message}`));
            });

            command.run();
        });
    }

    async convertFormat(inputPath, outputPath, options = {}) {
        const {
            format = 'mp3',
            bitrate = '192k',
            sampleRate = 44100,
            channels = 2,
            quality = 'high'
        } = options;

        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);

            // Set output format
            command = command.format(format);

            // Set audio codec and quality
            if (format === 'mp3') {
                const qualityMap = {
                    low: '5',
                    medium: '3',
                    high: '0'
                };
                command = command.audioCodec('libmp3lame')
                    .audioBitrate(bitrate)
                    .audioQuality(qualityMap[quality] || '3');
            } else if (format === 'wav') {
                command = command.audioCodec('pcm_s16le');
            } else if (format === 'm4a') {
                command = command.audioCodec('aac')
                    .audioBitrate(bitrate);
            }

            // Set audio parameters
            command = command.audioFrequency(sampleRate)
                .audioChannels(channels);

            command
                .output(outputPath)
                .on('end', () => {
                    resolve({
                        outputPath,
                        format,
                        bitrate,
                        sampleRate,
                        channels
                    });
                })
                .on('error', (err) => {
                    reject(new Error(`Format conversion failed: ${err.message}`));
                })
                .run();
        });
    }

    async applyTimeStretching(inputPath, outputPath, options = {}) {
        const {
            algorithm = 'phase_vocoder',
            stretchRatio = 1.0,
            pitchPreservation = true
        } = options;

        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);

            if (algorithm === 'phase_vocoder') {
                // Use atempo filter for time stretching
                const tempo = 1.0 / stretchRatio;
                command = command.audioFilters(`atempo=${tempo}`);
            } else if (algorithm === 'granular') {
                // Use rubberband filter for granular synthesis
                command = command.audioFilters(`rubberband=tempo=${stretchRatio}`);
            }

            command
                .output(outputPath)
                .on('end', () => {
                    resolve({
                        outputPath,
                        algorithm,
                        stretchRatio,
                        pitchPreservation
                    });
                })
                .on('error', (err) => {
                    reject(new Error(`Time stretching failed: ${err.message}`));
                })
                .run();
        });
    }

    async cleanup() {
        this.logger.info('Cleaning up Audio Processor...');
        this.isInitialized = false;
    }

    // Utility methods
    generateTempPath(extension = '.tmp') {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        return path.join(tempDir, `${uuidv4()}${extension}`);
    }

    async deleteTempFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.debug(`Deleted temp file: ${filePath}`);
            }
        } catch (error) {
            this.logger.error(`Failed to delete temp file: ${filePath}`, error);
        }
    }

    getSupportedFormats() {
        return {
            input: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'],
            output: ['mp3', 'wav', 'm4a', 'ogg'],
            codecs: {
                mp3: 'libmp3lame',
                wav: 'pcm_s16le',
                m4a: 'aac',
                ogg: 'libvorbis'
            }
        };
    }
}

module.exports = AudioProcessor;
