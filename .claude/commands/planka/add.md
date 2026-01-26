---
name: planka:add
description: Add a new card to PLANKA board for work that's not yet tracked
allowed-tools:
  - Bash
  - Read
---

<objective>
Add a new card to a PLANKA board. Use this when working on something that doesn't have a card yet.

Usage: /planka:add [board] [name]
Examples:
- /planka:add crativo "Fix login bug"
- /planka:add afters "Add dark mode support"
</objective>

<ai_rules>
Remember the AI Board Rules:
- Add cards for work not on PLANKA
- Cards go to AI To-Do or AI WIP (never Drafts or Human Verified)
- Always add a description explaining the work
</ai_rules>

<process>

<step name="parse_args">
Parse arguments:
- board: "crativo" or "afters" (required)
- name: card title (required)

If not provided, ask user for:
1. Which board (crativo.xyz or afters.xxx)
2. Card name/title
3. Brief description
</step>

<step name="authenticate">
```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/access-tokens -H "Content-Type: application/json" -d '{"emailOrUsername":"claude","password":"claude123@"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['item'])")
```
</step>

<step name="determine_list">
Determine which list to add the card to:
- If work is about to start: AI WIP
- If planning for later: AI To-Do

AI To-Do List IDs:
- crativo: 1696228536710333464
- afters: 1696362010461079192

AI WIP List IDs:
- crativo: 1696228537180095513
- afters: 1696362032783165081
</step>

<step name="create_card">
Create the card:
```bash
curl -s -X POST "http://localhost:3030/api/lists/[list_id]/cards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "[card name]",
    "type": "project",
    "position": 65535
  }'
```

Extract the card ID from response.
</step>

<step name="add_description">
Update with description:
```bash
curl -s -X PATCH "http://localhost:3030/api/cards/[card_id]" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "[description with context]"}'
```

Description should include:
- What the work involves
- Why it's being done
- Any relevant context
- @jose for visibility
</step>

<step name="add_comment">
Add initial comment:
```bash
curl -s -X POST "http://localhost:3030/api/cards/[card_id]/comment-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Card created by Claude. Starting work on this.\n\n@jose - FYI new task added."}'
```
</step>

<step name="confirm">
Display confirmation:
```
Card created: [card name]
Board: [board name]
List: [list name]
ID: [card_id]
URL: http://localhost:3030/cards/[card_id]

Remember to update this card as you work!
```
</step>

</process>

<success_criteria>
- [ ] Card created in correct board
- [ ] Added to AI To-Do or AI WIP (not Drafts)
- [ ] Description added with context
- [ ] Initial comment posted
- [ ] @jose mentioned
</success_criteria>
