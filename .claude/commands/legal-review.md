---
description: Live legal compliance review — GDPR, cookie law, Codice del Consumo, T&C, privacy policy, e-commerce rights. Fetches current regulations before scanning. Copy-paste compliant text for every finding.
argument-hint: "[file, page, feature, or 'full']"
allowed-tools:
  - Read
  - Agent
  - WebSearch
  - WebFetch
  - Glob
  - Grep
  - Write
  - Edit
  - mcp__exa__web_search_exa
  - mcp__exa__web_search_advanced_exa
---

Legal compliance review that fetches current regulation guidance before scanning. Not a static checklist — live intelligence + systematic analysis. Every finding includes the regulation article, risk level, and copy-paste compliant text.

## Steps

### Step 1: Determine scope

If argument provided:
- Specific page/file → review that component
- Feature name → find and review related files
- "full" → review entire project

If no argument:
- Default to: cookie implementation, privacy policy, forms, e-commerce flow, newsletter signup

### Step 2: Delegate to legal-guardian

Spawn the legal-guardian agent with full context:

```
legal-guardian: Legal compliance review of [scope].

Project context:
- Target market: [IT/EU/UK/US/Global — detect from language, currency, address fields]
- Project type: [e-commerce / lead gen / SaaS / brochure — detect from codebase]
- Data collected: [detect from forms and tracking scripts]
- Features present: [cookies, forms, checkout, newsletter, user accounts — list what exists]

Scope: [specific files, pages, or "full project"]

Tasks:
1. Fetch current regulation guidance (Garante, GDPR.eu, AGCM) — do this first
2. Detect jurisdiction and project type from the codebase
3. Run complete compliance checklist (sections A through J)
4. Provide severity-ranked findings with:
   - Exact page/file location
   - Regulation article violated
   - Risk level and enforcement likelihood
   - Copy-paste ready compliant text
5. Produce final verdict: COMPLIANT / CONDITIONALLY COMPLIANT / NON-COMPLIANT
```

### Step 3: Process results

**COMPLIANT**: Log pass. Note any enhancements for backlog.

**CONDITIONALLY COMPLIANT**:
- Present findings
- Ask: "Want me to draft the missing text/clauses now?"
- Apply approved additions

**NON-COMPLIANT**:
- Critical/High findings block delivery
- Present all findings
- Ask: "Want me to draft compliant text for critical and high-priority items?"
- Apply drafts (note: reviewed by lawyer before use for high-stakes items)
- Re-check relevant sections to verify

### Step 4: Update legal memory

After review, ask legal-guardian to update its memory:
- Log open compliance issues with locations
- Log resolved issues
- Update third-party processor list
- Record any new project-specific legal rules learned

### Step 5: Log to daily note

Append summary to daily note:
```markdown
## Legal Review — HH:MM
- Scope: [what was reviewed]
- Jurisdiction: [IT/EU/UK/US]
- Verdict: [COMPLIANT / CONDITIONALLY COMPLIANT / NON-COMPLIANT]
- Critical: [N] | High: [N] | Medium: [N] | Low: [N]
- Fixed/Drafted: [N]
- Open: [N remaining]
```

### Step 6: Knowledge nomination

If new compliance patterns are found that apply broadly, nominate:

Append to `.claude/knowledge-nominations.md`:
```
[date] LEGAL: [pattern] — [why it matters for this project type]
Source: legal-guardian empirical — found during review of [scope]
```
