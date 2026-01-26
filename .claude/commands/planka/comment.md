---
name: planka:comment
description: Add a comment to a PLANKA card
allowed-tools:
  - Bash
  - Read
---

<objective>
Add a comment to a PLANKA card. Use for progress updates, questions, or notes.

Usage: /planka:comment [card_id] [message]
Example: /planka:comment 1696373264600794808 "Found the root cause, working on fix"
</objective>

<ai_rules>
Remember the AI Board Rules:
- Always leave comments on cards you work on
- Mention @jose if you have questions or need input
- Keep comments informative and actionable
</ai_rules>

<process>

<step name="parse_args">
Parse arguments:
- card_id (required)
- message (required, can be multi-word)

If not provided, ask for card ID and message.
</step>

<step name="authenticate">
```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/access-tokens -H "Content-Type: application/json" -d '{"emailOrUsername":"claude","password":"claude123@"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['item'])")
```
</step>

<step name="get_card">
Verify card exists and get name:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/cards/[card_id]"
```
</step>

<step name="post_comment">
Add the comment:
```bash
curl -s -X POST "http://localhost:3030/api/cards/[card_id]/comment-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "[message]"}'
```

If message contains a question or blocker, automatically append "@jose" if not already included.
</step>

<step name="confirm">
```
Comment added to: [card name]
URL: http://localhost:3030/cards/[card_id]
```
</step>

</process>

<success_criteria>
- [ ] Comment posted to correct card
- [ ] @jose included if question/blocker
</success_criteria>
