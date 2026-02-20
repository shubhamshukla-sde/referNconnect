#!/bin/bash

# Development server script
# Usage: ./dev.sh [start|stop|status]

PORT=3000
PID_FILE=".dev-server.pid"

start_server() {
    if [ -f "$PID_FILE" ]; then
        echo "⚠️  Server might already be running. Use './dev.sh stop' first."
        exit 1
    fi
    
    echo "🚀 Starting dev server on http://localhost:$PORT"
    echo "📡 Perplexity API proxy enabled at /api/perplexity"
    node server.js &
    echo $! > "$PID_FILE"
    echo "✅ Server started! PID: $(cat $PID_FILE)"
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        echo "🛑 Stopping server (PID: $PID)..."
        kill $PID 2>/dev/null
        # Also kill any leftover node server processes
        pkill -f "node server.js" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Server stopped!"
    else
        echo "⚠️  No server running (PID file not found)"
        pkill -f "node server.js" 2>/dev/null
    fi
}

status_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Server is running (PID: $PID)"
            echo "🌐 URL: http://localhost:$PORT"
        else
            echo "⚠️  PID file exists but server is not running"
            rm -f "$PID_FILE"
        fi
    else
        echo "❌ Server is not running"
    fi
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    status)
        status_server
        ;;
    *)
        echo "📦 Dev Server - referNconnect"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start   - Start the dev server with API proxy"
        echo "  stop    - Stop the dev server"
        echo "  status  - Check if server is running"
        echo ""
        ;;
esac
