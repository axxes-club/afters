#!/usr/bin/env node

/**
 * PLANKA Session Start Hook
 * Checks boards for assigned tasks and displays status
 *
 * AI BOARD RULES:
 * - Never alter Drafts or Human Verified lists
 * - Always use your own AI account
 * - Always leave comments
 * - Mention Jose if you have questions
 * - Watch priority, due dates, tasks, attachments
 * - Add cards for work not on planka
 * - Continuously update cards as you work
 */

const planka = require('./planka-api.js');

async function main() {
  const config = planka.loadConfig();
  if (!config) {
    console.log('[PLANKA] Config not found - skipping board check');
    return;
  }

  try {
    const token = await planka.getToken(config);
    const assigned = await planka.getAssignedCards(config, token);

    if (assigned.length === 0) {
      console.log('[PLANKA] No assigned tasks. Check boards for available work.');
      console.log(`         crativo.xyz: http://localhost:3030/boards/${config.boards.crativo.id}`);
      console.log(`         afters.xxx: http://localhost:3030/boards/${config.boards.afters.id}`);
      return;
    }

    console.log(`[PLANKA] ${assigned.length} active task(s):`);
    console.log('');

    for (const item of assigned) {
      const priorityLabel = item.labels.find(l =>
        ['Critical', 'Medium', 'Low'].includes(l)
      );
      const priority = priorityLabel ? `[${priorityLabel}]` : '';
      const dueDate = item.card.dueDate
        ? `Due: ${new Date(item.card.dueDate).toLocaleDateString()}`
        : '';

      const incompleteTasks = item.tasks.filter(t => !t.isCompleted).length;
      const totalTasks = item.tasks.length;
      const taskInfo = totalTasks > 0 ? `Tasks: ${totalTasks - incompleteTasks}/${totalTasks}` : '';

      console.log(`  ${priority} ${item.card.name}`);
      console.log(`     Board: ${item.boardName} | List: ${item.listName}`);
      if (dueDate || taskInfo) {
        console.log(`     ${[dueDate, taskInfo].filter(Boolean).join(' | ')}`);
      }
      console.log(`     ID: ${item.card.id}`);
      console.log('');
    }

    console.log('[PLANKA] Remember: Update cards as you work, leave comments!');

  } catch (e) {
    console.log(`[PLANKA] Board check failed: ${e.message}`);
    console.log('         PLANKA may be offline. Continue without board tracking.');
  }
}

main().catch(console.error);
