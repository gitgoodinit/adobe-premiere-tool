#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Audio Tools Backend Service...\n');

async function setupBackend() {
    try {
        // Check if we're in the right directory
        const currentDir = process.cwd();
        const backendDir = path.join(currentDir, 'backend');
        
        if (!fs.existsSync(backendDir)) {
            console.error('❌ Backend directory not found. Please run this script from the project root.');
            process.exit(1);
        }
        
        console.log('📁 Backend directory found:', backendDir);
        
        // Check if package.json exists
        const packageJsonPath = path.join(backendDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.error('❌ package.json not found in backend directory.');
            process.exit(1);
        }
        
        console.log('📦 Installing dependencies...');
        
        // Install dependencies
        try {
            execSync('npm install', { 
                cwd: backendDir, 
                stdio: 'inherit' 
            });
            console.log('✅ Dependencies installed successfully');
        } catch (error) {
            console.error('❌ Failed to install dependencies:', error.message);
            process.exit(1);
        }
        
        // Create .env file if it doesn't exist
        const envPath = path.join(backendDir, '.env');
        const envExamplePath = path.join(backendDir, 'env.example');
        
        if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
            console.log('📝 Creating .env file...');
            await fs.copy(envExamplePath, envPath);
            console.log('✅ .env file created from template');
            console.log('⚠️  Please edit .env file with your OpenAI API key and Redis configuration');
        }
        
        // Create necessary directories
        const directories = ['uploads', 'temp'];
        for (const dir of directories) {
            const dirPath = path.join(backendDir, dir);
            if (!fs.existsSync(dirPath)) {
                await fs.ensureDir(dirPath);
                console.log(`📁 Created directory: ${dir}`);
            }
        }
        
        // Check for Redis
        console.log('\n🔍 Checking Redis installation...');
        try {
            execSync('redis-cli ping', { stdio: 'pipe' });
            console.log('✅ Redis is running');
        } catch (error) {
            console.log('⚠️  Redis is not running or not installed');
            console.log('📋 To install Redis:');
            console.log('   macOS: brew install redis && brew services start redis');
            console.log('   Ubuntu: sudo apt-get install redis-server && sudo systemctl start redis');
            console.log('   Windows: Download from https://redis.io/download');
        }
        
        // Check for FFmpeg
        console.log('\n🔍 Checking FFmpeg installation...');
        try {
            execSync('ffmpeg -version', { stdio: 'pipe' });
            console.log('✅ FFmpeg is installed');
        } catch (error) {
            console.log('⚠️  FFmpeg is not installed');
            console.log('📋 To install FFmpeg:');
            console.log('   macOS: brew install ffmpeg');
            console.log('   Ubuntu: sudo apt-get install ffmpeg');
            console.log('   Windows: Download from https://ffmpeg.org/download.html');
        }
        
        console.log('\n🎉 Backend setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Edit backend/.env with your OpenAI API key');
        console.log('2. Start Redis server if not running');
        console.log('3. Start the backend service:');
        console.log('   cd backend && npm start');
        console.log('4. The service will be available at:');
        console.log('   - HTTP API: http://localhost:3001');
        console.log('   - WebSocket: ws://localhost:3002');
        console.log('   - Health Check: http://localhost:3001/health');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
setupBackend();

