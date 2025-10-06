/**
 * Silence Detection Core Logic
 * Pure audio processing algorithms for silence detection
 */

const ffmpeg = require('fluent-ffmpeg');

class SilenceCore {
    /**
     * Detect silence using FFmpeg silence detection filter
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Detection options
     * @returns {Promise<Array>} Array of silence segments
     */
    static async detectWithFFmpeg(filePath, options = {}) {
        const {
            noiseThreshold = -30,
            minDuration = 0.5
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

    /**
     * Simulate Web Audio API silence detection
     * @param {Object} audioInfo - Audio file information
     * @param {Object} options - Detection options
     * @returns {Array} Array of mock silence segments
     */
    static detectWithWebAudio(audioInfo, options = {}) {
        const duration = audioInfo.duration;
        const segments = [];
        let currentTime = 0;
        
        while (currentTime < duration) {
            const segmentDuration = Math.random() * 3 + 0.5; // 0.5-3.5 seconds
            if (currentTime + segmentDuration < duration) {
                segments.push({
                    start: currentTime,
                    end: currentTime + segmentDuration,
                    duration: segmentDuration,
                    method: 'webAudio',
                    confidence: 0.8
                });
            }
            currentTime += segmentDuration + Math.random() * 5 + 2; // 2-7 seconds between segments
        }

        return segments;
    }

    /**
     * Simulate AI/Transcript-based silence detection
     * @param {Object} audioInfo - Audio file information
     * @param {Object} options - Detection options
     * @returns {Array} Array of mock transcript-based silence segments
     */
    static detectWithTranscript(audioInfo, options = {}) {
        const duration = audioInfo.duration;
        const segments = [];
        let currentTime = 0;
        
        while (currentTime < duration) {
            const segmentDuration = Math.random() * 2 + 0.3; // 0.3-2.3 seconds
            if (currentTime + segmentDuration < duration) {
                segments.push({
                    start: currentTime,
                    end: currentTime + segmentDuration,
                    duration: segmentDuration,
                    method: 'transcript',
                    confidence: 0.95
                });
            }
            currentTime += segmentDuration + Math.random() * 4 + 1; // 1-5 seconds between segments
        }

        return segments;
    }

    /**
     * Trim silence from audio file using FFmpeg
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Trimming options
     * @returns {Promise<Object>} Trimming results
     */
    static async trimSilence(inputPath, outputPath, options = {}) {
        const {
            silenceSegments = [],
            trimMode = 'remove',
            fadeInDuration = 0.1,
            fadeOutDuration = 0.1
        } = options;

        return new Promise((resolve, reject) => {
            if (trimMode === 'remove' && silenceSegments.length > 0) {
                // Create audio segments by removing silence
                const sortedSegments = [...silenceSegments].sort((a, b) => a.start - b.start);
                
                const audioSegments = [];
                let lastEnd = 0;
                
                sortedSegments.forEach(silence => {
                    if (silence.start > lastEnd) {
                        audioSegments.push({
                            start: lastEnd,
                            end: silence.start
                        });
                    }
                    lastEnd = silence.end || silence.start + silence.duration;
                });
                
                if (audioSegments.length === 0) {
                    // No audio segments to keep, create minimal output
                    const command = ffmpeg(inputPath)
                        .audioFilters('volume=0')
                        .duration(0.1)
                        .output(outputPath)
                        .on('end', () => {
                            resolve({
                                outputPath,
                                segmentsProcessed: silenceSegments.length,
                                trimMode,
                                audioSegments: 0
                            });
                        })
                        .on('error', (err) => {
                            reject(new Error(`Silence trimming failed: ${err.message}`));
                        });
                    
                    command.run();
                    return;
                }
                
                // Use complex filter to concatenate audio segments
                const filters = [];
                const inputs = [];
                
                audioSegments.forEach((segment, index) => {
                    filters.push(`[0:a]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[a${index}]`);
                    inputs.push(`[a${index}]`);
                });
                
                if (audioSegments.length > 1) {
                    filters.push(`${inputs.join('')}concat=n=${audioSegments.length}:v=0:a=1[out]`);
                } else {
                    filters.push(`[a0]anull[out]`);
                }
                
                const command = ffmpeg(inputPath)
                    .complexFilter(filters)
                    .outputOptions(['-map', '[out]'])
                    .output(outputPath)
                    .on('end', () => {
                        resolve({
                            outputPath,
                            segmentsProcessed: silenceSegments.length,
                            trimMode,
                            audioSegments: audioSegments.length
                        });
                    })
                    .on('error', (err) => {
                        reject(new Error(`Silence trimming failed: ${err.message}`));
                    });
                
                command.run();
                
            } else if (trimMode === 'fade') {
                // Apply fade in/out to silence segments
                let filterString = '[0:a]';
                
                silenceSegments.forEach((segment, index) => {
                    const fadeIn = `afade=t=in:st=${segment.start}:d=${fadeInDuration}`;
                    const fadeOut = segment.end ? `,afade=t=out:st=${segment.end - fadeOutDuration}:d=${fadeOutDuration}` : '';
                    filterString += fadeIn + fadeOut;
                    if (index < silenceSegments.length - 1) {
                        filterString += ',';
                    }
                });
                
                filterString += '[out]';
                
                const command = ffmpeg(inputPath)
                    .complexFilter([filterString])
                    .outputOptions(['-map', '[out]'])
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
                    });
                
                command.run();
                
            } else {
                // No trimming needed, just copy
                const command = ffmpeg(inputPath)
                    .output(outputPath)
                    .on('end', () => {
                        resolve({
                            outputPath,
                            segmentsProcessed: 0,
                            trimMode
                        });
                    })
                    .on('error', (err) => {
                        reject(new Error(`Silence trimming failed: ${err.message}`));
                    });
                
                command.run();
            }
        });
    }

    /**
     * Merge overlapping silence segments
     * @param {Array} segments - Array of silence segments
     * @returns {Array} Merged segments
     */
    static mergeOverlappingSegments(segments) {
        if (segments.length === 0) return [];

        const sorted = segments.sort((a, b) => a.start - b.start);
        const merged = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];

            if (current.start <= last.end) {
                // Overlapping segments, merge them
                last.end = Math.max(last.end, current.end);
                last.duration = last.end - last.start;
                last.confidence = Math.max(last.confidence, current.confidence);
            } else {
                merged.push(current);
            }
        }

        return merged;
    }

    /**
     * Calculate confidence score for silence detection results
     * @param {Array} segments - Silence segments
     * @param {Array} methods - Detection methods used
     * @returns {number} Confidence score (0-1)
     */
    static calculateConfidence(segments, methods) {
        if (segments.length === 0) return 0;

        const methodWeights = {
            ffmpeg: 0.4,
            webAudio: 0.3,
            transcript: 0.3
        };

        let totalWeight = 0;
        let weightedConfidence = 0;

        methods.forEach(method => {
            const weight = methodWeights[method] || 0;
            totalWeight += weight;
        });

        if (totalWeight === 0) return 0.5;

        segments.forEach(segment => {
            const methodWeight = methodWeights[segment.method] || 0;
            weightedConfidence += segment.confidence * methodWeight;
        });

        return weightedConfidence / totalWeight;
    }
}

module.exports = SilenceCore;