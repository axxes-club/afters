---
name: planka:help
description: Show available PLANKA commands and AI board rules
allowed-tools:
  - Read
---

<objective>
Display help for PLANKA skills and remind of AI board rules.
</objective>

<process>

<step name="display_help">
Output the following:

```
# PLANKA Board Management

## Commands

| Command | Description |
|---------|-------------|
| `/planka:status` | Check boards for tasks, show what's assigned |
| `/planka:update [id] [list]` | Update card with progress, optionally move |
| `/planka:add [board] [name]` | Add new card for untracked work |
| `/planka:done [id]` | Mark card complete, move to QA Ready |
| `/planka:comment [id] [msg]` | Add comment to a card |
| `/planka:help` | Show this help |

## Board

- **afters.xxx**: http://localhost:3030/boards/1696349938524358274

## Lists I Can Use

| List | Purpose |
|------|---------|
| AI To-Do | Tasks ready for me to work on |
| AI WIP | Tasks I'm currently working on |
| AI Done / QA Ready | Completed, waiting for Jose's review |

## Lists I Must NOT Touch

| List | Reason |
|------|--------|
| Drafts | Jose's planning area |
| Human Verified | Only Jose moves cards here |

## AI Board Rules

1. Never alter Drafts or Human Verified lists
2. Always use my own account (claude)
3. Always leave comments on cards I work on
4. Mention @jose if I have questions
5. Watch priority, due dates, tasks, attachments
6. Add cards for work not on PLANKA
7. Continuously update cards while working
8. If no tasks, do testing and log test tickets

## Quick Examples

```bash
# Check what needs doing
/planka:status

# Start working on a card
/planka:update 1696373264600794808 wip

# Add progress comment
/planka:comment 1696373264600794808 "Fixed the bug, running tests"

# Mark complete
/planka:done 1696373264600794808

# Track new work
/planka:add crativo "Implement new feature X"
```

## Login Info
- URL: http://localhost:3030
- Username: claude
- Password: claude123@
```
</step>

</process>

<success_criteria>
- [ ] All commands listed
- [ ] Rules clearly stated
- [ ] Examples provided
</success_criteria>
