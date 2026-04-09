# Knowledge Base

System-wide learned rules. Read by ALL agents and sessions at startup.
Written ONLY by the auditor after confirming learnings.
Entries are mandatory constraints, not suggestions.

## Provenance Hierarchy
Every entry MUST cite its source using one of:
- `[Source: user override MMDDYY]` — User explicitly corrected something
- `[Source: empirical MMDDYY]` — Verified through testing or data
- `[Source: agent inference MMDDYY]` — Pattern observed by an agent, confirmed by auditor

## Hard Rules

- [032426] DESIGN: Every UI/frontend task MUST invoke design-guardian before building. Generic aesthetics = failure. Fetch current trends before recommending styles. [Source: user override 032426]
- [032426] DESIGN: Design briefs must define all four dimensions: structural style, aesthetic style, typographic approach, interaction patterns. Incomplete briefs are blocked. [Source: user override 032426]
- [032426] DESIGN: Color palettes must include hex codes AND verified WCAG AA contrast ratios. No palette ships without contrast check. [Source: user override 032426]
- [032426] DESIGN: Every design must include an "Emotional Target" paragraph — the north star for all visual decisions. [Source: user override 032426]
- [032426] SECURITY: Every code output MUST be reviewed by security-guardian before delivery. There are no exceptions. [Source: user override 032426]
- [032426] SECURITY: Security checks must fetch live OWASP + CVE intelligence via WebSearch. Training data is not sufficient — threats change daily. [Source: user override 032426]
- [032426] SECURITY: Critical and High severity findings block delivery. Code cannot be presented as complete while unresolved Critical/High issues exist. [Source: user override 032426]
- [032426] SECURITY: Every security finding must include: exact file:line, attack scenario, impact, copy-paste fix, and OWASP/CVE reference. Vague warnings are not findings. [Source: user override 032426]

## Hard Infrastructure Rules
- [040926] DEPLOY: **NIENTE VERCEL — mai, per nessun motivo.** Piano cancellato, servizio dismesso. Se trovi `vercel.json`, link Vercel, config Vercel, o qualsiasi riferimento a Vercel nel codice: ELIMINALO IMMEDIATAMENTE senza aspettare istruzioni. Non menzionare Vercel come opzione. Deploy = Netsons via GitHub Actions + lftp FTP. [Source: user override 040926 — ripetuto decine di volte]

## Platform & Tool Rules
- [032526] TOOLS: `mcp__exa__web_search_exa` is significantly more token-efficient than WebSearch + WebFetch for dynamic content (blogs, news, CVE feeds) — returns targeted snippets instead of full pages. Reserve WebFetch for stable authoritative reference pages only. (Source: agent inference 032526 — architectural decision during guardian upgrade session)
- [032526] TOOLS: `mcp__jcodemunch__get_file_outline` should be the first move before reading any code file — provides function/class structure without loading full content. (Source: agent inference 032526 — token efficiency upgrade design session)
- [032526] TOOLS: `mcp__context7__query-docs` with topic parameter returns only the relevant doc section — more efficient than WebFetch on library documentation pages. Sequence: resolve-library-id → query-docs with specific topic string. (Source: agent inference 032526 — token efficiency upgrade design session)
- [040526] WINDOWS: `mv` of directories containing many freshly-written files hits PERMISSION errors on Windows (antivirus/search indexer holds file handles briefly). Workaround: mkdir destination, mv files individually, then rmdir source. Do not retry with sleep — it does not resolve the lock. (Source: empirical 040526 — 5 failed retries incident log 2026-04-05)

## Project Patterns
- [032526] WORKFLOW: Tasks confirmed by the user but not yet executed ("sì falli" with no follow-through) must be tracked explicitly as open threads in the session. Confirmed-but-unexecuted tasks are invisible to the next session unless logged. (Source: agent inference 032526 — session review at wrap-up)

## Known Failure Modes
- [040426] ASTRO: `output:'static'` + `export const prerender = false` on any page causes `NoAdapterInstalled` build failure. Static sites on shared hosting (Netsons) must use `getStaticPaths` only — SSR requires a Node adapter. (Source: empirical 040426 — deploy #700 failure, fixed commit 6df48f2)
- [040426] AUTH: Brave browser partitions/blocks localStorage even with shields off. Use `document.cookie` as primary auth token storage on sites targeting wellness/holistic professionals. localStorage as fallback only. (Source: empirical 040426 — AdminGuard fix)
- [040426] WORKTREES: Before merging a worktree that rewrote a shared file, always diff key pages against main. Merging silently replaces the working version and can introduce SSR patterns that break static builds. (Source: empirical 040426 — [slug].astro SSR merge broke deploy #699)
- [040926] TOOLS: GitHub Secrets cannot be updated via `gh` CLI if gh is not in Windows PATH. Use Python + PyNaCl + GitHub REST API with `git credential fill` to extract the PAT and encrypt secrets via libsodium. (Source: empirical 040926)
- [040926] TOOLS: Playwright MCP reports "browser already in use" after abnormal session termination. Deleting the lockfile in ms-playwright/mcp-chrome-*/lockfile is insufficient — the MCP server holds the handle in memory. Full Claude Code restart required to recover. (Source: empirical 040926)

## Italiano Style Rules
- [040926] STYLE: "vale la pena [azione]" in all variants (fermarsi, nominarla, investire, chiedersi) is a banned meta-phrase per CLAUDE.md rule 5. Replace with direct phrasing. (Source: empirical 040926 — 6 corrections in reel audit)
- [040926] STYLE: Secrets must never be written to Daily Notes or any tracked file. Redact immediately with "[REDACTED]" if found. (Source: auditor finding 040926)
