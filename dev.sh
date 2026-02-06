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
    
    echo "🚀 Starting dev server with hot reload on http://localhost:$PORT"
    npx -y browser-sync start --server --port $PORT --files "**/*.html, **/*.css, **/*.js" --no-notify &
    echo $! > "$PID_FILE"
    echo "✅ Server started! PID: $(cat $PID_FILE)"
    echo "📝 Edit any file and browser will auto-refresh!"
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        echo "🛑 Stopping server (PID: $PID)..."
        kill $PID 2>/dev/null
        # Also kill any browser-sync processes
        pkill -f "browser-sync" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Server stopped!"
    else
        echo "⚠️  No server running (PID file not found)"
        # Try to kill any orphaned browser-sync processes
        pkill -f "browser-sync" 2>/dev/null
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
        echo "📦 Dev Server - Hot Reload for referNconnect"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start   - Start the dev server with hot reload"
        echo "  stop    - Stop the dev server"
        echo "  status  - Check if server is running"
        echo ""
        ;;
esac
