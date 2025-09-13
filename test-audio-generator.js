/**
 * Audio Test File Generator for Multi-Track Overlap Detection Testing
 * Creates synthetic audio files with known overlaps for testing purposes
 */

class AudioTestGenerator {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            this.isInitialized = true;
            console.log('🎵 Audio Test Generator initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
        }
    }

    /**
     * Generate a synthetic audio buffer with specified parameters
     */
    generateSyntheticAudio(duration, frequency, amplitude = 0.3, type = 'sine') {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const audioBuffer = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                let sample = 0;

                switch (type) {
                    case 'sine':
                        sample = Math.sin(2 * Math.PI * frequency * time);
                        break;
                    case 'square':
                        sample = Math.sign(Math.sin(2 * Math.PI * frequency * time));
                        break;
                    case 'sawtooth':
                        sample = 2 * (time * frequency - Math.floor(time * frequency + 0.5));
                        break;
                    case 'noise':
                        sample = (Math.random() * 2 - 1);
                        break;
                    case 'speech':
                        // Simulate speech patterns with varying frequency
                        const baseFreq = frequency + Math.sin(time * 3) * 50;
                        sample = Math.sin(2 * Math.PI * baseFreq * time) * 
                                (0.5 + 0.5 * Math.sin(time * 8)); // Amplitude modulation
                        break;
                }

                channelData[i] = sample * amplitude;
            }
        }

        return audioBuffer;
    }

    /**
     * Generate audio with silence periods
     */
    generateAudioWithSilence(totalDuration, silenceIntervals) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * totalDuration;
        const audioBuffer = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                let sample = 0;

                // Check if current time is in a silence interval
                const isInSilence = silenceIntervals.some(interval => 
                    time >= interval.start && time <= interval.end
                );

                if (!isInSilence) {
                    // Generate speech-like audio
                    const frequency = 200 + Math.sin(time * 2) * 100;
                    sample = Math.sin(2 * Math.PI * frequency * time) * 
                            (0.3 + 0.2 * Math.sin(time * 5));
                }

                channelData[i] = sample;
            }
        }

        return audioBuffer;
    }

    /**
     * Create test audio files for overlap detection
     */
    async createTestAudioFiles() {
        await this.initialize();
        
        const testFiles = {};

        console.log('🎵 Generating test audio files...');

        // Test File 1: Speech simulation (0-8 seconds, active 1-7s)
        testFiles.speech1 = this.generateAudioWithSilence(8, [
            { start: 0, end: 1 },    // Silence at start
            { start: 7, end: 8 }     // Silence at end
        ]);

        // Test File 2: Speech simulation (0-10 seconds, active 3-9s)
        testFiles.speech2 = this.generateSyntheticAudio(10, 300, 0.4, 'speech');

        // Test File 3: Background music (0-12 seconds)
        testFiles.music = this.generateSyntheticAudio(12, 440, 0.2, 'sine');

        // Test File 4: Ambient noise (0-15 seconds)
        testFiles.ambient = this.generateSyntheticAudio(15, 100, 0.1, 'noise');

        // Test File 5: Intermittent speech (with planned overlaps)
        testFiles.intermittent = this.generateAudioWithSilence(10, [
            { start: 0, end: 2 },    // Silence
            { start: 4, end: 5 },    // Silence
            { start: 8, end: 10 }    // Silence
        ]);

        console.log('✅ Generated test audio files:', Object.keys(testFiles));
        return testFiles;
    }

    /**
     * Convert AudioBuffer to downloadable blob
     */
    audioBufferToWav(audioBuffer) {
        const length = audioBuffer.length;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const bytesPerSample = 2;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const bufferSize = 44 + dataSize;

        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bytesPerSample * 8, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // Audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Download test files
     */
    async downloadTestFiles() {
        const testFiles = await this.createTestAudioFiles();
        
        console.log('💾 Preparing test files for download...');

        for (const [name, audioBuffer] of Object.entries(testFiles)) {
            const blob = this.audioBufferToWav(audioBuffer);
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `test_${name}.wav`;
            link.textContent = `Download ${name}`;
            link.style.display = 'block';
            link.style.margin = '5px';
            
            document.body.appendChild(link);
            
            // Auto-download
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 1000);
        }

        console.log('✅ Test files generated and downloaded');
    }

    /**
     * Get expected overlap results for testing validation
     */
    getExpectedResults() {
        return {
            speech1_vs_speech2: {
                expectedOverlaps: [
                    { startTime: 3, endTime: 7, description: "Both speech tracks active" }
                ],
                expectedDeadSpaces: [
                    { startTime: 0, endTime: 1, description: "Both tracks silent at start" },
                    { startTime: 7, endTime: 8, description: "Speech1 ends, Speech2 continues" }
                ]
            },
            speech1_vs_music: {
                expectedOverlaps: [
                    { startTime: 1, endTime: 7, description: "Speech over background music" }
                ],
                expectedDeadSpaces: [
                    { startTime: 0, endTime: 1, description: "Speech1 silent, music playing" }
                ]
            },
            intermittent_vs_speech2: {
                expectedOverlaps: [
                    { startTime: 2, endTime: 4, description: "Both active simultaneously" },
                    { startTime: 5, endTime: 8, description: "Both active simultaneously" }
                ],
                expectedDeadSpaces: [
                    { startTime: 0, endTime: 2, description: "Intermittent silent" },
                    { startTime: 4, endTime: 5, description: "Intermittent silent" }
                ]
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioTestGenerator;
} else {
    window.AudioTestGenerator = AudioTestGenerator;
}
