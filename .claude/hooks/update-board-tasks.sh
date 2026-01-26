#!/bin/bash

# Stop hook to update tasks assigned to @claude on PLANKA board
# Board URL: http://localhost:3030/boards/1696349938524358274
# Credentials: configured below

BOARD_URL="http://localhost:3030"
BOARD_ID="1696349938524358274"
USERNAME="claude"
PASSWORD="claude123"

# Log file for debugging
LOG_FILE="/tmp/claude-board-hook.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Stop hook triggered ==="

# Step 1: Login to PLANKA and get access token
log "Logging in as $USERNAME..."
LOGIN_RESPONSE=$(curl -s -X POST "$BOARD_URL/api/access-tokens" \
    -H "Content-Type: application/json" \
    -d "{\"emailOrUsername\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
    2>&1)

log "Login response: $LOGIN_RESPONSE"

# Extract access token using jq or basic parsing
if command -v jq &> /dev/null; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.item // empty')
else
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"item":"[^"]*"' | sed 's/"item":"//;s/"//')
fi

if [ -z "$ACCESS_TOKEN" ]; then
    log "Failed to obtain access token, aborting"
    exit 1
fi

log "Got access token: ${ACCESS_TOKEN:0:20}..."

# Step 2: Fetch the board data (includes cards/tasks)
log "Fetching board data..."
BOARD_RESPONSE=$(curl -s "$BOARD_URL/api/boards/$BOARD_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    2>&1)

log "Board response length: ${#BOARD_RESPONSE}"

# Step 3: Get all cards assigned to claude user
log "Finding cards assigned to claude..."

if command -v jq &> /dev/null; then
    # First get the claude user ID from board members
    CLAUDE_USER_ID=$(echo "$BOARD_RESPONSE" | jq -r '.included.users[] | select(.username == "claude" or .name == "claude") | .id' 2>/dev/null | head -1)

    if [ -z "$CLAUDE_USER_ID" ]; then
        log "Could not find claude user in board members"
        # Try fetching from cards membership
        CLAUDE_USER_ID=$(echo "$BOARD_RESPONSE" | jq -r '.included.cardMemberships[] | select(.userId) | .userId' 2>/dev/null | sort -u | head -1)
    fi

    log "Claude user ID: $CLAUDE_USER_ID"

    # Get cards where claude is a member
    CARD_IDS=$(echo "$BOARD_RESPONSE" | jq -r --arg uid "$CLAUDE_USER_ID" \
        '.included.cardMemberships[] | select(.userId == $uid) | .cardId' 2>/dev/null)

    # Update each card's stopwatch or add a comment
    for CARD_ID in $CARD_IDS; do
        if [ -n "$CARD_ID" ]; then
            log "Processing card $CARD_ID..."

            # Get current card info
            CARD_INFO=$(echo "$BOARD_RESPONSE" | jq -r --arg cid "$CARD_ID" '.included.cards[] | select(.id == $cid)' 2>/dev/null)
            CARD_NAME=$(echo "$CARD_INFO" | jq -r '.name' 2>/dev/null)

            log "Card: $CARD_NAME"

            # Stop any running stopwatch on the card
            STOPWATCH=$(echo "$CARD_INFO" | jq -r '.stopwatch // empty' 2>/dev/null)
            if [ -n "$STOPWATCH" ] && [ "$STOPWATCH" != "null" ]; then
                log "Stopping stopwatch on card $CARD_ID..."
                curl -s -X PATCH "$BOARD_URL/api/cards/$CARD_ID" \
                    -H "Authorization: Bearer $ACCESS_TOKEN" \
                    -H "Content-Type: application/json" \
                    -d '{"stopwatch":null}' >> "$LOG_FILE" 2>&1
            fi

            # Add a comment about session ending
            log "Adding session end comment to card $CARD_ID..."
            COMMENT_RESPONSE=$(curl -s -X POST "$BOARD_URL/api/cards/$CARD_ID/comment-actions" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"[Automated] Claude Code session ended at $(date '+%Y-%m-%d %H:%M:%S')\"}" \
                2>&1)

            log "Comment response: $COMMENT_RESPONSE"
        fi
    done
else
    log "jq not available, using basic parsing..."
    # Basic fallback without jq
    CARD_IDS=$(echo "$BOARD_RESPONSE" | grep -oE '"cardId":"[^"]+"' | sed 's/"cardId":"//g;s/"//g' | sort -u)

    for CARD_ID in $CARD_IDS; do
        if [ -n "$CARD_ID" ]; then
            log "Adding comment to card $CARD_ID..."
            curl -s -X POST "$BOARD_URL/api/cards/$CARD_ID/comment-actions" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"[Automated] Claude Code session ended at $(date '+%Y-%m-%d %H:%M:%S')\"}" \
                >> "$LOG_FILE" 2>&1
        fi
    done
fi

# Step 4: Delete access token (logout)
log "Logging out..."
curl -s -X DELETE "$BOARD_URL/api/access-tokens/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" >> "$LOG_FILE" 2>&1

log "=== Stop hook completed ==="
