#!/usr/bin/env node

/**
 * PLANKA Session Stop Hook
 * Reminds to update cards and optionally posts session summary
 *
 * AI BOARD RULES:
 * - Never alter Drafts or Human Verified lists
 * - Always leave comments on cards you worked on
 * - Mention @jose in updates
 */

const planka = require('./planka-api.js');
const fs = require('fs');
const path = require('path');

// Session state file to track what was worked on
const SESSION_STATE_PATH = path.join(__dirname, '.planka-session-state.json');

function loadSessionState() {
  try {
    return JSON.parse(fs.readFileSync(SESSION_STATE_PATH, 'utf8'));
  } catch {
    return { workedOn: [], sessionStart: null };
  }
}

function clearSessionState() {
  try {
    fs.unlinkSync(SESSION_STATE_PATH);
  } catch {}
}

async function main() {
  const config = planka.loadConfig();
  if (!config) {
    return;
  }

  const state = loadSessionState();

  try {
    const token = await planka.getToken(config);
    const assigned = await planka.getAssignedCards(config, token);

    // Find cards that were being worked on (in AI WIP)
    const inProgress = assigned.filter(item =>
      config.lists.aiWip.includes(item.card.listId)
    );

    if (inProgress.length > 0) {
      console.log('');
      console.log('[PLANKA] Cards in progress:');
      for (const item of inProgress) {
        console.log(`  - ${item.card.name}`);
        console.log(`    Remember to update this card with your progress!`);
        console.log(`    Card: http://localhost:3030/cards/${item.card.id}`);
      }
      console.log('');
    }

    // Show summary of assigned tasks
    if (assigned.length > 0) {
      const byList = {};
      for (const item of assigned) {
        byList[item.listName] = byList[item.listName] || [];
        byList[item.listName].push(item.card.name);
      }

      console.log('[PLANKA] Task summary:');
      for (const [list, cards] of Object.entries(byList)) {
        console.log(`  ${list}: ${cards.length} card(s)`);
      }
    }

    // Cleanup session state
    clearSessionState();

  } catch (e) {
    console.log(`[PLANKA] Could not check boards: ${e.message}`);
  }
}

main().catch(console.error);
