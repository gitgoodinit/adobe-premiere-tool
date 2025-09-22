#!/bin/bash

# Audio Tools Backend Startup Script

echo "🚀 Starting Audio Tools Backend Service..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "✅ .env file created from template"
        echo "⚠️  Please edit backend/.env with your OpenAI API key and Redis configuration"
    else
        echo "❌ env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if Redis is running
echo "🔍 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Attempting to start..."
    
    # Try to start Redis based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew > /dev/null 2>&1; then
            brew services start redis
        else
            echo "❌ Homebrew not found. Please install Redis manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start redis
    else
        echo "❌ Unsupported OS. Please start Redis manually."
        exit 1
    fi
    
    # Wait a moment for Redis to start
    sleep 2
    
    # Check again
    if ! redis-cli ping > /dev/null 2>&1; then
        echo "❌ Failed to start Redis. Please start it manually."
        exit 1
    fi
fi

echo "✅ Redis is running"

# Check if FFmpeg is installed
echo "🔍 Checking FFmpeg..."
if ! command -v ffmpeg > /dev/null 2>&1; then
    echo "⚠️  FFmpeg is not installed. Please install it:"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt-get install ffmpeg"
    echo "   Windows: Download from https://ffmpeg.org/download.html"
    exit 1
fi

echo "✅ FFmpeg is installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd backend && npm install && cd ..
    echo "✅ Dependencies installed"
fi

# Start the backend service
echo "🚀 Starting backend service..."
cd backend

# Check if we should run in development mode
if [ "$1" = "dev" ]; then
    echo "🔧 Running in development mode..."
    npm run dev
else
    echo "🏭 Running in production mode..."
    npm start
fi

