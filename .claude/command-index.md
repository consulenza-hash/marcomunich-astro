# Command Index

All system commands, their triggers, required tools, and invocation mode.

## Daily Rituals

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/start` | Beginning of work day | Read, Write, Edit, Bash(date) | Self-execute | Load memory, create daily note, review tasks |
| `/sync` | Mid-day (after 3-4 hours) | Read, Write, Edit, Bash(date), Agent | Self-execute | Refresh memory, process scratchpad, review tasks |
| `/wrap-up` | End of work day | Read, Write, Edit, Bash(date), Agent | Self-execute | Daily audit, externalize knowledge, prep tomorrow |
| `/standup` | Start of day (quick mode) | Read, Edit, Glob, Bash(git,date) | Self-execute | Auto-generate yesterday/today/blockers from git + tasks |
| `/clear` | Context pressure or task completion | Read, Write, Edit, Bash(date) | Self-execute | Distill state, flush context, auto-resume |

## Design & Creative

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/design [client info]` | **AUTO: any UI/frontend task** — or run manually for new visual project | Read, Agent, WebSearch, WebFetch, Write, Edit | Self-execute | Maximum-creativity workflow — fetch trends, select styles, define system, build |

## Security, Legal, Performance & GEO

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/sec-review [scope]` | **AUTO: after any code is written** — or run manually before any deployment | Read, Agent, WebSearch, WebFetch, Glob, Grep, Write, Edit | Self-execute | Live security review — OWASP + CVEs fetched fresh, full checklist, copy-paste fixes |
| `/legal-review [scope]` | **AUTO: before any client delivery** — or when building forms, cookies, e-commerce, newsletter | Read, Agent, WebSearch, WebFetch, Glob, Grep, Write, Edit, Exa | Self-execute | Live legal compliance review — GDPR, cookie law, Codice del Consumo, T&C, copy-paste fixes |
| `/perf-review [scope]` | **AUTO: before any client delivery** — or when adding images, fonts, routes, or third-party scripts | Read, Agent, WebFetch, Playwright, jcodemunch, context7, Exa | Self-execute | Live performance audit — Core Web Vitals fetched fresh, LCP/CLS/INP measured, copy-paste fixes |
| `/geo-review [scope]` | **AUTO: before any client delivery of a public website** — or when building schema, robots.txt, content strategy | Read, Agent, WebSearch, WebFetch, Glob, Grep, Write, Edit, Exa | Self-execute | Live GEO audit — LLM visibility intelligence fetched fresh, entity architecture + llms.txt + JSON-LD + AI bot governance, copy-paste fixes |

## Infrastructure

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/hook-audit` | **AUTO: on first `/start` if logs are empty** — or run manually when hooks seem inactive | Read, Write, Edit, Glob, Bash(ls,wc,date) | Self-execute | Audit hook infrastructure — checks settings.json wiring, script presence, log activity, memory health. Auto-fixes missing configuration. |

## Marketing

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/website [client info]` | **AUTO-SUGGERITO da /start se nessun progetto attivo** — o quando si inizia un sito da zero | Read, Write, Agent, WebFetch, Exa, Playwright | Self-execute | Workflow completo: audience research → copy → design → build → audit pre-delivery |
| `/market audit [url]` | Quando si vuole valutare il potenziale di conversione di un sito | Read, Agent, WebFetch, Exa | Self-execute | Full marketing audit — 5 agenti paralleli, score 0-100, MARKETING-AUDIT.md |
| `/market copy [url]` | Copy da rivedere o riscrivere | Read, WebFetch, Write | Self-execute | Analisi e riscrittura copy — PAS, AIDA, JTBD, before/after, COPY-SUGGESTIONS.md |
| `/market emails [context]` | Sequenze email da creare | Read, Write | Self-execute | Genera sequenze email complete — welcome, nurture, cart abandonment, cold outreach |
| `/market social [context]` | Calendario social da creare | Read, WebFetch, Write | Self-execute | Calendario 30 giorni, platform-specific, hook + hashtag + repurposing |
| `/market ads [url]` | Campagne pubblicitarie da creare | Read, WebFetch, Write | Self-execute | Campagne Google + Meta + LinkedIn + TikTok con retargeting e A/B test plan |
| `/market funnel [url]` | Funnel da analizzare e ottimizzare | Read, WebFetch, Write | Self-execute | Mappa leak, stima revenue impact, raccomandazioni P1-P5, FUNNEL-ANALYSIS.md |
| `/market landing [url]` | Landing page da ottimizzare | Read, WebFetch, Write | Self-execute | CRO audit 7-point pesato, benchmark CR, A/B hypotheses, LANDING-AUDIT.md |

## Quality & Review

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/audit [scope]` | After completing a task/feature | Read, Agent, Write, Edit | Self-execute | Delegate quality review to auditor agent |
| `/review [target]` | Before merging code | Read, Agent, Glob, Grep, Bash(git) | Self-execute | Deep code review — security + performance + architecture |
| `/system-audit` | Monthly or after major changes | Read, Glob, Grep, Agent, Write, Edit, Bash(date,wc,find) | Self-execute | Deep infrastructure audit of entire system |
| `/drift-detect` | Monthly or when behaviour feels off | Read, Agent, Glob, Grep, Bash(wc,find,date) | Self-execute | Detect config drift — stale rules, contradictions, orphans |
| `/retro [period]` | End of sprint/week | Read, Write, Edit, Glob, Agent, Bash(date) | Self-execute | Sprint retrospective — analyze patterns, improve process |
| `/debt-map [dir]` | Before planning sprint work | Read, Agent, Glob, Grep, Bash(git,wc,find) | Self-execute | Map and prioritise technical debt across codebase |

## Problem Solving

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/unstick [problem]` | When stuck on a problem 10+ min | Read, Agent, Grep, Glob, WebSearch | Self-execute | Root-cause analysis via unsticker agent |
| `/onboard [project]` | Starting work on unfamiliar codebase | Read, Agent, Glob, Grep, Bash(git,find,wc,ls) | Self-execute | Generate full codebase onboarding guide |

## Planning & Strategy

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/brief [idea]` | Starting a new project | Read, Write, Edit, Agent, Glob, Bash(date) | Self-execute | Turn rough idea into structured project brief |
| `/launch [product]` | Preparing to launch a product/feature | Read, Write, Edit, Agent, Glob, Grep, WebSearch, WebFetch, Bash(date) | Self-execute | Full launch pipeline — competitive scan to GTM checklist |
| `/proposal [project]` | Client asks for a proposal | Read, Write, Edit, Agent, Glob, Bash(date) | Self-execute | Generate structured client proposal with scope and pricing |
| `/competitive-intel [market]` | Entering a new market or evaluating position | Read, Write, Edit, Agent, Glob, WebSearch, WebFetch, Bash(date) | Self-execute | Deep competitive analysis with strategic recommendations |

## Communication & Delivery

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/ship [URL]` | **Before any client delivery** — crawls every page, full UX + security audit, fixes issues, produces client-ready package | Read, Write, Edit, Agent, Playwright, Semgrep, Exa, jcodemunch, context7 | Self-execute | Full site audit → fix cycle → SHIP-REPORT.md with shareable link and status badge |
| `/report [topic]` | Need to present findings to stakeholders | Read, Write, Edit, Agent, Glob, Grep, Bash(date) | Self-execute | Generate audience-aware professional report |
| `/release [version]` | Shipping a new version | Read, Write, Edit, Glob, Grep, Bash(git,date) | Self-execute | Auto-generate release notes — technical + marketing + executive |
| `/handoff [recipient]` | Passing work to another person or AI | Read, Write, Edit, Glob, Grep, Bash(git,date) | Self-execute | Structured session handoff with full context briefing |

## System Building

| Command | Trigger | Tools | Mode | Description |
|---------|---------|-------|------|-------------|
| `/playbook [name]` | Repeating a manual workflow | Read, Write, Edit, Glob, Bash(date) | Self-execute | Record a workflow and auto-generate a reusable command |

## Auto-Trigger Conditions

Commands should be proactively invoked (not waiting for user) when:

| Condition | Command |
|-----------|---------|
| Session starts fresh | `/start` (if morning) or `/standup` (if quick) |
| **Building any UI, website, app, or visual interface** | **`/design` — AUTO, always** |
| **Any code is written or modified** | **`/sec-review` — AUTO, always** |
| 30+ tool calls in session | `/clear` |
| Compaction warning | `/clear` (emergency mode) |
| Discrete multi-step task completes | Consider `/clear` |
| Quality feels degraded | `/clear` |
| Stuck for 10+ minutes | `/unstick` |
| Feature/task completed | `/audit` |
| Before merging code | `/review` |
| **Before any client delivery (legal)** | **`/legal-review` — AUTO, always** |
| **Any form / cookie / e-commerce / newsletter built** | **`/legal-review` — AUTO, always** |
| **Before any client delivery (performance)** | **`/perf-review` — AUTO, always** |
| **New images, fonts, routes, or third-party scripts added** | **`/perf-review` — AUTO, always** |
| **Before any client delivery of a public website** | **`/geo-review` — AUTO, always** |
| **Building or auditing schema, robots.txt, content strategy** | **`/geo-review` — AUTO, always** |
| **Valutare il marketing di un sito client** | **`/market audit` — consigliato** |
| Starting unfamiliar project | `/onboard` |
| Passing work to someone else | `/handoff` |
| System behaviour feels off | `/drift-detect` |

## Invocation Modes

- **Self-execute**: Read the command file and follow the procedure directly
- **Recommend**: Output `RECOMMEND: /command [args] — [reason]` for the orchestrator
