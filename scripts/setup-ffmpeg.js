const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const binDir = path.join(__dirname, '..', 'bin');

// Ensure bin directory exists
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

async function setupFFmpeg() {
    console.log('🎬 Setting up FFmpeg for Audio Tools Pro...');
    console.log(`Platform detected: ${platform}`);
    
    try {
        // First, check if FFmpeg is already available in PATH
        const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' });
        console.log('✅ FFmpeg found in system PATH');
        console.log(`Version: ${ffmpegVersion.split('\n')[0]}`);
        
        // Create a symbolic link or copy reference for local use
        createLocalReference();
        
    } catch (error) {
        console.log('⚠️ FFmpeg not found in system PATH');
        console.log('Installing FFmpeg for your platform...');
        
        switch (platform) {
            case 'win32':
                await setupFFmpegWindows();
                break;
            case 'darwin':
                await setupFFmpegMacOS();
                break;
            case 'linux':
                await setupFFmpegLinux();
                break;
            default:
                console.log('❌ Unsupported platform:', platform);
                process.exit(1);
        }
    }
    
    // Verify installation
    verifyFFmpegInstallation();
    
    console.log('✅ FFmpeg setup complete!');
    console.log('🔧 You can now use Feature 1: Silence Detection & Trimming');
}

function createLocalReference() {
    const configFile = path.join(__dirname, '..', 'ffmpeg-config.json');
    const config = {
        platform: platform,
        executable: platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg',
        path: platform === 'win32' ? 'ffmpeg.exe' : '/usr/local/bin/ffmpeg',
        verified: true,
        setupDate: new Date().toISOString()
    };
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('📝 Created FFmpeg configuration file');
}

async function setupFFmpegWindows() {
    console.log('📦 Setting up FFmpeg for Windows...');
    
    try {
        // Try to install via chocolatey
        console.log('Attempting to install via Chocolatey...');
        execSync('choco install ffmpeg -y', { stdio: 'inherit' });
        console.log('✅ FFmpeg installed via Chocolatey');
        
    } catch (chocoError) {
        console.log('⚠️ Chocolatey not available or installation failed');
        console.log('Manual installation required:');
        console.log('');
        console.log('1. Download FFmpeg from: https://ffmpeg.org/download.html#build-windows');
        console.log('2. Extract the archive');
        console.log('3. Copy ffmpeg.exe to:', path.join(binDir, 'ffmpeg.exe'));
        console.log('4. Or add FFmpeg to your system PATH');
        console.log('');
        console.log('Alternative: Install via Chocolatey');
        console.log('  choco install ffmpeg');
        console.log('');
        console.log('Alternative: Install via Scoop');
        console.log('  scoop install ffmpeg');
        
        // Create a placeholder file with instructions
        const instructionFile = path.join(binDir, 'FFMPEG_INSTALLATION_REQUIRED.txt');
        const instructions = `FFmpeg Installation Required for Audio Tools Pro

Please install FFmpeg to enable silence detection:

1. Download from: https://ffmpeg.org/download.html#build-windows
2. Extract ffmpeg.exe to: ${binDir}
3. Or install via package manager:
   - Chocolatey: choco install ffmpeg
   - Scoop: scoop install ffmpeg

After installation, run: npm run setup:ffmpeg
`;
        fs.writeFileSync(instructionFile, instructions);
    }
}

async function setupFFmpegMacOS() {
    console.log('📦 Setting up FFmpeg for macOS...');
    
    try {
        // Check if Homebrew is available
        execSync('which brew', { stdio: 'ignore' });
        
        console.log('Installing FFmpeg via Homebrew...');
        execSync('brew install ffmpeg', { stdio: 'inherit' });
        console.log('✅ FFmpeg installed via Homebrew');
        
    } catch (brewError) {
        console.log('⚠️ Homebrew not available');
        
        try {
            // Try MacPorts
            execSync('which port', { stdio: 'ignore' });
            console.log('Installing FFmpeg via MacPorts...');
            execSync('sudo port install ffmpeg', { stdio: 'inherit' });
            console.log('✅ FFmpeg installed via MacPorts');
            
        } catch (portError) {
            console.log('Manual installation required:');
            console.log('');
            console.log('Option 1: Install Homebrew (recommended)');
            console.log('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
            console.log('  brew install ffmpeg');
            console.log('');
            console.log('Option 2: Download pre-compiled binary');
            console.log('  https://ffmpeg.org/download.html#build-mac');
            console.log('  Extract to /usr/local/bin/ffmpeg');
            console.log('');
            console.log('Option 3: Install via MacPorts');
            console.log('  sudo port install ffmpeg');
        }
    }
}

async function setupFFmpegLinux() {
    console.log('📦 Setting up FFmpeg for Linux...');
    
    // Detect Linux distribution
    let distro = 'unknown';
    try {
        const releaseInfo = fs.readFileSync('/etc/os-release', 'utf8');
        if (releaseInfo.includes('Ubuntu') || releaseInfo.includes('Debian')) {
            distro = 'debian';
        } else if (releaseInfo.includes('CentOS') || releaseInfo.includes('Red Hat')) {
            distro = 'rhel';
        } else if (releaseInfo.includes('Fedora')) {
            distro = 'fedora';
        } else if (releaseInfo.includes('Arch')) {
            distro = 'arch';
        }
    } catch (error) {
        // Fallback detection methods
    }
    
    try {
        switch (distro) {
            case 'debian':
                console.log('Installing FFmpeg via apt...');
                execSync('sudo apt update && sudo apt install -y ffmpeg', { stdio: 'inherit' });
                break;
                
            case 'rhel':
                console.log('Installing FFmpeg via yum/dnf...');
                try {
                    execSync('sudo dnf install -y ffmpeg', { stdio: 'inherit' });
                } catch (dnfError) {
                    execSync('sudo yum install -y ffmpeg', { stdio: 'inherit' });
                }
                break;
                
            case 'fedora':
                console.log('Installing FFmpeg via dnf...');
                execSync('sudo dnf install -y ffmpeg', { stdio: 'inherit' });
                break;
                
            case 'arch':
                console.log('Installing FFmpeg via pacman...');
                execSync('sudo pacman -S ffmpeg', { stdio: 'inherit' });
                break;
                
            default:
                throw new Error('Unknown distribution');
        }
        
        console.log('✅ FFmpeg installed via package manager');
        
    } catch (packageError) {
        console.log('⚠️ Package manager installation failed or not available');
        console.log('Manual installation options:');
        console.log('');
        console.log('Ubuntu/Debian:');
        console.log('  sudo apt update');
        console.log('  sudo apt install ffmpeg');
        console.log('');
        console.log('CentOS/RHEL:');
        console.log('  sudo yum install epel-release');
        console.log('  sudo yum install ffmpeg');
        console.log('');
        console.log('Fedora:');
        console.log('  sudo dnf install ffmpeg');
        console.log('');
        console.log('Arch Linux:');
        console.log('  sudo pacman -S ffmpeg');
        console.log('');
        console.log('Or compile from source:');
        console.log('  https://ffmpeg.org/download.html#build-linux');
    }
}

function verifyFFmpegInstallation() {
    console.log('🔍 Verifying FFmpeg installation...');
    
    try {
        const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' });
        const versionLine = ffmpegVersion.split('\n')[0];
        const versionMatch = versionLine.match(/ffmpeg version (\S+)/);
        
        if (versionMatch) {
            const version = versionMatch[1];
            console.log(`✅ FFmpeg verified: ${version}`);
            
            // Check for required features
            const hasLibs = {
                libx264: ffmpegVersion.includes('--enable-libx264'),
                libmp3lame: ffmpegVersion.includes('--enable-libmp3lame'),
                libvorbis: ffmpegVersion.includes('--enable-libvorbis')
            };
            
            console.log('📋 Available codecs:');
            Object.entries(hasLibs).forEach(([lib, available]) => {
                console.log(`  ${lib}: ${available ? '✅' : '❌'}`);
            });
            
            // Test silence detection filter
            try {
                execSync('ffmpeg -f lavfi -i anullsrc=duration=1 -af silencedetect -f null - 2>/dev/null', { stdio: 'ignore' });
                console.log('✅ Silence detection filter available');
            } catch (filterError) {
                console.log('⚠️ Silence detection filter may not be available');
            }
            
        } else {
            throw new Error('Could not parse FFmpeg version');
        }
        
    } catch (verifyError) {
        console.log('❌ FFmpeg verification failed:', verifyError.message);
        console.log('');
        console.log('Please ensure FFmpeg is properly installed and accessible from PATH');
        console.log('You can test manually by running: ffmpeg -version');
        
        process.exit(1);
    }
}

// Create development configuration
function createDevConfig() {
    const devConfigPath = path.join(__dirname, '..', '.env.development');
    const devConfig = `# Audio Tools Pro - Development Configuration
# This file is created by setup-ffmpeg.js

# FFmpeg Configuration
FFMPEG_PATH=${platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'}
FFMPEG_TIMEOUT=30000
FFMPEG_VERBOSE=false

# Feature 1 Settings
ENABLE_FFMPEG_DETECTION=true
FFMPEG_NOISE_THRESHOLD=-30
FFMPEG_MIN_DURATION=0.5

# Development Flags
DEBUG_FFMPEG=false
MOCK_FFMPEG=${process.env.NODE_ENV === 'test' ? 'true' : 'false'}
`;

    if (!fs.existsSync(devConfigPath)) {
        fs.writeFileSync(devConfigPath, devConfig);
        console.log('📝 Created development configuration');
    }
}

// Main execution
if (require.main === module) {
    setupFFmpeg()
        .then(() => {
            createDevConfig();
            console.log('');
            console.log('🎉 Setup complete! You can now:');
            console.log('  • Run silence detection with FFmpeg');
            console.log('  • Use npm run dev to start development');
            console.log('  • Test Feature 1 in Adobe Premiere Pro');
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    setupFFmpeg,
    verifyFFmpegInstallation,
    createLocalReference
}; 