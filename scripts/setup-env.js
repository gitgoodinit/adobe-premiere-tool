const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupEnvironment() {
    console.log('⚙️ Audio Tools Pro - Environment Setup');
    console.log('=====================================');
    console.log('');
    console.log('This setup will configure your development environment for Feature 1:');
    console.log('• FFmpeg integration');
    console.log('• OpenAI Whisper API (optional)');
    console.log('• Google Cloud Speech-to-Text API (optional)');
    console.log('• Development settings');
    console.log('');
    
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('⚠️ .env file already exists');
        const overwrite = await askQuestion('Do you want to overwrite it? (y/N): ');
        
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled. Please review your existing .env file.');
            rl.close();
            return;
        }
    }
    
    console.log('🔧 Configuring environment variables...');
    console.log('');
    
    // Collect configuration
    const config = await collectConfiguration();
    
    // Generate .env file
    const envContent = generateEnvFile(config);
    
    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('');
    console.log('✅ Environment setup complete!');
    console.log(`📝 Configuration saved to: ${envPath}`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. npm install                    # Install dependencies');
    console.log('  2. npm run setup:ffmpeg          # Setup FFmpeg');
    console.log('  3. npm run dev                   # Start development');
    console.log('');
    console.log('🔑 API Key Setup (optional):');
    if (!config.openaiApiKey) {
        console.log('  • Get OpenAI API key: https://platform.openai.com/api-keys');
    }
    if (!config.googleApiToken) {
        console.log('  • Get Google Cloud API key: https://console.cloud.google.com/');
    }
    
    rl.close();
}

async function collectConfiguration() {
    const config = {};
    
    // Development Environment
    console.log('📋 Development Settings:');
    config.nodeEnv = await askQuestion('Environment (development/production) [development]: ') || 'development';
    config.debugMode = await askQuestion('Enable debug mode? (y/N) [y]: ') || 'y';
    config.logLevel = await askQuestion('Log level (debug/info/warn/error) [info]: ') || 'info';
    console.log('');
    
    // FFmpeg Configuration
    console.log('🎬 FFmpeg Settings:');
    config.enableFFmpeg = await askQuestion('Enable FFmpeg detection? (Y/n) [Y]: ') || 'Y';
    if (config.enableFFmpeg.toLowerCase() !== 'n') {
        config.ffmpegPath = await askQuestion('FFmpeg path (auto-detect) [auto]: ') || 'auto';
        config.ffmpegTimeout = await askQuestion('FFmpeg timeout (seconds) [30]: ') || '30';
    }
    console.log('');
    
    // Web Audio API
    console.log('🌊 Web Audio API:');
    config.enableWebAudio = await askQuestion('Enable Web Audio API detection? (Y/n) [Y]: ') || 'Y';
    console.log('');
    
    // AI Transcript Services
    console.log('🤖 AI Transcript Services (Optional):');
    console.log('Note: These are optional but provide advanced silence detection');
    console.log('');
    
    config.enableTranscriptAI = await askQuestion('Enable AI transcript detection? (y/N) [N]: ') || 'N';
    
    if (config.enableTranscriptAI.toLowerCase() === 'y') {
        console.log('');
        console.log('Choose your preferred AI service:');
        console.log('1. OpenAI Whisper (recommended)');
        console.log('2. Google Cloud Speech-to-Text');
        console.log('3. Both (for best accuracy)');
        
        const aiChoice = await askQuestion('Select option (1/2/3) [1]: ') || '1';
        
        if (aiChoice === '1' || aiChoice === '3') {
            console.log('');
            console.log('🔑 OpenAI Whisper API:');
            console.log('Get your API key from: https://platform.openai.com/api-keys');
            config.openaiApiKey = await askQuestion('OpenAI API Key (optional): ');
        }
        
        if (aiChoice === '2' || aiChoice === '3') {
            console.log('');
            console.log('🔑 Google Cloud Speech-to-Text API:');
            console.log('Get your API key from: https://console.cloud.google.com/');
            config.googleApiToken = await askQuestion('Google API Token (optional): ');
        }
    }
    
    console.log('');
    
    // Feature Flags
    console.log('🏳️ Feature Flags:');
    config.mockMode = config.nodeEnv === 'development' ? 
        await askQuestion('Enable mock mode for testing? (Y/n) [Y]: ') || 'Y' : 'N';
    
    return config;
}

function generateEnvFile(config) {
    const timestamp = new Date().toISOString();
    
    return `# Audio Tools Pro - Environment Configuration
# Generated on: ${timestamp}
# 
# This file contains your development environment settings.
# DO NOT commit this file to version control if it contains API keys!

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================

NODE_ENV=${config.nodeEnv}
DEBUG_MODE=${config.debugMode.toLowerCase() === 'y' ? 'true' : 'false'}
LOG_LEVEL=${config.logLevel}

# =============================================================================
# FFMPEG CONFIGURATION
# =============================================================================

ENABLE_FFMPEG=${config.enableFFmpeg?.toLowerCase() !== 'n' ? 'true' : 'false'}
FFMPEG_PATH=${config.ffmpegPath || 'auto'}
FFMPEG_TIMEOUT=${(config.ffmpegTimeout || '30') * 1000}

# FFmpeg Detection Settings
FFMPEG_NOISE_THRESHOLD=-30
FFMPEG_MIN_DURATION=0.5
FFMPEG_VERBOSE=false

# =============================================================================
# WEB AUDIO API
# =============================================================================

ENABLE_WEB_AUDIO=${config.enableWebAudio?.toLowerCase() !== 'n' ? 'true' : 'false'}
WEB_AUDIO_FFT_SIZE=2048
WEB_AUDIO_SMOOTHING=0.8
WEB_AUDIO_THRESHOLD=0.01

# =============================================================================
# AI TRANSCRIPT SERVICES (Optional)
# =============================================================================

ENABLE_TRANSCRIPT_AI=${config.enableTranscriptAI?.toLowerCase() === 'y' ? 'true' : 'false'}

# OpenAI Whisper API
${config.openaiApiKey ? `OPENAI_API_KEY=${config.openaiApiKey}` : '# OPENAI_API_KEY=your_openai_api_key_here'}
WHISPER_MODEL=whisper-1
WHISPER_RESPONSE_FORMAT=verbose_json
WHISPER_TEMPERATURE=0

# Google Cloud Speech-to-Text
${config.googleApiToken ? `GOOGLE_API_TOKEN=${config.googleApiToken}` : '# GOOGLE_API_TOKEN=your_google_api_token_here'}
GOOGLE_STT_MODEL=latest_long
GOOGLE_STT_LANGUAGE=en-US
GOOGLE_STT_SAMPLE_RATE=48000

# =============================================================================
# FEATURE FLAGS
# =============================================================================

# Mock Mode (for testing without real audio processing)
ENABLE_MOCK_MODE=${config.mockMode?.toLowerCase() === 'y' ? 'true' : 'false'}

# Feature toggles
FEATURE_1_ENABLED=true
FEATURE_2_ENABLED=false
FEATURE_3_ENABLED=false
FEATURE_4_ENABLED=false
FEATURE_5_ENABLED=false

# =============================================================================
# PREMIERE PRO INTEGRATION
# =============================================================================

# CEP Configuration
CEP_DEBUG_MODE=${config.debugMode.toLowerCase() === 'y' ? 'true' : 'false'}
CEP_LOG_LEVEL=${config.logLevel}

# ExtendScript Settings
EXTENDSCRIPT_TIMEOUT=10000
EXTENDSCRIPT_RETRY_COUNT=3

# =============================================================================
# PERFORMANCE SETTINGS
# =============================================================================

# Processing limits
MAX_AUDIO_DURATION=3600  # seconds (1 hour)
MAX_FILE_SIZE=100        # MB
PROCESSING_TIMEOUT=300   # seconds (5 minutes)

# Memory management
AUDIO_BUFFER_SIZE=4096
MAX_CONCURRENT_OPERATIONS=3

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# API rate limiting
API_RATE_LIMIT=10        # requests per minute
API_RETRY_DELAY=1000     # milliseconds

# File validation
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,flac,ogg
MAX_UPLOAD_SIZE=50       # MB

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================

# Development server
DEV_SERVER_PORT=3000
DEV_SERVER_HOST=localhost
HOT_RELOAD=true

# Testing
MOCK_API_RESPONSES=${config.mockMode?.toLowerCase() === 'y' ? 'true' : 'false'}
MOCK_FFMPEG_OUTPUT=${config.mockMode?.toLowerCase() === 'y' ? 'true' : 'false'}
TEST_AUDIO_DURATION=60   # seconds

# Debug options
DEBUG_FFMPEG_COMMANDS=false
DEBUG_API_REQUESTS=false
DEBUG_EXTENDSCRIPT=false
VERBOSE_LOGGING=${config.debugMode.toLowerCase() === 'y' ? 'true' : 'false'}

# =============================================================================
# ADVANCED SETTINGS
# =============================================================================

# Silence detection algorithms
SILENCE_DETECTION_METHODS=ffmpeg,webAudio${config.enableTranscriptAI?.toLowerCase() === 'y' ? ',transcript' : ''}
PRIMARY_DETECTION_METHOD=ffmpeg
CONFIDENCE_THRESHOLD=0.7
CONSENSUS_REQUIRED=2

# Non-destructive editing
DEFAULT_TRIMMING_METHOD=adjustmentLayers
PRESERVE_ORIGINAL=true
FADE_TRANSITION_DURATION=0.1
MIN_GAP_DURATION=0.3

# Workflow settings
AUTO_APPLY_TRIMS=false
PREVIEW_MODE=true
AUTO_SAVE=true
CREATE_BACKUP=true

# =============================================================================
# END OF CONFIGURATION
# =============================================================================
`;
}

// Check for required Node.js version
function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        console.log('❌ Node.js 16+ is required');
        console.log(`Current version: ${nodeVersion}`);
        console.log('Please upgrade Node.js: https://nodejs.org/');
        process.exit(1);
    }
}

// Create additional configuration files
function createAdditionalConfigs() {
    const projectRoot = path.join(__dirname, '..');
    
    // Create .env.example for documentation
    const envExamplePath = path.join(projectRoot, '.env.example');
    const envExample = `# Audio Tools Pro - Environment Configuration Template
# Copy this file to .env and configure your settings

# Development Settings
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=info

# FFmpeg Configuration
ENABLE_FFMPEG=true
FFMPEG_PATH=auto
FFMPEG_TIMEOUT=30000

# AI Services (Optional)
# OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_API_TOKEN=your_google_api_token_here

# Feature Flags
ENABLE_MOCK_MODE=true
FEATURE_1_ENABLED=true
`;
    
    if (!fs.existsSync(envExamplePath)) {
        fs.writeFileSync(envExamplePath, envExample);
        console.log('📝 Created .env.example template');
    }
    
    // Create .gitignore entries
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const gitignoreEntries = `
# Audio Tools Pro - Environment files
.env
.env.local
.env.development
.env.production

# FFmpeg binaries (if bundled)
bin/ffmpeg*
bin/ffprobe*

# Logs
logs/
*.log

# Temporary files
temp/
tmp/
*.tmp

# API keys and secrets
secrets/
keys/

# Build artifacts
dist/
build/

# Node modules
node_modules/

# OS files
.DS_Store
Thumbs.db
`;
    
    if (fs.existsSync(gitignorePath)) {
        const existingContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!existingContent.includes('Audio Tools Pro')) {
            fs.appendFileSync(gitignorePath, gitignoreEntries);
            console.log('📝 Updated .gitignore');
        }
    } else {
        fs.writeFileSync(gitignorePath, gitignoreEntries);
        console.log('📝 Created .gitignore');
    }
}

// Main execution
if (require.main === module) {
    checkNodeVersion();
    
    setupEnvironment()
        .then(() => {
            createAdditionalConfigs();
        })
        .catch((error) => {
            console.error('❌ Environment setup failed:', error.message);
            rl.close();
            process.exit(1);
        });
}

module.exports = {
    setupEnvironment,
    collectConfiguration,
    generateEnvFile
}; 