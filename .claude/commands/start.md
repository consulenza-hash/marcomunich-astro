---
description: Start the day - load memory, open task board, ready to work
argument-hint: ""
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(date:*)
---

Begin a working session. Load context, create today's daily note, review tasks.

## Steps

### Step 0: Hook health check (silent)

Before anything else, run a quick infrastructure check:

```bash
ls .claude/logs/
```

- If `.claude/logs/` is **empty or only contains `.gitkeep`**: hooks have never fired.
  → Run `/hook-audit` immediately and report findings before continuing.
  → This means the project was set up without active hooks — fix it now.
- If logs exist: hooks are active → continue silently, no output to user.

This check costs one bash call. It catches broken infrastructure before a full day of unlogged work.

### Step 1: Get today's date

```bash
date +"%m%d%y %H:%M %A"
```

### Step 2: Load memory (parallel reads)

Read simultaneously:
- `.claude/memory.md`
- `.claude/knowledge-base.md`
- `.claude/agent-memory/security-guardian/MEMORY.md`
- `.claude/agent-memory/design-guardian/MEMORY.md`

These are your working context. Knowledge-base entries are mandatory constraints.

From `security-guardian/MEMORY.md` extract:
- Any open vulnerabilities (Known Vulnerabilities — Open section) → if present, add to memory.md Blockers
- CVE Watch List → keep in context while working on dependencies

From `design-guardian/MEMORY.md` extract:
- Project Design Decisions → active design system for this project (palette, fonts, style)
- This ensures all UI work stays consistent with established design decisions without re-running a Full Brief

### Step 3: Create daily note

Create `Daily Notes/MMDDYY.md` (if it doesn't exist):

```markdown
# MMDDYY - Daily Work Log

## Decisions
-

## Meetings & Conversations
-

## Notes
-

## End of Day Summary
-
```

### Step 4: Open task board

Read `Task Board.md`. Scan for:
- Overdue items (anything from previous days still open)
- Today's priorities
- Blocked items

### Step 4B: Deadline detection — set work mode

Parse dates from `Task Board.md`. Look for:
- ISO dates (`2026-03-30`), "by [weekday]", "deadline:", "due:", "launch:", "ship:" annotations
- Any item in Today or This Week with a date

Calculate days between today (from Step 1) and the nearest deadline.

**Set work mode:**

| Days to deadline | Mode | Behavior |
|---|---|---|
| ≤ 2 days | 🔴 LAUNCH MODE | Zero speculative work. No refactoring unless it directly unblocks shipping. Hardening and fixes only. |
| 3–7 days | 🟡 FOCUS MODE | Prioritize delivery tasks. Flag any task that doesn't advance the deadline. |
| > 7 days or no deadline found | 🟢 NORMAL MODE | Standard workflow — no restrictions. |

Include mode in Step 6 output. If LAUNCH MODE, also output:
`⚠️ No speculative refactoring. No new features outside scope. Every task must advance delivery.`

If no dates found in Task Board: default to NORMAL MODE silently.

### Step 5: Task review

For each task in Today:
1. Is it still relevant?
2. Do I have what I need to start?
3. Are there dependencies?

Move stale tasks to Backlog. Flag blocked items.

### Step 5B: New project detection

After reading the Task Board, check these conditions simultaneously:
- Task Board Today + This Week are **empty or have only generic placeholders**
- `memory.md` → Now section has **no active project described**
- `.claude/agent-memory/design-guardian/MEMORY.md` has **no project design decisions**

If ALL THREE are true → this is a new project with no active work.

Output this suggestion before the orientation:
```
💡 Nessun progetto attivo rilevato. Se stai iniziando un sito per un cliente, usa:
   /website [info cliente]
   Fa tutto: audience research → copy → design → build → audit pre-delivery.
```

If ANY condition is false → skip silently, no output.

### Step 6: Ready to work

Output a brief orientation:
- What day it is
- Work mode: 🔴 LAUNCH MODE — [N days to deadline] / 🟡 FOCUS MODE / 🟢 NORMAL MODE
- Top 1-3 priorities for today
- Any blockers or open threads from memory.md
- "Ready to work. What's first?"

Keep it short. The user wants to start working, not read a report.
