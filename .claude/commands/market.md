---
description: Marketing audit and content generation suite — copy, emails, social, ads, funnel, landing page CRO
argument-hint: "[audit|copy|emails|social|ads|funnel|landing] [url or context]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Agent
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - mcp__exa__web_search_exa
  - mcp__exa__web_search_advanced_exa
  - mcp__exa__crawling_exa
---

Marketing intelligence suite. Every subcommand produces a client-ready markdown file with specific, actionable, revenue-linked recommendations.

## Subcommands

### `/market audit [url]`
Full marketing audit — 5 parallel agents, scored 0-100, client-ready report.
→ Delegates to `marketing-guardian` Full Audit mode.
→ Output: `MARKETING-AUDIT.md`

### `/market copy [url]`
Analyze and rewrite copy using PAS, AIDA, Jobs-to-be-Done frameworks.
→ Reads `.claude/skills/market-copy.md` and executes.
→ Output: `COPY-SUGGESTIONS.md`

### `/market emails [context]`
Generate complete email sequences (welcome, nurture, cart abandonment, cold outreach).
→ Reads `.claude/skills/market-emails.md` and executes.
→ Output: `EMAIL-SEQUENCES.md`

### `/market social [context]`
Generate 30-day social media content calendar across platforms.
→ Reads `.claude/skills/market-social.md` and executes.
→ Output: `SOCIAL-CALENDAR.md`

### `/market ads [url]`
Generate complete ad campaigns for Google, Meta, LinkedIn, TikTok, Twitter/X.
→ Reads `.claude/skills/market-ads.md` and executes.
→ Output: `AD-CAMPAIGNS.md`

### `/market funnel [url]`
Map and optimize the conversion funnel — leak identification, revenue impact.
→ Reads `.claude/skills/market-funnel.md` and executes.
→ Output: `FUNNEL-ANALYSIS.md`

### `/market landing [url]`
CRO audit of a landing page — 7-point weighted scoring, A/B test hypotheses.
→ Reads `.claude/skills/market-landing.md` and executes.
→ Output: `LANDING-AUDIT.md`

---

## Routing Logic

Read the argument:

1. First word = subcommand → route to the appropriate skill/agent above
2. No argument or `help` → list all subcommands with one-line description
3. Unknown subcommand → suggest closest match

## After every subcommand

Log to today's daily note:
```markdown
## /market [subcommand] — HH:MM
- Target: [url or context]
- Output: [filename]
- Top finding: [one sentence]
```

If output is for a client: ask marketing-guardian to update its MEMORY.md with the findings.
