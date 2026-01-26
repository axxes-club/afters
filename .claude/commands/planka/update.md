---
name: planka:update
description: Update a PLANKA card with progress - add comment and optionally move to different list
allowed-tools:
  - Bash
  - Read
---

<objective>
Update a PLANKA card with progress. This adds a comment documenting what was done and optionally moves the card to a different list (e.g., from AI To-Do to AI WIP, or AI WIP to AI Done).

Usage: /planka:update [card_id] [optional: to-list]
Examples:
- /planka:update 1696373264600794808
- /planka:update 1696373264600794808 done
- /planka:update 1696373264600794808 wip
</objective>

<ai_rules>
Remember the AI Board Rules:
- Never alter Drafts or Human Verified lists
- Always leave comments on cards you work on
- Mention @jose in updates
</ai_rules>

<process>

<step name="parse_args">
Parse the command arguments:
- First arg: card_id (required)
- Second arg: target list (optional) - "wip", "done", "todo"

If no card_id provided, run /planka:status first to show available cards.
</step>

<step name="authenticate">
```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/access-tokens -H "Content-Type: application/json" -d '{"emailOrUsername":"claude","password":"claude123@"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['item'])")
```
</step>

<step name="get_card">
Fetch current card details:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/cards/[card_id]"
```

Display card name and current list.
</step>

<step name="gather_update">
Ask user what progress to report, or summarize recent work if context is clear.

Format the comment:
```
**Progress Update:**

[What was done]

[Any blockers or notes]

@jose - [status: continuing / ready for review / need input]
```
</step>

<step name="post_comment">
Add comment to the card:
```bash
curl -s -X POST "http://localhost:3030/api/cards/[card_id]/comment-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "[formatted comment]"}'
```
</step>

<step name="move_card">
If target list specified, move the card:

List IDs for crativo.xyz:
- todo: 1696228536710333464
- wip: 1696228537180095513
- done: 1696228537314313242

List IDs for afters.xxx:
- todo: 1696362010461079192
- wip: 1696362032783165081
- done: 1696362079147001498

```bash
curl -s -X PATCH "http://localhost:3030/api/cards/[card_id]" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listId": "[target_list_id]"}'
```

Never move to Drafts or Human Verified lists!
</step>

<step name="confirm">
Display confirmation:
```
Card updated: [card name]
Comment added: ✓
Moved to: [list name] (if moved)
URL: http://localhost:3030/cards/[card_id]
```
</step>

</process>

<success_criteria>
- [ ] Card identified correctly
- [ ] Comment added with progress
- [ ] @jose mentioned in comment
- [ ] Card moved to correct list (if requested)
- [ ] Never touched Drafts or Human Verified
</success_criteria>
