---
description: Comprehensive security review with live threat intelligence — OWASP, CVEs, concrete fixes
argument-hint: "[file, directory, feature, or 'full']"
allowed-tools:
  - Read
  - Agent
  - WebSearch
  - WebFetch
  - Glob
  - Grep
  - Write
  - Edit
  - Bash(git diff:*, git log:*)
  - mcp__jcodemunch__get_file_outline
  - mcp__jcodemunch__get_file_tree
  - mcp__context7__query-docs
  - mcp__context7__resolve-library-id
  - mcp__exa__web_search_exa
  - mcp__exa__web_search_advanced_exa
---

Security review that fetches current threat intelligence before scanning. Not a static checklist — live intelligence + systematic analysis. Every finding includes attack scenario and copy-paste fix.

## Steps

### Step 1: Determine scope

If argument provided:
- Specific file → review that file
- Directory → review all code files in that directory
- "full" → review entire project
- Feature name → find and review related files

If no argument:
- Default to recent changes: `git diff HEAD~1` or staged changes
- If no git history: review all source files

### Step 2: Map structure then identify stack (token-efficient)

**First — get project outline without reading files:**
```
mcp__jcodemunch__get_file_tree: [project root]
mcp__jcodemunch__get_file_outline: [main entry file]
```
Fall back to `Glob` + `Grep` if jcodemunch is not indexed.

**Then — read only manifest files to identify stack:**
Read package.json / requirements.txt / go.mod / pom.xml / Gemfile — not full source yet.
Extract:
- Language(s) and framework(s)
- Key dependencies (with versions)
- Authentication approach
- Database type
- Deployment context

**Check current framework security docs:**
```
mcp__context7__resolve-library-id: [framework name]
mcp__context7__query-docs: [library-id] topic:"security vulnerabilities authentication"
```

### Step 3: Delegate to security-guardian

Spawn the security-guardian agent with full context:

```
security-guardian: Security review of [scope].

Stack:
- Language: [language and version if known]
- Framework: [framework and version if known]
- Key dependencies: [list or "read from package files"]
- Auth: [method if known, otherwise "determine from code"]
- Database: [type if known]

Scope: [specific files or "full project"]

Tasks:
1. Fetch current threat intelligence for this stack (WebSearch — do this first)
2. Check for active CVEs in dependencies
3. Run complete security checklist (all sections A through N — including GDPR/Privacy and Supply Chain)
4. Provide severity-ranked findings with:
   - Exact file:line location
   - Attack scenario (how would an attacker exploit this?)
   - Impact description
   - Copy-paste ready fix
   - OWASP or CVE reference
5. Produce final verdict: SECURE / CONDITIONALLY SECURE / REQUIRES REMEDIATION
```

### Step 4: Process results

**SECURE**: Log pass, note any hardening suggestions for backlog.

**CONDITIONALLY SECURE**:
- Present findings to user
- Ask: "Want me to apply the medium/low fixes now?"
- Apply approved fixes

**REQUIRES REMEDIATION**:
- Critical/High findings block deployment
- Present all findings
- Ask: "Want me to fix the critical and high-priority issues now?"
- Apply fixes
- Re-run security check on fixed files to verify

### Step 5: Update security memory

After review, ask security-guardian to update its memory:
- Log open vulnerabilities with locations
- Log resolved vulnerabilities
- Update CVE watch list
- Record any new project-specific security rules learned

### Step 6: Log to daily note

Append security review summary to daily note:
```markdown
## Security Review — HH:MM
- Scope: [what was reviewed]
- Verdict: [SECURE / CONDITIONALLY SECURE / REQUIRES REMEDIATION]
- Critical: [N] | High: [N] | Medium: [N] | Low: [N]
- Fixed: [N applied fixes]
- Open: [N remaining — link to security memory]
```

### Step 7: Knowledge nomination

If new security patterns were found that apply broadly, nominate to knowledge base:

Append to `.claude/knowledge-nominations.md`:
```
[date] SECURITY: [pattern] — [why it matters for this project type]
Source: security-guardian empirical — found during review of [scope]
```
