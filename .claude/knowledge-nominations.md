# Knowledge Nominations

Candidate learnings from agents and sessions. The auditor reviews these
during each audit cycle and promotes valid ones to knowledge-base.md.

## Pending Nominations

- [031626] /wrap-up: Design system v2 — gold (#C58A37) vietato sui bottoni. CTA → --black (#0A0A0A), WhatsApp → #25D366. Trovata violazione su index.astro e chi-sono.astro, corretta. | Evidence: audit T3, fix verificato preview_inspect
- [031626] /wrap-up: Gli agent Explore possono produrre false positive — verificare sempre direttamente nel codice prima di applicare fix. (Meta description su [slug].astro era già corretta.) | Evidence: Grep src/pages/[slug].astro + src/layouts/BaseLayout.astro
- [031626] /wrap-up: Hero mobile (≤640px) — la foto di index.astro era below the fold. Fix: CSS order:-1 + avatar circolare 90px. | Evidence: preview_inspect bounding box 031626

- [031726] /wrap-up: In questo progetto il dev server gira dal worktree (D:/marcomunich.com/.claude/worktrees/mystifying-thompson/), NON dal main repo. Scrivere sempre i file nel worktree, poi sincronizzare al main. File scritti solo nel main → 404 a runtime. | Evidence: test curl 031726
- [031726] /wrap-up: STATS_PASSWORD nel .env contiene `\n` letterale che Vite interpreta come newline reale → il cookie `stats2024` non matcha. Fix permanente: `.trim()` su `expectedPwd` in tutti i file admin. | Evidence: grep .env + test login 031726
- [031726] /wrap-up: GitHub API su repo privato con token vuoto → 401 se si invia `Authorization: token ` (stringa vuota). Fix: aggiungere l'header Authorization solo se il token è non-empty. | Evidence: test fetch edit/[slug].astro 031726
- [031726] /wrap-up: `import.meta.glob('...', { eager: true, as: 'raw' })` funziona nelle pagine SSR Astro per leggere frontmatter di tutti gli .mdoc a build time — usato per la lista dei 201 articoli senza chiamate GitHub API. | Evidence: /admin/articoli.astro carica 201 articoli in un colpo solo 031726
