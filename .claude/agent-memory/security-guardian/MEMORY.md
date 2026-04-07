# Security Guardian Memory

## Project Security Profile
- Stack: Astro 5.4.0 (static site, prerender=true), Tailwind CSS, @markdoc/markdoc 0.4.0, js-yaml 4.1.0
- Auth method: Client-side JS guard (AdminGuard.astro) — SHA-256 cookie in browser
- Server-side: admin-auth.ts (cookie = raw ADMIN_PASSWORD from env) — not wired to middleware, dead code on live site
- Database: None
- Deployment: GitHub Actions → FTP to Netsons (static HTML) — also Cloudflare Pages referenced
- Instagram publishing: scripts/publish_carousel.py — GitHub Actions secrets
- Last full review: 2026-04-06

## Known Vulnerabilities (Open)

### AdminGuard.astro
- SEC-001: [AdminGuard.astro:14] | CRITICAL | Cookie written without Secure flag — transmissible over HTTP | found: 2026-04-06 | CONFIRMED: 2026-04-06
- SEC-002: [AdminGuard.astro:4,18] | CRITICAL | Full auth bypass: EXPECTED hash hardcoded in client-side JS (line 4), served in static HTML. Any visitor reads it, sets cookie to that value, bypasses auth entirely without knowing the password | found: 2026-04-06 | CONFIRMED: 2026-04-06
- SEC-003: [AdminGuard.astro:20,57] | HIGH | Auth token stored in localStorage (XSS-readable) as fallback and as primary write path | found: 2026-04-06 | CONFIRMED: 2026-04-06
- SEC-004: [AdminGuard.astro:49-65] | HIGH | No brute-force / rate-limit protection on password form — unlimited attempts in browser | found: 2026-04-06 | CONFIRMED: 2026-04-06

### [slug].astro
- SEC-012: [[slug].astro:135] | MEDIUM | Markdoc rendered HTML injected via Fragment set:html — Markdoc 0.4.0 strips raw HTML tags by default BUT content comes from local .mdoc files (not user input). Risk is low today but escalates to HIGH if any CMS user input path ever reaches this pipeline | found: 2026-04-06
- SEC-013: [[slug].astro:97-98] | LOW | set:html used for JSON-LD schema blobs built from fm.schema_faq — values sourced from YAML frontmatter in local .mdoc files, no user input path currently. If Keystatic allows external contributors to edit .mdoc files, fm.schema_faq values could inject script content | found: 2026-04-06
- SEC-014: [[slug].astro:57-61] | LOW | seo_image from frontmatter accepted as absolute URL without validation (fm.seo_image.startsWith('http')). An attacker who can edit .mdoc frontmatter can set any external URL as og:image. No JavaScript execution risk at current usage, but worth noting if URL is passed to an img src without rel=noopener context | found: 2026-04-06

### publish_carousel.py
- SEC-008: [publish_carousel.py:155,173,188] | MEDIUM | access_token sent as HTTP POST body parameter (`data=payload`) — Instagram's own API design, not a code error. Token may appear in server-side access logs on Instagram's infrastructure and in any HTTP proxy logs. Authorization header would be preferable but Graph API mandates POST body. Status: by-design, document and accept | found: 2026-04-06 | REVIEWED: 2026-04-06 — no fix available
- SEC-009: [publish_carousel.py:331] | LOW | Exception str(e) may include API response body with token hints; logged to stderr via GitHub Actions | found: 2026-04-06 | CONFIRMED: 2026-04-06
- SEC-015: [publish_carousel.py:127-138] | LOW | slide_urls_for() builds URLs from entry["id"] and entry["slide_count"] without type-enforcing int. If schedule.json is tampered (e.g. via a PR from a compromised contributor), string values could produce unexpected URLs but no injection risk exists in URL construction (f-string, no shell execution) | found: 2026-04-06

### Previously noted (other files)
- SEC-005: [admin-auth.ts:25] | HIGH | Cookie comparison via String.includes() — prefix/suffix injection bypass possible | found: 2026-04-06
- SEC-006: [admin-auth.ts:7,25] | HIGH | Cookie stores raw ADMIN_PASSWORD (plaintext token) | found: 2026-04-06
- SEC-007: [admin-auth.ts:20-21] | MEDIUM | Authorization: Bearer accepts raw password | found: 2026-04-06
- SEC-010: [admin-panel.astro:6] | MEDIUM | prerender=true + no AdminGuard = admin panel HTML fully public | found: 2026-04-06
- SEC-011: [admin-panel.astro] | LOW | Dead Vercel link leaks internal project URL | found: 2026-04-06

## Resolved Vulnerabilities
(none yet)

## Project-Specific Rules
- Site is fully static (prerender=true everywhere): no SSR request handling → admin-auth.ts is currently dead code for the live site but creates false confidence | 2026-04-06
- AdminGuard is the sole auth layer for all /admin/* routes: if bypassed, all admin pages are exposed | 2026-04-06
- Instagram token stored as GitHub Secret (correct) — not in source or .env files | 2026-04-06
- Markdoc 0.4.0 strips raw HTML by default (no allowHTML): [slug].astro content pipeline is protected from HTML injection as long as content originates from local .mdoc files | 2026-04-06
- Astro's set:html does NOT escape content — it is a trusted raw HTML injection. Safe only when the source is compile-time controlled content | 2026-04-06

## CVE Watch List
- CVE-2026-33769: astro <5.18.1 — SSRF via unanchored matchPathname wildcard in remotePatterns | current version 5.4.0 is AFFECTED | update to >=5.18.1 | added: 2026-04-06
- CVE-2026-27829: astro <5.17.3 — SSRF | current version 5.4.0 is AFFECTED | update to >=5.17.3 | added: 2026-04-06
- CVE-2025-64764: astro <5.15.8 — XSS | current version 5.4.0 is AFFECTED | update to >=5.15.8 | added: 2026-04-06
- CVE-2026-25545: Astro SSRF via Host Header Injection in SSR error pages — mitigated by static build (prerender=true) but update recommended | added: 2026-04-06

## Trend Intelligence
- 2026-04-06: Client-side auth bypass via exposed hash/token in JS bundles actively trending; Astro framework has 3 open CVEs affecting v5.4.0 (update to >=5.18.1 needed); Markdoc default strips HTML making set:html safer when content is local; Instagram API token exposure via GitHub Actions logs continues to be a risk vector | source: exa search
