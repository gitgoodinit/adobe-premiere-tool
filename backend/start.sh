#!/bin/bash

# Audio Tools Pro Backend Startup Script

echo "🎵 Starting Audio Tools Pro Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file from template. Please edit it with your configuration."
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
    echo "✅ Dependencies installed successfully."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads temp cache logs
echo "✅ Directories created."

# Check if FFmpeg is available (optional)
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is available: $(ffmpeg -version | head -n1)"
else
    echo "⚠️  FFmpeg not found. Some features may not work. Install FFmpeg for full functionality."
fi

# Start the server
echo "🚀 Starting server..."
echo "📚 API Documentation: http://localhost:3000/api/docs"
echo "🏥 Health Check: http://localhost:3000/api/health"
echo ""

# Check if we should run in development or production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Running in production mode..."
    npm start
else
    echo "🔧 Running in development mode..."
    npm run dev
fi
