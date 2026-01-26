#!/usr/bin/env node

/**
 * PLANKA API Helper for Claude Code hooks
 * Handles authentication and common operations
 */

const https = require('http');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, 'planka-config.json');
const TOKEN_CACHE_PATH = path.join(__dirname, '.planka-token');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('[PLANKA] Failed to load config:', e.message);
    return null;
  }
}

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getToken(config) {
  // Try cached token first
  try {
    const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf8'));
    if (cached.expires > Date.now()) {
      return cached.token;
    }
  } catch {}

  // Get new token
  const url = new URL(config.baseUrl);
  const res = await httpRequest({
    hostname: url.hostname,
    port: url.port || 80,
    path: '/api/access-tokens',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    emailOrUsername: config.credentials.username,
    password: config.credentials.password
  });

  if (res.status === 200 && res.data.item) {
    const token = res.data.item;
    // Cache for 1 hour
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify({
      token,
      expires: Date.now() + 3600000
    }));
    return token;
  }
  throw new Error('Failed to authenticate with PLANKA');
}

async function apiCall(config, token, method, endpoint, data = null) {
  const url = new URL(config.baseUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: `/api${endpoint}`,
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  return httpRequest(options, data);
}

async function getBoards(config, token) {
  const boards = [];
  for (const [key, board] of Object.entries(config.boards)) {
    const res = await apiCall(config, token, 'GET', `/boards/${board.id}`);
    if (res.status === 200) {
      boards.push({ key, ...res.data });
    }
  }
  return boards;
}

async function getAssignedCards(config, token) {
  const boards = await getBoards(config, token);
  const assigned = [];

  for (const board of boards) {
    if (!board.included?.cards) continue;

    // Find cards assigned to claude user (userId from membership)
    const claudeMembership = board.included.boardMemberships?.find(
      m => board.included.users?.find(u => u.id === m.userId && u.username === 'claude')
    );

    if (!claudeMembership) continue;

    const claudeUserId = claudeMembership.userId;

    for (const card of board.included.cards) {
      // Check if card has claude as member
      const isAssigned = board.included.cardMemberships?.some(
        m => m.cardId === card.id && m.userId === claudeUserId
      );

      // Also include cards in AI To-Do or AI WIP lists
      const isInAiList = config.lists.aiTodo.includes(card.listId) ||
                         config.lists.aiWip.includes(card.listId);

      if ((isAssigned || isInAiList) && !card.isClosed) {
        const list = board.included.lists?.find(l => l.id === card.listId);
        assigned.push({
          board: board.key,
          boardName: board.item?.name,
          card: card,
          listName: list?.name || 'Unknown',
          labels: board.included.cardLabels
            ?.filter(cl => cl.cardId === card.id)
            .map(cl => board.included.labels?.find(l => l.id === cl.labelId)?.name)
            .filter(Boolean) || [],
          tasks: board.included.tasks
            ?.filter(t => board.included.taskLists?.some(
              tl => tl.cardId === card.id && tl.id === t.taskListId
            )) || []
        });
      }
    }
  }

  return assigned;
}

async function addComment(config, token, cardId, text) {
  return apiCall(config, token, 'POST', `/cards/${cardId}/comment-actions`, { text });
}

async function moveCard(config, token, cardId, listId) {
  return apiCall(config, token, 'PATCH', `/cards/${cardId}`, { listId });
}

async function createCard(config, token, boardId, listId, name, description = null, type = 'project') {
  return apiCall(config, token, 'POST', `/lists/${listId}/cards`, {
    name,
    description,
    type,
    position: 65535
  });
}

async function updateCard(config, token, cardId, updates) {
  return apiCall(config, token, 'PATCH', `/cards/${cardId}`, updates);
}

module.exports = {
  loadConfig,
  getToken,
  apiCall,
  getBoards,
  getAssignedCards,
  addComment,
  moveCard,
  createCard,
  updateCard
};
