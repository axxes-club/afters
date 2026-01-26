#!/bin/bash

# Start hook - only runs once per session using a marker file
SESSION_MARKER="/tmp/claude-session-active"
BOARD_URL="http://localhost:3030"
CARD_ID="1696362940220835484"
USERNAME="claude"
PASSWORD="claude123@"
LOG_FILE="/tmp/claude-board-hook.log"

# Check if session already started
if [ -f "$SESSION_MARKER" ]; then
    exit 0
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Start hook triggered ==="

# Create session marker
echo "$$" > "$SESSION_MARKER"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$BOARD_URL/api/access-tokens" \
    -H "Content-Type: application/json" \
    -d "{\"emailOrUsername\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" 2>&1)

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"item":"[^"]*"' | sed 's/"item":"//;s/"//g')

if [ -z "$ACCESS_TOKEN" ]; then
    log "Failed to login"
    exit 0
fi

log "Logged in successfully"

# Add comment that session started
curl -s -X POST "$BOARD_URL/api/cards/$CARD_ID/comments" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"🟢 Claude Code session started at $(date '+%Y-%m-%d %H:%M:%S')\"}" >> "$LOG_FILE" 2>&1

# Start stopwatch on the card
curl -s -X PATCH "$BOARD_URL/api/cards/$CARD_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"stopwatch\":{\"startedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"total\":0}}" >> "$LOG_FILE" 2>&1

log "Started stopwatch and added comment"

# Logout
curl -s -X DELETE "$BOARD_URL/api/access-tokens/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" >> "$LOG_FILE" 2>&1

log "=== Start hook completed ==="
