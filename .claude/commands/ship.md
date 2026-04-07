---
description: Full site audit before client delivery — crawls every page, UX/design check + full security sweep, fixes issues, produces client-ready package with shareable link
argument-hint: "[site URL, 'local', or leave blank to auto-detect]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Agent
  - Glob
  - Grep
  - Bash(git log:*, git diff:*, git status:*, npx:*, node:*, mkdir:*)
  - WebSearch
  - WebFetch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_screenshot
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_fill
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_wait_for
  - mcp__semgrep__scan_directory
  - mcp__semgrep__analyze_results
  - mcp__semgrep__filter_results
  - mcp__semgrep__list_rules
  - mcp__exa__web_search_exa
  - mcp__exa__web_search_advanced_exa
  - mcp__jcodemunch__get_file_outline
  - mcp__jcodemunch__get_file_tree
  - mcp__context7__query-docs
  - mcp__context7__resolve-library-id
---

Complete pre-delivery audit. Visits every page of the site, runs a full design/UX review + security sweep, applies fixes, and produces a client-ready package with a shareable link and status badge. Only call this when you actually intend to ship.

---

## Phase 0: Setup

### Step 0A — Determine target URL

Priority order:
1. If argument provided → use it directly
2. If `local` → read `package.json` / `vite.config.*` / `next.config.*` for dev server port, then start dev server if needed
3. If blank → check `package.json` for `homepage`, `NEXT_PUBLIC_URL`, or `VITE_BASE_URL`
4. If still unknown → ask the user for the URL before continuing

### Step 0B — Start browser session

```
mcp__playwright__browser_navigate: [target URL]
mcp__playwright__browser_resize: { width: 1440, height: 900 }
```

If navigation fails, stop and report: "Site is not reachable at [URL]. Confirm the server is running."

### Step 0C — Initialize SHIP report

Create file `SHIP-REPORT.md` in project root:

```markdown
# SHIP Report — [site URL]
Generated: [current date and time]
Status: IN PROGRESS ⏳

---
```

---

## Phase 1: Crawl — Map all pages

### Step 1A — Discover all routes

From the homepage, collect every internal link. Build a page map:
- Follow `<a href>` tags that point to the same domain
- Check `sitemap.xml` if accessible (`[URL]/sitemap.xml`)
- Check route files in code: `app/`, `pages/`, `src/routes/`, `src/views/` (read with jcodemunch outline)
- Deduplicate, remove anchors (#), remove query variants
- Include special states: 404 page, empty states, logged-in views if accessible

Produce a **Page Map** table:

```
| # | Path | Title | Type |
|---|------|-------|------|
| 1 | / | Home | landing |
| 2 | /about | About | content |
...
```

Log page count: "Found N pages to audit."

### Step 1B — Check for interactive surfaces

For each page, note presence of:
- Forms (login, contact, search, newsletter, checkout)
- File upload inputs
- Authentication gates
- API-driven content (async loaded sections)

These get extra scrutiny in Phase 3.

---

## Phase 2: Visual & UX Audit

### Step 2A — Generate and run visual audit script (Playwright CLI)

**Primary: Playwright CLI** — scrive uno script, lo esegue una volta, raccoglie tutto in un JSON. Atomico, riproducibile, accesso pieno all'API Playwright.

```bash
mkdir -p .claude/scripts/screenshots
```

Scrivi `.claude/scripts/visual-audit.js` con `BASE_URL` e `PAGES` dall'Step 1A, poi eseguilo:

```javascript
const { chromium } = require('playwright');
const BASE_URL = '__BASE_URL__';
const PAGES = __PAGES__;
const VIEWPORTS = [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 768,  height: 1024, name: 'tablet' },
  { width: 375,  height: 812,  name: 'mobile' }
];
(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const path of PAGES) {
    const pageResult = { path, viewports: {}, consoleErrors: [], brokenResources: [] };
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const errors = [];
      const broken = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', r => { if (!r.ok() && r.request().resourceType() !== 'document') broken.push(`${r.status()} ${r.url()}`); });
      await page.goto(BASE_URL + path, { waitUntil: 'networkidle', timeout: 15000 });
      const slug = (path.replace(/\//g, '-') || '-home');
      await page.screenshot({ path: `.claude/scripts/screenshots/${vp.name}${slug}.png`, fullPage: true });
      const checks = await page.evaluate(() => ({
        hasH1:           document.querySelectorAll('h1').length > 0,
        hasLang:         document.documentElement.lang !== '',
        allImgsHaveAlt:  [...document.querySelectorAll('img')].every(i => i.hasAttribute('alt')),
        noHorizScroll:   document.body.scrollWidth <= window.innerWidth,
        hasFavicon:      !!document.querySelector('link[rel*="icon"]'),
        title:           document.title,
      }));
      pageResult.viewports[vp.name] = { checks, errors };
      pageResult.brokenResources.push(...broken);
      await page.close();
    }
    results.push(pageResult);
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
```

```bash
node .claude/scripts/visual-audit.js
```

Leggi il JSON di output. Mappa i `checks` falliti e gli `errors` ai punti del checklist Step 2B.

**Fallback (se Playwright non è installato nel progetto):** usa `mcp__playwright__browser_navigate` + `mcp__playwright__browser_resize` + `mcp__playwright__browser_screenshot` sequenzialmente per ogni pagina.

### Step 2B — UX Checklist (per page)

Evaluate each page against this checklist. Mark ✅ PASS / ⚠️ WARN / ❌ FAIL:

**Visual Hierarchy**
- [ ] Clear primary CTA — obvious what the user should do
- [ ] Heading size progression logical (H1 > H2 > H3 — no skipped levels)
- [ ] Font sizes readable at all viewports (body ≥ 16px, mobile ≥ 14px)
- [ ] Text has sufficient contrast (WCAG AA: ≥ 4.5:1 for body, ≥ 3:1 for large text)

**Layout & Spacing**
- [ ] Consistent spacing scale used throughout (no arbitrary pixel values visible)
- [ ] Adequate whitespace — content not cramped
- [ ] Grid alignment consistent across sections
- [ ] No orphaned elements (lone items in a grid, trailing text on one word)
- [ ] Responsive: no horizontal scroll, no broken layout at any viewport

**Typography**
- [ ] Maximum 2 font families in use
- [ ] Line height adequate (body ≥ 1.5, headings ≥ 1.2)
- [ ] Line length comfortable (45–75 characters for body text)
- [ ] No ALL CAPS for long text blocks

**Color & Brand**
- [ ] Consistent color palette across all pages
- [ ] Brand colors applied coherently (primary CTA always same color)
- [ ] No jarring color transitions between sections/pages
- [ ] Dark mode (if present) fully consistent — no light mode remnants

**Interaction & Feedback**
- [ ] All interactive elements have visible hover/focus states
- [ ] Buttons clearly distinguishable from non-interactive elements
- [ ] Loading states present where content is async
- [ ] Error states present on all forms
- [ ] Success feedback present after form submissions

**Images & Media**
- [ ] All images have alt text (check DOM: `mcp__playwright__browser_evaluate`)
- [ ] Images not stretched or distorted at any viewport
- [ ] No broken images (check network: `mcp__playwright__browser_network_requests`)
- [ ] Video/media has captions or text alternative if content-bearing

**Performance Signals**
- [ ] No layout shift visible on load (check console for CLS warnings)
- [ ] No render-blocking visible (page doesn't flash unstyled)
- [ ] Images appear to be sized appropriately (not loading 4k images for thumbnails)

**Accessibility (basic)**
- [ ] Keyboard navigation works (Tab through interactive elements)
- [ ] Focus indicator visible when tabbing
- [ ] Form inputs have associated labels
- [ ] Language attribute set on `<html>` tag

### Step 2C — Cross-page consistency check

After all pages are screenshotted, compare:
- Header: same across all pages?
- Footer: same across all pages?
- Navigation active states: correct on each page?
- 404 page: branded (not default server error)?
- Favicon: present and correct?
- Page titles (`<title>` tag): unique and descriptive on each page?

### Step 2D — Invoke design-guardian for deep design review

```
Agent(design-guardian): Spot Check mode.

Site URL: [URL]
Pages reviewed: [list all pages from map]
Screenshots available: yes (taken in Steps 2A)

Evaluate:
1. Is the visual style consistent and intentional across all pages?
2. Are there any pages that feel "out of system" (different style, different quality)?
3. Identify the top 3 UX friction points that would make a client embarrassed to show this to their own clients
4. Rate overall design quality: EXCEPTIONAL / SOLID / NEEDS WORK / NOT READY

Return: ranked list of design issues with specific page + element location and fix suggestion.
```

---

## Phase 3: Security Audit

### Step 3A — Static code analysis with semgrep

```
mcp__semgrep__scan_directory: [project root]
mcp__semgrep__analyze_results
mcp__semgrep__filter_results: severity=[CRITICAL, HIGH]
```

Review output: note all CRITICAL and HIGH findings with file:line locations.

### Step 3B — Live security test on each interactive surface

For each form and interactive endpoint found in Step 1B:

**Forms:**
```
mcp__playwright__browser_navigate: [page with form]
mcp__playwright__browser_snapshot  → inspect form structure
```
Check:
- CSRF token present on state-changing forms?
- Input fields have maxlength / type validation?
- File upload: accepted types restricted?
- Password fields: autocomplete="current-password" set?
- No sensitive data in URL parameters

**Authentication pages (if present):**
- Rate limiting on login? (attempt 5 rapid logins, check for lockout/captcha)
- Password reset: token in URL or body? Expiry?
- "Remember me": secure cookie flags?

**Network requests:**
```
mcp__playwright__browser_network_requests
```
Check:
- No API keys or tokens in request URLs
- Sensitive endpoints use HTTPS only
- No mixed content (HTTP resources on HTTPS page)
- CORS headers appropriate

**HTTP headers check:**
```
mcp__playwright__browser_evaluate:
  fetch(window.location.href).then(r => [...r.headers.entries()])
```
Verify presence of:
- `Content-Security-Policy`
- `X-Frame-Options` or `frame-ancestors` in CSP
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy`
- `Permissions-Policy`

### Step 3C — Delegate full security sweep to security-guardian

```
Agent(security-guardian): Full security sweep for client delivery.

Site URL: [URL]
Stack: [identified in Phase 0]
Interactive surfaces: [list from Step 1B]
Semgrep findings: [paste CRITICAL and HIGH from Step 3A]
Header audit: [paste findings from Step 3B]

Tasks:
1. Fetch current threat intelligence for this stack (Exa — site:owasp.org, site:portswigger.net, site:thehackernews.com)
2. Run complete checklist sections A through N
3. Pay extra attention to: forms, auth flows, API endpoints, exposed headers
4. Severity-rank all findings
5. Verdict: SECURE / CONDITIONALLY SECURE / REQUIRES REMEDIATION

Return: all findings with exact location, attack scenario, copy-paste fix, OWASP/CVE ref.
```

---

## Phase 3B: Legal Audit

### Step 3D — Delegate legal compliance sweep to legal-guardian

```
Agent(legal-guardian): Full Review mode. Legal compliance sweep for client delivery.

Site URL: [URL]
Target market: [detect from language, currency, address fields]
Project type: [detect from codebase — e-commerce / lead gen / SaaS / brochure]
Interactive surfaces: [list from Step 1B — forms, checkouts, newsletters]
Third-party scripts detected: [list from network requests in Step 3B]

Tasks:
1. Fetch current regulation guidance (Garante, GDPR.eu, AGCM) — do this first
2. Run complete compliance checklist sections A through J
3. Pay extra attention to: cookie banner, privacy policy completeness, e-commerce rights, consent chain
4. Severity-rank all findings
5. Verdict: COMPLIANT / CONDITIONALLY COMPLIANT / NON-COMPLIANT

Return: all findings with exact page/location, regulation article, risk level, copy-paste compliant text.
```

---

## Phase 3C: Performance Audit

### Step 3E — Performance sweep (performance-guardian)

```
Agent(performance-guardian): Full Review mode. Performance sweep for client delivery.

Site URL: [URL]
Stack: [identified in Phase 0]
Live URL: available — Playwright already running from Phase 2
Key pages to measure: [homepage + top 2-3 pages by traffic/importance from page map]

Tasks:
1. Fetch current Core Web Vitals thresholds (web.dev — do this first)
2. Measure LCP, CLS, INP on key pages using Playwright evaluate
3. Audit network requests for total transfer size and render-blocking resources
4. Run complete performance checklist sections A through J
5. Severity-rank all findings by metric impact
6. Verdict: FAST / ACCEPTABLE / REQUIRES OPTIMISATION

Return: all findings with exact metric impact, root cause, and copy-paste fix.
```

---

### Step 3F — Cross-Domain Audit (Audit Mode on all four guardians)

After all domain reviews are complete, run Audit Mode in parallel to catch cross-domain conflicts:

```
Agent(design-guardian): Audit Mode.
Read all four guardian memories. Check cross-domain conflicts between design decisions, security constraints, legal requirements, and performance budgets. Return: CONSISTENT / GAPS FOUND / CONFLICTS FOUND.

Agent(security-guardian): Audit Mode.
Read all four guardian memories. Check cross-domain conflicts between security headers/constraints, design scripts, legal consent chain, and performance CDN usage. Return: CONSISTENT / GAPS FOUND / CONFLICTS FOUND.

Agent(legal-guardian): Audit Mode.
Read all four guardian memories. Check cross-domain conflicts between legal requirements, security implementation, design patterns, and analytics script loading. Return: CONSISTENT / GAPS FOUND / CONFLICTS FOUND.

Agent(performance-guardian): Audit Mode.
Read all four guardian memories. Check cross-domain conflicts between performance optimizations, security headers (CSP blocking CDN resources), design animations (causing CLS), and legal scripts (consent manager weight). Return: CONSISTENT / GAPS FOUND / CONFLICTS FOUND.
```

Compile cross-domain findings into a single conflicts table:

| Conflict | Domain A | Domain B | Resolution |
|----------|----------|----------|------------|
| [e.g. CSP blocks cookie consent script] | Security | Legal | [fix] |

---

## Phase 4: Fix Cycle

### Step 4A — Triage all findings

Compile a single ranked list from Phase 2 and Phase 3:

| Priority | Finding | Type | Location | Fix effort |
|----------|---------|------|----------|------------|
| CRITICAL | ... | Security | file:line | ... |
| HIGH | ... | UX/Design | page + element | ... |
| ...

### Step 4B — Apply fixes

**CRITICAL and HIGH:** Fix immediately. Do not ship with these open.
**MEDIUM:** Fix if quick (< 5 min). Otherwise defer to backlog with note.
**LOW:** Log in SHIP report, do not block delivery.

After applying fixes:

```
mcp__playwright__browser_navigate: [affected pages]
mcp__playwright__browser_screenshot  → verify fix visually
```

Re-run semgrep on modified files:
```
mcp__semgrep__scan_directory: [modified files only]
```

### Step 4C — Verify: no regressions

For each fixed page, run abbreviated UX checklist (Step 2B: layout, contrast, responsive only).
Confirm no new console errors introduced.

---

## Phase 5: Client Package

### Step 5A — Compile final SHIP report

Update `SHIP-REPORT.md` with complete findings:

```markdown
# SHIP Report — [site URL]
Generated: [date and time]

## Status

[Choose one:]
✅ SHIPPED — All critical and high issues resolved. Site is ready for client delivery.
⚠️ CONDITIONALLY SHIPPED — Minor issues remain (Medium/Low). Site is deliverable with noted caveats.
❌ NOT READY — Open critical or high issues block delivery. See findings below.

---

## Site Map
[N pages audited]
| Path | Title | Status |
|------|-------|--------|
| / | Home | ✅ |
| /about | About | ✅ |
...

---

## Design & UX
Design quality: [EXCEPTIONAL / SOLID / NEEDS WORK]

### Issues Fixed
- [page] [element] — [what was wrong] → [what was done]

### Remaining (Medium/Low)
- [page] [element] — [issue] — [suggested fix for next sprint]

---

## Performance
Verdict: [FAST / ACCEPTABLE / REQUIRES OPTIMISATION]
LCP: [X] | CLS: [X] | INP: [X] | Bundle: [XKB gzipped]

### Issues Fixed
- [CRITICAL/HIGH] [location] — [metric impact] → [fix applied]

### Remaining (Medium/Low)
- [MEDIUM] [location] — [issue] — [suggested fix]

---

## Security
Verdict: [SECURE / CONDITIONALLY SECURE / REQUIRES REMEDIATION]

### Issues Fixed
- [CRITICAL/HIGH] [file:line or page] — [attack vector] → [fix applied]

### Remaining (Medium/Low)
- [MEDIUM] [location] — [issue] — [suggested fix]

### Headers Status
| Header | Status |
|--------|--------|
| Content-Security-Policy | ✅ / ❌ |
| X-Frame-Options | ✅ / ❌ |
| HSTS | ✅ / ❌ |
| X-Content-Type-Options | ✅ / ❌ |
| Referrer-Policy | ✅ / ❌ |
| Permissions-Policy | ✅ / ❌ |

---

## Delivery

**Site URL:** [URL]
**Audited:** [N pages]
**Issues found:** [N total] — [N critical] critical, [N high] high, [N medium] medium, [N low] low
**Issues fixed this session:** [N]
**Open (non-blocking):** [N]

This report was generated automatically by Claudify /ship.
Share this document alongside the site link for full transparency.
```

### Step 5B — Log to daily note

Append to `Daily Notes/[today].md`:

```markdown
## /ship — [HH:MM]
- Site: [URL]
- Pages audited: [N]
- Design verdict: [rating]
- Security verdict: [verdict]
- Issues fixed: [N]
- Status: [SHIPPED ✅ / CONDITIONALLY SHIPPED ⚠️ / NOT READY ❌]
```

### Step 5C — Sign off to user

Output this to the user:

```
─────────────────────────────────────────
SHIP REPORT — [site name]
─────────────────────────────────────────
Status: [SHIPPED ✅ / CONDITIONALLY SHIPPED ⚠️ / NOT READY ❌]

Site:    [URL]
Pages:   [N] audited
Fixed:   [N] issues resolved this session
Open:    [N] non-blocking notes (see SHIP-REPORT.md)

Design:      [EXCEPTIONAL / SOLID / NEEDS WORK]
Performance: [FAST / ACCEPTABLE / REQUIRES OPTIMISATION] — LCP [X] | CLS [X] | INP [X]
Security:    [SECURE / CONDITIONALLY SECURE / REQUIRES REMEDIATION]

Full report: SHIP-REPORT.md (share with client)
─────────────────────────────────────────
```

If status is NOT READY, also output:
"⚠️ The following issues must be resolved before delivery:" followed by the CRITICAL/HIGH open list.

---

## Edge Cases

**Site requires login:** Ask user for test credentials before starting. Use `mcp__playwright__browser_fill_form` to authenticate, then continue audit on authenticated pages.

**SPA / client-rendered:** After navigation, wait for content: `mcp__playwright__browser_wait_for`. Check network requests for API calls that need security review.

**No Playwright available:** Fall back to manual URL-by-URL review using WebFetch + Grep on source code. Note in report: "Screenshots unavailable — manual review mode."

**No semgrep available:** Fall back to Grep-based pattern matching for common vulnerabilities (SQL concatenation, eval(), innerHTML =, etc.).
