---
name: planka:done
description: Mark a card as done - move to AI Done list with completion summary
allowed-tools:
  - Bash
  - Read
---

<objective>
Mark a PLANKA card as complete. Moves card to "AI Done / QA Ready" list and adds a completion summary comment for Jose to review.

Usage: /planka:done [card_id]
Example: /planka:done 1696373264600794808
</objective>

<ai_rules>
Remember the AI Board Rules:
- Cards go to AI Done (never Human Verified - that's for Jose)
- Always leave detailed completion comments
- Mention @jose for review
- Include test URLs, file changes, commits if relevant
</ai_rules>

<process>

<step name="parse_args">
Get card_id from arguments. If not provided, run /planka:status to show cards in AI WIP.
</step>

<step name="authenticate">
```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/access-tokens -H "Content-Type: application/json" -d '{"emailOrUsername":"claude","password":"claude123@"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['item'])")
```
</step>

<step name="get_card">
Fetch card details to get board ID and current info:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/cards/[card_id]"
```
</step>

<step name="gather_summary">
Gather completion details:
- What was done (bullet points)
- Files changed (if code work)
- Test URL or how to verify
- Any notes for Jose

Format completion summary for card description update:
```
---

## Completed by Claude

**Done:**
- [item 1]
- [item 2]

**Files changed:**
- [file1]
- [file2]

**Test at:** [URL or instructions]

**Commit:** [hash if applicable]

@jose - Ready for your review!
```
</step>

<step name="update_description">
Append completion summary to existing description:
```bash
# Get current description first, then append
curl -s -X PATCH "http://localhost:3030/api/cards/[card_id]" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "[existing description]\n\n[completion summary]"}'
```
</step>

<step name="move_to_done">
Move to AI Done list:

AI Done List IDs:
- crativo: 1696228537314313242
- afters: 1696362079147001498

```bash
curl -s -X PATCH "http://localhost:3030/api/cards/[card_id]" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listId": "[done_list_id]"}'
```
</step>

<step name="add_comment">
Add completion comment:
```bash
curl -s -X POST "http://localhost:3030/api/cards/[card_id]/comment-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Task completed and moved to QA Ready.\n\n@jose - Please review when you have a chance!"}'
```
</step>

<step name="confirm">
```
Card completed: [card name]
Moved to: AI Done / QA Ready
URL: http://localhost:3030/cards/[card_id]

@jose will review and move to Human Verified when approved.
```
</step>

</process>

<success_criteria>
- [ ] Card description updated with completion summary
- [ ] Card moved to AI Done / QA Ready
- [ ] Comment added notifying Jose
- [ ] Never moved to Human Verified (that's Jose's job)
</success_criteria>
