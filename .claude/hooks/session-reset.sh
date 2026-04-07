#!/bin/bash
# SessionStart(user) hook — resets stale state on fresh session start.
# Cleans up gate files, validates agent definitions, checks permissions.

LOG_DIR="$CLAUDE_PROJECT_DIR/.claude/logs"
AGENTS_DIR="$CLAUDE_PROJECT_DIR/.claude/agents"
HOOKS_DIR="$CLAUDE_PROJECT_DIR/.claude/hooks"

mkdir -p "$LOG_DIR"

# ═══════════════════════════════════════════════════════
# 1. Reset stale gate files (prevents cross-session deadlocks)
# ═══════════════════════════════════════════════════════
rm -f "$LOG_DIR/.quality-gate-active" \
      "$LOG_DIR/.tool-call-count" \
      "$LOG_DIR/.compaction-occurred" 2>/dev/null

# Clean up stale session-blocks files (older than current hour)
find "$LOG_DIR" -name ".session-blocks-*" -mmin +120 -delete 2>/dev/null

# ═══════════════════════════════════════════════════════
# 2. Validate hook scripts are executable
# ═══════════════════════════════════════════════════════
if [ -d "$HOOKS_DIR" ]; then
  HOOK_ISSUES=0
  for hook in "$HOOKS_DIR"/*.sh; do
    [ ! -f "$hook" ] && continue
    if [ ! -x "$hook" ]; then
      chmod +x "$hook" 2>/dev/null
      HOOK_ISSUES=$((HOOK_ISSUES + 1))
    fi
  done
  if [ "$HOOK_ISSUES" -gt 0 ]; then
    echo "- \`$(date +"%Y-%m-%d %H:%M:%S")\` | SESSION | INFO | Fixed permissions on $HOOK_ISSUES hook scripts" >> "$LOG_DIR/incident-log.md"
  fi
fi

# ═══════════════════════════════════════════════════════
# 3. Validate agent definitions exist and have frontmatter
# ═══════════════════════════════════════════════════════
if [ -d "$AGENTS_DIR" ]; then
  AGENT_ISSUES=""
  for agent in "$AGENTS_DIR"/*.md; do
    [ ! -f "$agent" ] && continue
    AGENT_NAME=$(basename "$agent" .md)

    # Check for frontmatter (starts with ---)
    if ! head -1 "$agent" | grep -q '^---'; then
      AGENT_ISSUES="$AGENT_ISSUES $AGENT_NAME(no-frontmatter)"
    fi
  done

  if [ -n "$AGENT_ISSUES" ]; then
    echo "- \`$(date +"%Y-%m-%d %H:%M:%S")\` | SESSION | WARN | Agent issues:$AGENT_ISSUES" >> "$LOG_DIR/incident-log.md"
  fi
fi

# ═══════════════════════════════════════════════════════
# 4. Ensure required directories exist
# ═══════════════════════════════════════════════════════
mkdir -p "$CLAUDE_PROJECT_DIR/.claude/agent-memory" \
         "$CLAUDE_PROJECT_DIR/.claude/backups" \
         "$CLAUDE_PROJECT_DIR/.claude/skills" \
         "$CLAUDE_PROJECT_DIR/Daily Notes" 2>/dev/null

# ═══════════════════════════════════════════════════════
# 5. Auto-create settings.json with hooks if missing
#    Prevents hooks from silently dying in worktrees
# ═══════════════════════════════════════════════════════
SETTINGS_FILE="$CLAUDE_PROJECT_DIR/.claude/settings.json"
if [ ! -f "$SETTINGS_FILE" ] && [ -d "$HOOKS_DIR" ]; then
  mkdir -p "$CLAUDE_PROJECT_DIR/.claude"
  cat > "$SETTINGS_FILE" << 'HOOKS_EOF'
{
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
}
HOOKS_EOF
  echo "- \`$(date +"%Y-%m-%d %H:%M:%S")\` | SESSION | INFO | Auto-created .claude/settings.json with hooks (was missing)" >> "$LOG_DIR/incident-log.md"
fi

# ═══════════════════════════════════════════════════════
# 6. Prune old log files (keep last 30 days)
# ═══════════════════════════════════════════════════════
if [ -f "$LOG_DIR/audit-trail.md" ]; then
  LINE_COUNT=$(wc -l < "$LOG_DIR/audit-trail.md" | tr -d ' ')
  if [ "$LINE_COUNT" -gt 5000 ]; then
    # Keep last 2000 lines
    tail -2000 "$LOG_DIR/audit-trail.md" > "$LOG_DIR/audit-trail.md.tmp"
    mv "$LOG_DIR/audit-trail.md.tmp" "$LOG_DIR/audit-trail.md"
    echo "- \`$(date +"%Y-%m-%d %H:%M:%S")\` | SESSION | INFO | Pruned audit trail from $LINE_COUNT to 2000 lines" >> "$LOG_DIR/incident-log.md"
  fi
fi

exit 0
