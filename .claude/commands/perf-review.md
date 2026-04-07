---
description: Performance review with live Core Web Vitals standards — LCP, CLS, INP, bundle, backend efficiency
argument-hint: "[file, directory, URL, or 'full']"
allowed-tools:
  - Read
  - Agent
  - Glob
  - Grep
  - Write
  - Edit
  - WebFetch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_screenshot
  - mcp__jcodemunch__get_file_outline
  - mcp__jcodemunch__get_file_tree
  - mcp__context7__query-docs
  - mcp__context7__resolve-library-id
  - mcp__exa__web_search_exa
---

Performance review that fetches current Core Web Vitals standards before scanning. Measures real metrics where possible, estimates statically where not. Every finding includes metric impact and a copy-paste fix.

## Steps

### Step 1: Determine scope

If argument provided:
- URL → measure live vitals with Playwright, then review code
- Specific file → review that file for performance patterns
- Directory → review all relevant files in that directory
- "full" → full project review

If no argument:
- Default to recent changes: staged files or last commit
- If URL known from package.json / config → use it for live measurement

### Step 2: Map structure (token-efficient)

```
mcp__jcodemunch__get_file_tree: [project root]
mcp__jcodemunch__get_file_outline: [main entry file]
```
Fall back to `Glob` if jcodemunch not indexed.

Read only manifest files: `package.json`, `vite.config.*`, `next.config.*` — not full source.
Extract: framework, bundler, rendering strategy, image handling approach.

**Check framework performance docs:**
```
mcp__context7__resolve-library-id: [framework name]
mcp__context7__query-docs: [library-id] topic:"performance optimization lazy loading code splitting image"
```

### Step 3: Delegate to performance-guardian

Spawn the performance-guardian agent with full context:

```
performance-guardian: Performance review of [scope].

Stack:
- Framework: [framework and version]
- Bundler: [bundler]
- Rendering: [SSR / SSG / CSR / Islands]
- Image handling: [approach]

Live URL: [URL if available, otherwise "none — static analysis only"]

Scope: [specific files or "full project"]

Tasks:
1. Fetch current Core Web Vitals thresholds (web.dev — do this first)
2. If live URL available: measure LCP, CLS, INP, total transfer with Playwright
3. Run complete performance checklist (sections A through J)
4. Provide severity-ranked findings with:
   - Metric impact (e.g. "LCP +800ms")
   - Root cause
   - Copy-paste ready fix
5. Produce final verdict: FAST / ACCEPTABLE / REQUIRES OPTIMISATION
```

### Step 4: Process results

**FAST**: Log pass. Note any budget headroom. No action needed.

**ACCEPTABLE**:
- Present medium/low findings
- Ask: "Want me to apply the quick wins now?"
- Apply approved fixes

**REQUIRES OPTIMISATION**:
- Critical/High findings block delivery
- Present all findings ranked by metric impact
- Ask: "Want me to fix the critical and high-priority issues now?"
- Apply fixes
- Re-measure with Playwright to verify improvement

### Step 5: Update performance memory

After review, ask performance-guardian to update its memory:
- Log current vitals baseline (LCP, CLS, INP, bundle size)
- Log open performance issues
- Log resolved issues
- Set/confirm performance budget for this project

### Step 6: Log to daily note

Append to today's daily note:
```markdown
## Performance Review — HH:MM
- Scope: [what was reviewed]
- Verdict: [FAST / ACCEPTABLE / REQUIRES OPTIMISATION]
- LCP: [X] | CLS: [X] | INP: [X]
- Critical: [N] | High: [N] | Medium: [N]
- Fixed: [N]
- Open: [N]
```

### Step 7: Knowledge nomination

If new performance patterns found that apply broadly, nominate:

Append to `.claude/knowledge-nominations.md`:
```
[date] PERFORMANCE: [pattern] — [metric impact and why it matters]
Source: performance-guardian empirical — found during review of [scope]
```
