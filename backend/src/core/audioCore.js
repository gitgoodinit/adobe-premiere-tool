/**
 * Audio Processing Core Logic
 * Pure audio processing algorithms and FFmpeg operations
 */

const ffmpeg = require('fluent-ffmpeg');

class AudioCore {
    /**
     * Get audio file information using FFprobe
     * @param {string} filePath - Path to audio file
     * @returns {Promise<Object>} Audio metadata
     */
    static async getAudioInfo(filePath) {
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

    /**
     * Analyze audio statistics using FFmpeg
     * @param {string} filePath - Path to audio file
     * @returns {Promise<Object>} Audio statistics
     */
    static async analyzeAudioStats(filePath) {
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

    /**
     * Convert audio format using FFmpeg
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} Conversion results
     */
    static async convertFormat(inputPath, outputPath, options = {}) {
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

    /**
     * Apply time stretching to audio using FFmpeg
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Stretching options
     * @returns {Promise<Object>} Stretching results
     */
    static async applyTimeStretching(inputPath, outputPath, options = {}) {
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

    /**
     * Test FFmpeg availability
     * @returns {Promise<boolean>} True if FFmpeg is available
     */
    static async testFFmpeg() {
        return new Promise((resolve) => {
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Get FFmpeg path based on platform
     * @returns {string} FFmpeg path
     */
    static getFFmpegPath() {
        const platform = process.platform;
        
        switch (platform) {
            case 'win32':
                return process.env.FFMPEG_PATH || '../bin/ffmpeg.exe';
            case 'darwin':
                return process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg';
            case 'linux':
                return process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
            default:
                return process.env.FFMPEG_PATH || 'ffmpeg';
        }
    }

    /**
     * Get supported audio formats
     * @returns {Object} Supported formats and codecs
     */
    static getSupportedFormats() {
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

module.exports = AudioCore;