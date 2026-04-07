---
description: Comprehensive GEO audit with live LLM visibility intelligence — entity architecture, llms.txt, JSON-LD, AI bot governance, fact-density, copy-paste fixes
argument-hint: "[domain, page, brand name, or 'full']"
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

GEO audit that fetches current LLM visibility best practices before scanning. Not a static checklist — live intelligence + systematic analysis. Every finding includes LLM behavior impact and copy-paste fix.

## Steps

### Step 1: Determine scope

If argument provided:
- Domain URL → full site GEO audit
- Specific page URL → single-page GEO review
- Brand name → entity architecture audit (Knowledge Graph focus)
- "full" → complete audit of entire project

If no argument:
- Default to current project: scan for schema files, robots.txt, llms.txt in working directory
- If live site URL known: use that as primary scope

### Step 2: Collect baseline data

Read existing files to understand current state:
```
Read: robots.txt (if exists)
Read: /llms.txt (if exists)
Read: /llms-full.txt (if exists)
Grep: "application/ld+json" — find all JSON-LD blocks in codebase
Grep: "schema.org" — find all schema references
```

If live domain is known:
```
WebFetch: [domain]/robots.txt → check AI bot permissions
WebFetch: [domain]/llms.txt → check llms.txt presence and quality
WebFetch: [domain] → extract JSON-LD from homepage
WebSearch: "[brand name]" → check Knowledge Panel presence
```

### Step 3: Delegate to geo-guardian

Spawn the geo-guardian agent with full context:

```
geo-guardian: Full GEO audit of [scope].

Context:
- Brand/Project: [name if known]
- Domain: [URL if known]
- Site type: [e-commerce / SaaS / B2B / personal brand / local business / other]
- Primary target LLMs: [ChatGPT / Perplexity / Gemini / all]
- Current schema files found: [list or "none detected"]
- robots.txt status: [found/not found, AI bots allowed/blocked/unknown]
- llms.txt status: [found/not found]

Tasks:
1. Fetch current GEO intelligence (Exa + WebFetch — do this first)
2. Run complete GEO checklist (all sections A through K)
3. Check entity architecture: Wikidata QID, JSON-LD nesting, sameAs links
4. Check AI bot governance: GPTBot, ClaudeBot, Google-Extended, PerplexityBot
5. Check llms.txt: presence, quality, fact-density
6. Check Consensus Engineering: brand name/facts consistent across all platforms
7. Provide severity-ranked findings with:
   - Component location (file:line or page URL)
   - LLM behavior consequence (what the model does differently when this is missing)
   - Copy-paste ready fix (JSON-LD, robots.txt block, llms.txt content)
   - GEO best practice reference
8. Produce final verdict: VISIBLE / PARTIALLY VISIBLE / INVISIBLE TO LLMs
```

### Step 4: Process results

**VISIBLE**: Log pass, note any SOV monitoring setup recommendations.

**PARTIALLY VISIBLE**:
- Present findings to user
- Ask: "Want me to implement the medium/low fixes now?"
- Apply approved fixes

**INVISIBLE TO LLMs**:
- Critical/High findings block client delivery
- Present all findings in priority order
- Ask: "Want me to implement fixes now? I'll start with robots.txt + llms.txt as highest-impact quick wins."
- Apply fixes
- Re-run GEO check on modified files to verify

### Step 5: Generate deliverables

After fixes are applied (or if user wants the full package):

**For client delivery, produce:**
1. `GEO-REPORT.md` — executive summary + full checklist results
2. `llms.txt` — ready to deploy at domain root
3. `schema-geo.json` — Organization JSON-LD block (copy-paste into `<head>`)
4. `robots-ai.txt` — robots.txt additions for AI bot governance (merge with existing)

### Step 6: Update GEO memory

After review, ask geo-guardian to update its memory:
- Log brand entity profile (Wikidata status, schema type, GEO maturity)
- Log open issues with locations
- Log resolved issues
- Update SOV baseline if monitoring data was gathered
- Record any GEO intelligence signals observed this session

### Step 7: Log to daily note

Append GEO review summary to daily note:
```markdown
## GEO Review — HH:MM
- Scope: [what was reviewed]
- Verdict: [VISIBLE / PARTIALLY VISIBLE / INVISIBLE]
- Wikidata QID: [present / missing]
- llms.txt: [present / created / missing]
- Critical: [N] | High: [N] | Medium: [N] | Low: [N]
- Fixed: [N applied fixes]
- Open: [N remaining — link to GEO memory]
```

### Step 8: Knowledge nomination

If new GEO patterns were found that apply broadly, nominate to knowledge base:

Append to `.claude/knowledge-nominations.md`:
```
[date] GEO: [pattern] — [why it matters for this project type]
Source: geo-guardian empirical — found during review of [scope]
```
