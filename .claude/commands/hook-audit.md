---
description: Audit hook infrastructure — verifies settings.json wiring, script presence, log activity, and memory health. Auto-fixes missing hook configuration.
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash(wc:*, ls:*, date:*)
---

Audit the Claudify hook infrastructure. Silent pass if healthy. Loud fix if broken. Run at install time, on first `/start`, and any time hooks seem inactive.

## Steps

### Step 1: Read current settings.json

Read `.claude/settings.json`.

Check: does the `"hooks"` key exist at the top level?

- **Yes** → proceed to Step 2
- **No** → jump directly to Step 5 (fix mode)

### Step 2: Audit hook scripts present

Check which `.sh` files exist in `.claude/hooks/`:

```bash
ls .claude/hooks/
```

Build a presence map:
| Script | Required | Present |
|--------|----------|---------|
| `guard-bash.sh` | Yes | ? |
| `completeness-gate.sh` | Yes | ? |
| `backup-before-write.sh` | Yes | ? |
| `log-changes.sh` | Yes | ? |
| `log-failures.sh` | Yes | ? |
| `pre-compact-handoff.sh` | Yes | ? |
| `post-compact-resume.sh` | Yes | ? |
| `session-reset.sh` | Yes | ? |
| `log-stop-verdict.sh` | Yes | ? |

### Step 3: Cross-check settings.json wiring vs scripts present

For each hook entry in `settings.json`, verify:
- The `.sh` file referenced actually exists
- The path uses `$CLAUDE_PROJECT_DIR/.claude/hooks/` (not relative path)
- The script is wrapped in quotes: `"\"$CLAUDE_PROJECT_DIR/.claude/hooks/script.sh\""`

For each `.sh` file that IS present, verify it has a corresponding entry in `settings.json`.

Flag any orphaned scripts (file exists, not wired) or ghost entries (wired, file missing).

### Step 4: Check log activity

```bash
ls .claude/logs/
```

- If `.claude/logs/` is **empty or only contains `.gitkeep`**: hooks have never fired → HIGH severity
- If logs exist with recent dates: hooks are active → OK
- If logs exist but dates are old (>7 days): possible drift → WARN

Also check:
```bash
wc -l .claude/memory.md
wc -l .claude/knowledge-base.md
```

- `memory.md` > 100 lines → WARN (needs pruning)
- `knowledge-base.md` > 200 lines → WARN (needs pruning)
- Either file missing or empty → WARN

### Step 5: Fix — wire missing hooks into settings.json

If `"hooks"` key is missing OR orphaned scripts were found:

Read the current `settings.json` content fully.

Build the correct hooks configuration using ONLY the scripts that are actually present in `.claude/hooks/`. Do not add entries for missing scripts.

The canonical configuration (include only if script exists):

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-bash.sh\"",
          "statusMessage": "Checking command safety..."
        }
      ]
    },
    {
      "matcher": "Write|Edit|NotebookEdit",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/backup-before-write.sh\"",
          "async": true,
          "statusMessage": "Backing up before write..."
        },
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/completeness-gate.sh\"",
          "async": false,
          "statusMessage": "Validating content completeness..."
        }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": "Write|Edit|NotebookEdit",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/log-changes.sh\"",
          "async": true,
          "statusMessage": "Logging change..."
        }
      ]
    }
  ],
  "PostToolUseFailure": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/log-failures.sh\"",
          "async": true,
          "statusMessage": "Logging failure..."
        }
      ]
    }
  ],
  "PreCompact": [
    {
      "matcher": "auto",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact-handoff.sh\"",
          "timeout": 5,
          "statusMessage": "Saving state before compaction..."
        }
      ]
    }
  ],
  "SessionStart": [
    {
      "matcher": "user",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/session-reset.sh\"",
          "timeout": 3,
          "statusMessage": "Resetting session state..."
        }
      ]
    },
    {
      "matcher": "compact",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/post-compact-resume.sh\"",
          "timeout": 10,
          "statusMessage": "Restoring context after compaction..."
        }
      ]
    }
  ],
  "Stop": [
    {
      "hooks": [
        {
          "type": "prompt",
          "prompt": "You are a JSON-only response bot. Output raw JSON with no markdown, no code fences, no prose. Review this conversation and return exactly one JSON object: {\"decision\":\"allow\",\"learning\":null,\"task_type\":\"other\"} — decision is \"allow\" if all user-requested tasks were completed, \"block\" if something was missed (add \"reason\" field). learning is a one-sentence lesson if errors were resolved (root cause + fix), otherwise null. task_type is one of: build, debug, refactor, test, docs, research, deploy, admin, setup, other. RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.",
          "model": "haiku",
          "timeout": 15
        },
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/log-stop-verdict.sh\"",
          "async": true,
          "statusMessage": "Logging session verdict..."
        }
      ]
    }
  ]
}
```

Merge into the existing settings.json. **Validate JSON before saving** — a broken settings.json silently disables all hooks.

### Step 6: Output audit report

```
## Hook Audit — [date]

### Infrastructure Status
- settings.json hooks key: [PRESENT / MISSING → FIXED]
- Scripts found: [N]/9
- Wiring coverage: [N]/N scripts wired
- Log activity: [ACTIVE (last log: date) / NEVER FIRED / STALE (last: date)]

### Scripts
✅ guard-bash.sh — [wired / orphaned]
✅ completeness-gate.sh — [wired / orphaned]
✅ backup-before-write.sh — [wired / orphaned]
✅ log-changes.sh — [wired / orphaned]
✅ log-failures.sh — [wired / orphaned]
✅ pre-compact-handoff.sh — [wired / orphaned]
✅ post-compact-resume.sh — [wired / orphaned]
✅ session-reset.sh — [wired / orphaned]
✅ log-stop-verdict.sh — [wired / orphaned]

### Memory Health
- memory.md: [N lines — OK / WARN: over limit]
- knowledge-base.md: [N lines — OK / WARN: over limit]

### Actions Taken
- [list of fixes applied, or "None — infrastructure healthy"]

### Verdict
[HEALTHY / FIXED (describe what was repaired) / DEGRADED (describe what needs manual attention)]
```

### Step 7: Log to daily note

If a daily note exists for today, append:
```markdown
## Hook Audit — HH:MM
- Verdict: [HEALTHY / FIXED / DEGRADED]
- [One line summary of finding or fix]
```
