/**
 * Silence Detection & Trimming - Feature 1 Implementation
 * Supports FFmpeg, Web Audio API, and AI-based detection methods
 */

class SilenceDetector {
    constructor(audioToolsPro) {
        this.app = audioToolsPro;
        this.audioContext = null;
        this.audioBuffer = null;
        this.analysisResults = {
            ffmpeg: [],
            webAudio: [],
            transcript: [],
            combined: []
        };
        
        this.config = {
            ffmpeg: {
                noiseThreshold: -30, // dB
                minDuration: 0.5,    // seconds
                executable: this.getFFmpegPath()
            },
            webAudio: {
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                silenceThreshold: 0.01,
                minDuration: 0.5
            },
            transcript: {
                provider: 'whisper', // 'whisper' or 'google'
                confidenceThreshold: 0.8,
                pauseDetection: true
            }
        };
        
        this.initializeAudioContext();
    }

    // ========================================
    // MAIN DETECTION ORCHESTRATOR
    // ========================================

    async detectSilence(audioFile, options = {}) {
        const detectionMethods = options.methods || ['ffmpeg', 'webAudio', 'transcript'];
        const startTime = Date.now();
        
        this.app.log('🔍 Starting multi-method silence detection...', 'info');
        this.app.updateStatus('Analyzing Audio...', 'processing');
        
        try {
            const results = {};
            
            // Run detection methods in parallel for efficiency
            const promises = [];
            
            if (detectionMethods.includes('ffmpeg')) {
                promises.push(this.detectWithFFmpeg(audioFile).then(r => results.ffmpeg = r));
            }
            
            if (detectionMethods.includes('webAudio')) {
                promises.push(this.detectWithWebAudio(audioFile).then(r => results.webAudio = r));
            }
            
            if (detectionMethods.includes('transcript')) {
                promises.push(this.detectWithTranscript(audioFile).then(r => results.transcript = r));
            }
            
            await Promise.all(promises);
            
            // Combine and validate results
            const combinedResults = this.combineDetectionResults(results);
            this.analysisResults = { ...results, combined: combinedResults };
            
            const duration = (Date.now() - startTime) / 1000;
            this.app.log(`✅ Silence detection completed in ${duration.toFixed(2)}s`, 'success');
            this.app.log(`📊 Found ${combinedResults.length} silence segments`, 'info');
            
            return {
                success: true,
                results: this.analysisResults,
                metadata: {
                    duration,
                    methods: detectionMethods,
                    audioFile: audioFile.name || audioFile
                }
            };
            
        } catch (error) {
            this.app.log(`❌ Silence detection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========================================
    // FFMPEG DETECTION (Primary Method)
    // ========================================

    async detectWithFFmpeg(audioFile) {
        this.app.log('🎬 Starting FFmpeg silence detection...', 'info');
        this.app.updateProgressBar(10, 'Running FFmpeg analysis...');
        
        try {
            const ffmpegCommand = this.buildFFmpegCommand(audioFile);
            const result = await this.executeFFmpeg(ffmpegCommand);
            const silenceSegments = this.parseFFmpegOutput(result.stdout);
            
            this.app.log(`🎬 FFmpeg detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ FFmpeg detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    buildFFmpegCommand(audioFile) {
        const { noiseThreshold, minDuration } = this.config.ffmpeg;
        
        return [
            this.config.ffmpeg.executable,
            '-i', audioFile,
            '-af', `silencedetect=noise=${noiseThreshold}dB:d=${minDuration}`,
            '-f', 'null',
            '-'
        ];
    }

    async executeFFmpeg(command) {
        // Node.js integration for CEP
        const { spawn } = require('child_process');
        
        return new Promise((resolve, reject) => {
            const process = spawn(command[0], command.slice(1));
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
                // FFmpeg outputs to stderr, extract progress if needed
                this.parseFFmpegProgress(data.toString());
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`FFmpeg execution failed: ${error.message}`));
            });
        });
    }

    parseFFmpegOutput(output) {
        const silenceRegex = /\[silencedetect.*?\] silence_start: ([\d.]+)/g;
        const silenceEndRegex = /\[silencedetect.*?\] silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g;
        
        const segments = [];
        let match;
        let currentStart = null;
        
        // Parse silence_start entries
        const starts = [];
        while ((match = silenceRegex.exec(output)) !== null) {
            starts.push(parseFloat(match[1]));
        }
        
        // Parse silence_end entries
        const ends = [];
        while ((match = silenceEndRegex.exec(output)) !== null) {
            ends.push({
                end: parseFloat(match[1]),
                duration: parseFloat(match[2])
            });
        }
        
        // Match starts with ends
        for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
            segments.push({
                start: starts[i],
                end: ends[i].end,
                duration: ends[i].duration,
                confidence: 0.95, // FFmpeg is highly reliable
                method: 'ffmpeg',
                threshold: this.config.ffmpeg.noiseThreshold
            });
        }
        
        return segments;
    }

    parseFFmpegProgress(stderr) {
        // Extract progress from FFmpeg stderr for progress bar updates
        const timeMatch = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            
            // Update progress bar based on estimated total duration
            // This would need the actual audio duration for accurate percentage
            this.app.updateProgressBar(30, `FFmpeg processing: ${timeMatch[0]}`);
        }
    }

    // ========================================
    // WEB AUDIO API DETECTION (Secondary Method)
    // ========================================

    async detectWithWebAudio(audioFile) {
        this.app.log('🌊 Starting Web Audio API analysis...', 'info');
        this.app.updateProgressBar(40, 'Analyzing waveform...');
        
        try {
            const audioBuffer = await this.loadAudioBuffer(audioFile);
            const silenceSegments = this.analyzeAudioBuffer(audioBuffer);
            
            this.app.log(`🌊 Web Audio API detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ Web Audio API detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    async loadAudioBuffer(audioFile) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        // Load audio file as ArrayBuffer
        const arrayBuffer = await this.fileToArrayBuffer(audioFile);
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.audioBuffer = audioBuffer;
        return audioBuffer;
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read audio file'));
            reader.readAsArrayBuffer(file);
        });
    }

    analyzeAudioBuffer(audioBuffer) {
        const { silenceThreshold, minDuration } = this.config.webAudio;
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const minSamples = Math.floor(minDuration * sampleRate);
        
        const silenceSegments = [];
        let silenceStart = null;
        let consecutiveSilentSamples = 0;
        
        // Analyze audio samples for silence
        for (let i = 0; i < channelData.length; i++) {
            const amplitude = Math.abs(channelData[i]);
            const timePosition = i / sampleRate;
            
            if (amplitude < silenceThreshold) {
                // Silent sample
                if (silenceStart === null) {
                    silenceStart = timePosition;
                }
                consecutiveSilentSamples++;
            } else {
                // Non-silent sample
                if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
                    // End of a silence segment that meets minimum duration
                    silenceSegments.push({
                        start: silenceStart,
                        end: timePosition,
                        duration: timePosition - silenceStart,
                        confidence: this.calculateWebAudioConfidence(consecutiveSilentSamples, minSamples),
                        method: 'webAudio',
                        threshold: silenceThreshold
                    });
                }
                
                silenceStart = null;
                consecutiveSilentSamples = 0;
            }
            
            // Update progress periodically
            if (i % Math.floor(channelData.length / 20) === 0) {
                const progress = 40 + (i / channelData.length) * 20; // 40-60% range
                this.app.updateProgressBar(progress, `Analyzing samples: ${(i / channelData.length * 100).toFixed(1)}%`);
            }
        }
        
        // Handle silence at the end of the audio
        if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
            silenceSegments.push({
                start: silenceStart,
                end: channelData.length / sampleRate,
                duration: (channelData.length / sampleRate) - silenceStart,
                confidence: this.calculateWebAudioConfidence(consecutiveSilentSamples, minSamples),
                method: 'webAudio',
                threshold: silenceThreshold
            });
        }
        
        return silenceSegments;
    }

    calculateWebAudioConfidence(silentSamples, minSamples) {
        // Higher confidence for longer silence segments
        const ratio = silentSamples / minSamples;
        return Math.min(0.5 + (ratio - 1) * 0.3, 0.9); // 0.5-0.9 range
    }

    // ========================================
    // TRANSCRIPT-BASED DETECTION (AI Method)
    // ========================================

    async detectWithTranscript(audioFile) {
        this.app.log('🤖 Starting AI transcript-based detection...', 'info');
        this.app.updateProgressBar(60, 'Generating transcript...');
        
        try {
            const provider = this.config.transcript.provider;
            let transcript;
            
            if (provider === 'whisper') {
                transcript = await this.transcribeWithWhisper(audioFile);
            } else if (provider === 'google') {
                transcript = await this.transcribeWithGoogle(audioFile);
            } else {
                throw new Error(`Unsupported transcript provider: ${provider}`);
            }
            
            const silenceSegments = this.extractSilenceFromTranscript(transcript);
            
            this.app.log(`🤖 AI detected ${silenceSegments.length} silence segments`, 'success');
            return silenceSegments;
            
        } catch (error) {
            this.app.log(`❌ AI transcript detection failed: ${error.message}`, 'error');
            return [];
        }
    }

    async transcribeWithWhisper(audioFile) {
        this.app.log('🗣️ Sending audio to OpenAI Whisper...', 'info');
        
        // Convert audio file to supported format if needed
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'word');
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getOpenAIKey()}`,
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return this.processWhisperResponse(result);
    }

    async transcribeWithGoogle(audioFile) {
        this.app.log('🗣️ Sending audio to Google Speech-to-Text...', 'info');
        
        // Convert audio to base64 for Google API
        const audioBase64 = await this.audioFileToBase64(audioFile);
        
        const requestBody = {
            config: {
                encoding: 'WEBM_OPUS', // Adjust based on audio format
                sampleRateHertz: 48000,
                languageCode: 'en-US',
                enableWordTimeOffsets: true,
                enableAutomaticPunctuation: true,
                model: 'latest_long'
            },
            audio: {
                content: audioBase64
            }
        };
        
        const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getGoogleToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Google STT API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return this.processGoogleResponse(result);
    }

    processWhisperResponse(whisperResult) {
        // Process Whisper's word-level timestamps to identify silence
        const words = whisperResult.words || [];
        const segments = [];
        
        for (let i = 0; i < words.length - 1; i++) {
            const currentWord = words[i];
            const nextWord = words[i + 1];
            
            const gap = nextWord.start - currentWord.end;
            
            if (gap > this.config.transcript.minPauseDuration) {
                segments.push({
                    start: currentWord.end,
                    end: nextWord.start,
                    duration: gap,
                    confidence: Math.min(currentWord.confidence, nextWord.confidence),
                    method: 'whisper',
                    context: {
                        beforeWord: currentWord.word,
                        afterWord: nextWord.word
                    }
                });
            }
        }
        
        return segments;
    }

    processGoogleResponse(googleResult) {
        // Process Google's word-level timestamps
        const alternatives = googleResult.results?.[0]?.alternatives?.[0];
        if (!alternatives) return [];
        
        const words = alternatives.words || [];
        const segments = [];
        
        for (let i = 0; i < words.length - 1; i++) {
            const currentWord = words[i];
            const nextWord = words[i + 1];
            
            const currentEnd = this.parseGoogleTime(currentWord.endTime);
            const nextStart = this.parseGoogleTime(nextWord.startTime);
            const gap = nextStart - currentEnd;
            
            if (gap > this.config.transcript.minPauseDuration) {
                segments.push({
                    start: currentEnd,
                    end: nextStart,
                    duration: gap,
                    confidence: alternatives.confidence || 0.8,
                    method: 'google',
                    context: {
                        beforeWord: currentWord.word,
                        afterWord: nextWord.word
                    }
                });
            }
        }
        
        return segments;
    }

    parseGoogleTime(timeString) {
        // Convert Google's time format (e.g., "1.234s") to seconds
        return parseFloat(timeString.replace('s', ''));
    }

    // ========================================
    // RESULT COMBINATION & VALIDATION
    // ========================================

    combineDetectionResults(results) {
        this.app.log('🔄 Combining detection results...', 'info');
        
        const allSegments = [
            ...(results.ffmpeg || []),
            ...(results.webAudio || []),
            ...(results.transcript || [])
        ];
        
        if (allSegments.length === 0) {
            return [];
        }
        
        // Sort by start time
        allSegments.sort((a, b) => a.start - b.start);
        
        // Merge overlapping or very close segments
        const merged = this.mergeCloseSegments(allSegments);
        
        // Calculate consensus confidence
        const validated = merged.map(segment => ({
            ...segment,
            confidence: this.calculateConsensusConfidence(segment, allSegments),
            methods: this.getSegmentMethods(segment, allSegments)
        }));
        
        return validated;
    }

    mergeCloseSegments(segments, mergeThreshold = 0.2) {
        if (segments.length === 0) return [];
        
        const merged = [segments[0]];
        
        for (let i = 1; i < segments.length; i++) {
            const current = segments[i];
            const last = merged[merged.length - 1];
            
            // Check if segments are close enough to merge
            if (current.start - last.end <= mergeThreshold) {
                // Merge segments
                last.end = Math.max(last.end, current.end);
                last.duration = last.end - last.start;
                last.confidence = Math.max(last.confidence, current.confidence);
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    calculateConsensusConfidence(segment, allSegments) {
        // Find overlapping segments from different methods
        const overlapping = allSegments.filter(s => 
            s !== segment && 
            this.segmentsOverlap(segment, s)
        );
        
        if (overlapping.length === 0) {
            return segment.confidence * 0.8; // Lower confidence for single-method detection
        }
        
        // Average confidence weighted by overlap amount
        const confidences = [segment.confidence, ...overlapping.map(s => s.confidence)];
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    segmentsOverlap(seg1, seg2, overlapThreshold = 0.5) {
        const overlap = Math.max(0, Math.min(seg1.end, seg2.end) - Math.max(seg1.start, seg2.start));
        const minDuration = Math.min(seg1.duration, seg2.duration);
        return overlap / minDuration >= overlapThreshold;
    }

    getSegmentMethods(segment, allSegments) {
        const overlapping = allSegments.filter(s => this.segmentsOverlap(segment, s));
        const methods = [...new Set(overlapping.map(s => s.method))];
        return methods;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.app.log('🎵 Web Audio API context initialized', 'info');
            } else {
                this.app.log('⚠️ Web Audio API not supported', 'warning');
            }
        } catch (error) {
            this.app.log(`⚠️ Audio context initialization failed: ${error.message}`, 'warning');
        }
    }

    getFFmpegPath() {
        // Return appropriate FFmpeg path based on platform
        const os = require('os');
        const platform = os.platform();
        
        if (platform === 'win32') {
            return 'ffmpeg.exe'; // Assumes ffmpeg is in PATH or bundled
        } else {
            return '/usr/local/bin/ffmpeg'; // Common macOS/Linux path
        }
    }

    getOpenAIKey() {
        // Securely retrieve OpenAI API key
        return process.env.OPENAI_API_KEY || this.app.settings.openaiApiKey;
    }

    getGoogleToken() {
        // Securely retrieve Google API token
        return process.env.GOOGLE_API_TOKEN || this.app.settings.googleApiToken;
    }

    async audioFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Configuration methods
    updateConfig(section, updates) {
        if (this.config[section]) {
            Object.assign(this.config[section], updates);
            this.app.log(`⚙️ Updated ${section} configuration`, 'info');
        }
    }

    getConfig() {
        return { ...this.config };
    }
}

module.exports = SilenceDetector; 