# Knowledge Nominations

Candidate learnings from agents and sessions. The auditor reviews these
during each audit cycle and promotes valid ones to knowledge-base.md.

## Pending Nominations

- [040626] /wrap-up: Pattern "non X ma Y" può nascondersi in **trampolino semantico** cross-frase ("X non viene da A. Viene da B") che sfugge a regex literal — serve detector euristico che splitta per frasi e cerca eco del verbo affermativo nella frase successiva alla negazione. | Evidence: utente ha corretto 2 volte lo stesso pattern con forme diverse nella sessione 040626, fix in `scripts/audit_caroselli_style.py::detect_semantic_trampoline()`
- [040626] /wrap-up: Varietà delle aperture è regola trasversale al singolo pattern — una formula lecita diventa pattern AI appena si ripete in 2+ aperture consecutive. Non basta evitare "C'è un..." specifico, serve ruotare attivamente 10 registri (scena, affermazione diretta, osservazione temporale, domanda implicita, dettaglio sensoriale, numero concreto, richiamo esperienza lettore, contrasto interno, scelta, nome di situazione). | Evidence: correzione esplicita utente "non è questione di quale di queste mi suona giusta, è questione di usarle tutte"
- [040626] /wrap-up: Instagram caption hard limit 2200 char — target pratico 1750-2100 per margine hashtag/link/emoji. Caption mini-articolo da 400+ parole facilmente sfora, servono 300-350 parole italiane per stare in range. | Evidence: pilot batch 8 post aveva 6/8 sopra 2200 char, riscritti sotto target
- [040626] /wrap-up: Quando utente chiede "mockup visivo dove lo vedo" dopo content work puramente testuale, vuole feedback grafico reale — creare pipeline render HTML→PNG via Playwright è il path più veloce (5 min dal requisito al file PNG aperto in Explorer). | Evidence: sessione 040626 post singoli mockup
- [032526] /wrap-up: sec-review.md scope was silently limited to "A through L" while security-guardian had sections M (GDPR) and N (Supply Chain) — a spec drift that caused those sections to never run via /sec-review. Fixed by explicitly naming all sections. | Evidence: T3 audit WARN-1, fixed same session | Auditor note: session-specific fix, memory-only, not promoted to knowledge-base
