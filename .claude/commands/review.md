---
description: Deep code review - security, performance, architecture, and actionable fixes
argument-hint: "[file, directory, or PR]"
allowed-tools:
  - Read
  - Agent
  - Glob
  - Grep
  - Bash(git diff:*, git log:*, git show:*)
  - WebSearch
  - WebFetch
  - mcp__jcodemunch__get_file_outline
  - mcp__jcodemunch__get_file_tree
  - mcp__context7__query-docs
  - mcp__context7__resolve-library-id
  - mcp__exa__web_search_exa
---

Comprehensive code review. Goes beyond style — checks security, performance, architecture, and generates actionable improvement suggestions.

## Steps

### Step 1: Determine scope

Identify what to review:
- If user specified a file or directory → review that
- If user specified a PR or branch → `git diff main...HEAD` (or appropriate base)
- If nothing specified → review staged changes (`git diff --cached`) or recent commits

### Step 2: Map then read (token-efficient)

**First — outline, don't read blindly:**
Run `mcp__jcodemunch__get_file_outline` on each file in scope to get structure (functions, classes, imports) without loading full content. If jcodemunch is not indexed, use `Glob` to list files and `Grep` to locate relevant sections.

**Then — read only what matters:**
Load full file content only for:
- New files (highest risk — no prior review)
- Files with the most changes
- Files containing auth, DB queries, user input, file ops
- Test files (or lack thereof)

**For library/framework usage — check current docs:**
If code uses a library, resolve and query current docs:
```
mcp__context7__resolve-library-id: [library name]
mcp__context7__query-docs: [library-id] topic:"[specific API or pattern in use]"
```

### Step 3: Multi-dimensional review (parallel agents)

Spawn parallel review agents:

**Agent 1 — Security review (delegated to security-guardian):**

Invoke the `security-guardian` agent with the files in scope as input.
Security-guardian fetches live OWASP + CVE intelligence, runs the full checklist (sections A through N), and returns severity-ranked findings with copy-paste fixes.

```
Agent(security-guardian): Security review of [files in scope].
Context: pre-merge code review.
Stack: [identified stack from Step 2].
Scope: [list of files].
Return: severity-ranked findings (CRITICAL/HIGH/MEDIUM/LOW) with attack scenarios and fixes.
```

Do not duplicate security checks inline — security-guardian owns this domain.
Fallback (if Agent tool unavailable): manually run OWASP Top 10 checklist covering injections, broken auth, XSS, IDOR, misconfig, and vulnerable dependencies.

**Agent 2 — Performance review:**
- N+1 queries or unnecessary database calls
- Missing indexes (if schema visible)
- Unbounded loops or recursion
- Large memory allocations
- Missing caching opportunities
- Unnecessary re-renders (React) or recomputations

**Agent 3 — Architecture review:**
- Does this follow existing patterns in the codebase?
- Is responsibility clearly separated?
- Are there circular dependencies?
- Is the abstraction level appropriate? (over-engineered or under-abstracted)
- Will this be easy to test, debug, and maintain?

### Step 4: Compile findings

Categorise each finding:

| Severity | Meaning |
|----------|---------|
| **CRITICAL** | Must fix before merge — security vulnerability, data loss risk, breaking bug |
| **HIGH** | Should fix — performance issue, architectural concern, maintainability problem |
| **MEDIUM** | Consider fixing — code smell, minor inefficiency, readability improvement |
| **LOW** | Nit — style preference, naming suggestion, comment improvement |

### Step 5: Generate the review

Output a structured review:

```markdown
## Code Review — [scope]

### Summary
[1-2 sentences: overall assessment and top concern]

### Critical Issues
- **[File:line]** — [issue and why it matters]
  **Fix:** [specific code suggestion]

### High Priority
- **[File:line]** — [issue]
  **Fix:** [suggestion]

### Medium Priority
- [bullets]

### What's Good
- [specific things done well — always include positives]

### Verdict
[APPROVE / APPROVE WITH CHANGES / REQUEST CHANGES]
[One sentence rationale]
```

### Step 6: Offer to fix

Ask the user: "Want me to fix the critical and high-priority issues now?"

If yes, apply fixes directly. If no, the review stands as documentation.
