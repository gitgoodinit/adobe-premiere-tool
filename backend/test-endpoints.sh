#!/bin/bash

# Audio Tools Pro Backend - Quick Endpoint Testing Script
# This script helps you quickly test the backend endpoints

echo "🚀 Audio Tools Pro Backend - Endpoint Testing Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3001/api"
TIMEOUT=30

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $TIMEOUT \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            --max-time $TIMEOUT \
            "$BASE_URL$endpoint")
    fi
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        echo "Response: $response_body" | jq . 2>/dev/null || echo "Response: $response_body"
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $response_body"
    fi
}

# Check if server is running
echo -e "\n${YELLOW}Checking if server is running...${NC}"
if curl -s --max-time 5 "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running on $BASE_URL${NC}"
else
    echo -e "${RED}❌ Server is not running on $BASE_URL${NC}"
    echo "Please start the server first:"
    echo "  cd backend"
    echo "  npm start"
    exit 1
fi

# Test Health Endpoints
echo -e "\n${YELLOW}🏥 Testing Health Endpoints${NC}"
test_endpoint "GET" "/health" "Basic Health Check"
test_endpoint "GET" "/health/detailed" "Detailed Health Check"
test_endpoint "GET" "/health/metrics" "System Metrics"
test_endpoint "GET" "/health/ready" "Readiness Check"
test_endpoint "GET" "/health/live" "Liveness Check"

# Test Settings Endpoints
echo -e "\n${YELLOW}⚙️ Testing Settings Endpoints${NC}"
test_endpoint "GET" "/settings" "Get Current Settings"
test_endpoint "GET" "/settings/validate" "Validate Settings"
test_endpoint "GET" "/settings/schema" "Get Settings Schema"

# Test Capability Endpoints
echo -e "\n${YELLOW}🔧 Testing Capability Endpoints${NC}"
test_endpoint "GET" "/silence/methods" "Get Silence Detection Methods"
test_endpoint "GET" "/overlap/algorithms" "Get Overlap Detection Algorithms"
test_endpoint "GET" "/multitrack/capabilities" "Get Multi-Track Capabilities"
test_endpoint "GET" "/rhythm/algorithms" "Get Timing Correction Algorithms"

# Test Settings Update (without API keys)
echo -e "\n${YELLOW}⚙️ Testing Settings Update${NC}"
test_endpoint "PUT" "/settings" "Update Settings (Processing Quality)" '{
  "processing": {
    "processingQuality": "high"
  },
  "audio": {
    "defaultFormat": "mp3",
    "sampleRate": 44100
  }
}'

# Test Settings Export
echo -e "\n${YELLOW}📤 Testing Settings Export${NC}"
test_endpoint "POST" "/settings/export" "Export Settings" '{
  "format": "json",
  "includeSecrets": false,
  "includeDefaults": false
}'

# Test API Configuration Test
echo -e "\n${YELLOW}🧪 Testing API Configuration${NC}"
test_endpoint "POST" "/settings/test-api" "Test API Configuration" '{
  "apiType": "all",
  "timeout": 10000
}'

echo -e "\n${GREEN}🎉 Basic endpoint testing completed!${NC}"
echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. For file upload testing, use Postman with the collection:"
echo "   - Import: Audio_Tools_Pro_API.postman_collection.json"
echo "   - Set base_url environment variable to: $BASE_URL"
echo ""
echo "2. Test with actual audio files:"
echo "   - Use MP3, WAV, M4A, or OGG files"
echo "   - Start with small files (< 10MB) for testing"
echo "   - Test silence detection first, then overlap detection"
echo ""
echo "3. Monitor server logs for detailed information:"
echo "   - Check console output for processing details"
echo "   - Look for error messages and warnings"
echo ""
echo "4. For production testing:"
echo "   - Test with larger files"
echo "   - Test concurrent requests"
echo "   - Test error scenarios (invalid files, missing parameters)"
echo ""
echo -e "${BLUE}Happy testing! 🚀${NC}"
