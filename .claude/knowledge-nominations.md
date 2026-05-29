# Knowledge Nominations

Candidate learnings from agents and sessions. The auditor reviews these
during each audit cycle and promotes valid ones to knowledge-base.md.

## Pending Nominations

- [051526] /safe-clear: skill marketate "Built by the people who built Claude" su Instagram NON sono necessariamente di Anthropic. impeccable e motion-principles sono community (pbakaus + kylezantos). Sempre verificare authorship prima di trattare come ufficiali. Anthropic ufficiale = github.com/anthropics/skills + plugin `anthropic-skills:*` o `frontend-design:*`. | Evidence: ricerca 051526 + carousel techbitswn

- [051526] /safe-clear: jcodemunch ha hard limitation sui nomi cartella con spazi — non risolto da junction Windows perché jcodemunch risolve al target reale. Workaround possibili: rinominare cartella, oppure skip. Pattern: per nuovi progetti, usare slug senza spazi nel nome cartella fin dall'inizio. | Evidence: tentativi Giacomo Bucchi 051426 + 051526

- [051526] /safe-clear: pipeline IG carousel extraction via playwriter funziona dove gallery-dl e yt-dlp falliscono (login wall). Navigazione URL diretta con `?img_index=N` + screenshot per slide. Snapshot di playwriter più affidabile di click su carousel button (`button[aria-label="Next"]`) che può andare in timeout. | Evidence: 2 carousel scaricati 051526

- [051526] /safe-clear: browser-harness install via uv (`uv tool install -e .` da clone in path durabile come `D:\App\browser-harness`). Coesiste con playwriter senza conflitti. Per Claude Code auto-load, aggiungere `@<path>/SKILL.md` al global CLAUDE.md. Auto-update con `browser-harness --update -y` quando vede banner upgrade. | Evidence: install 051526

- [052926] /wrap-up: GitHub Actions cron `0 9 * * *` (orari "rotondi") può tardare 10-30 min nei picchi traffico GH. Non bug, è latency reale dei cron scheduler. Per task time-sensitive: 1) usare orario non-rotondo (es. `7 9 * * *`), 2) workflow_dispatch backup, 3) monitoring timing. | Evidence: cron 052926 09:00 UTC partito solo dopo le 11:00 CEST, forzato manualmente.

- [052926] /wrap-up: Astro `@astrojs/sitemap` plugin genera `sitemap-index.xml` (con `-index`) NON `sitemap.xml`. Audit SEO via `curl /sitemap.xml` ottiene 404 ma NON è problema reale se robots.txt punta a `/sitemap-index.xml`. Falso allarme da evitare. | Evidence: scan SEO 052926.

- [052926] /wrap-up: Dual-positioning JSON-LD pattern — `hasOccupation` accetta ARRAY di Occupation objects in Schema.org, permette rappresentare entità con due specializzazioni distinte senza creare due Person separate. Ordine matters: prima è primaria per gli LLM. | Evidence: BaseLayout.astro fix 052926 — Marco dual web dev (Vicenza) + olistico (Italia).

- [052926] /wrap-up: Catch-all `*.txt` in .gitignore catturava silenziosamente `public/llms.txt` e `public/llms-full.txt` — file critici per visibilità AI. Audit: `git check-ignore -v` su file pubblici "ovvi" (llms*.txt, robots.txt, security.txt, humans.txt) PRIMA di crearli. Cross-project. | Evidence: `git check-ignore -v public/llms-full.txt` → `.gitignore:33:*.txt`.

- [052926] /wrap-up: `publish_carousel.py` ha guard idempotente — rifiuta re-publish con `ERROR: carousel N already published on YYYY-MM-DD`. Per re-publish lecito (es. fix grafico) serve resettare manualmente `status: published → scheduled, media_id: null` in schedule.json. Future improvement: flag `--force-republish` esplicito. | Evidence: re-publish 106 052926 bloccato al primo tentativo.

- [052926] /wrap-up: Quando l'utente dice "fonti troppo piccole" su un design, invocare design-guardian Spot Check (non Full Brief) e applicare le proposte CSS al template UNA VOLTA — beneficio retroattivo per tutti i render futuri che usano lo stesso template. Pattern: fix typography globally then re-render only affected slides. | Evidence: sett-01 caroselli — fix CSS in `week-carousels-v2.html` ha sistemato 106 e renderà sett-02 già grande senza ulteriore lavoro.
