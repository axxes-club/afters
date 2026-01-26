---
name: planka:status
description: Check PLANKA boards for tasks, show what's assigned and in progress
allowed-tools:
  - Bash
  - Read
---

<objective>
Check PLANKA boards (crativo.xyz and afters.xxx) for tasks assigned to Claude or in AI lists. Display a summary of work status.
</objective>

<ai_rules>
Remember the AI Board Rules:
- Never alter Drafts or Human Verified lists
- Always use your own AI account (claude)
- Always leave comments on cards you work on
- Mention @jose if you have questions
- Watch priority, due dates, tasks, attachments
- Add cards for work not on PLANKA
- Continuously update cards while working
</ai_rules>

<process>

<step name="authenticate">
Get auth token from PLANKA:

```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/access-tokens -H "Content-Type: application/json" -d '{"emailOrUsername":"claude","password":"claude123@"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['item'])")
echo "Authenticated"
```

If authentication fails, inform user that PLANKA may be offline.
</step>

<step name="fetch_boards">
Fetch both boards:

```bash
# Fetch crativo.xyz board
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/boards/1696227905475970058"

# Fetch afters.xxx board
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/boards/1696349938524358274"
```
</step>

<step name="analyze">
Parse the board data and identify:
1. Cards in "AI To-Do" lists (ready for work)
2. Cards in "AI WIP" lists (in progress)
3. Cards in "AI Done / QA Ready" lists (awaiting review)
4. Cards assigned to claude user
5. Any cards with due dates approaching
6. Any cards with incomplete tasks

List IDs:
- crativo.xyz:
  - Drafts: 1696228536399954967
  - AI To-Do: 1696228536710333464
  - AI WIP: 1696228537180095513
  - AI Done: 1696228537314313242
  - Human Verified: 1696233476979688544
- afters.xxx:
  - Drafts: 1696361944576951959
  - AI To-Do: 1696362010461079192
  - AI WIP: 1696362032783165081
  - AI Done: 1696362079147001498
  - Human Verified: 1696362431393040027
</step>

<step name="report">
Present a clear status report:

```
# PLANKA Board Status

## crativo.xyz
**AI To-Do:** [count] cards
**AI WIP:** [count] cards
**AI Done / QA Ready:** [count] cards

[For each card in AI To-Do or AI WIP:]
- [Priority Label] [Card Name]
  List: [list name] | Due: [date or "none"]
  Tasks: [completed]/[total] | Comments: [count]
  ID: [card_id]
  URL: http://localhost:3030/cards/[card_id]

## afters.xxx
[Same format]

## Suggested Actions
- [If AI To-Do has cards]: Pick a card to work on
- [If AI WIP has cards]: Continue work or update progress
- [If nothing to do]: Check Drafts for new assignments or run tests
```
</step>

</process>

<success_criteria>
- [ ] Both boards checked
- [ ] All AI-relevant cards displayed
- [ ] Priority and due dates highlighted
- [ ] Clear next action suggested
</success_criteria>
