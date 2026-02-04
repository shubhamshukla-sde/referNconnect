#!/bin/bash

# Target port
PORT=8081

echo "🚀 Starting referNconnect project..."

# Find and kill any process running on port 8081
PID=$(lsof -t -i:$PORT)
if [ -n "$PID" ]; then
  echo "⚠️ Port $PORT is already in use by process $PID. Killing it..."
  kill -9 $PID
fi

# Start python http server in the background
echo "🌐 Server starting at http://localhost:$PORT"
python3 -m http.server $PORT > /dev/null 2>&1 &

# Store the secondary PID
SERVER_PID=$!

# Wait a moment for server to start
sleep 1

# Open the browser (macOS)
open "http://localhost:$PORT"

echo "✅ Project is running! (PID: $SERVER_PID)"
echo "💡 To stop the project, run: kill $SERVER_PID"
