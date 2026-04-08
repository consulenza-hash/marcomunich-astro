# Claude Context — Claudify

This project uses Claudify, a professional operating system for Claude Code.
Always read `.claude/memory.md` before taking action.

## Quick Start
- Run `/start` to begin work
- Run `/sync` mid-day to refresh memory
- Run `/wrap-up` at end of day
- Run `/audit` to verify recent work quality
- Run `/clear` to safely flush context and resume fresh
- Run `/unstick` when stuck on a problem
- Run `/retro` for sprint retrospective
- Run `/system-audit` for deep infrastructure audit

## Key Files
- Memory: `.claude/memory.md` (read this for current context)
- Knowledge Base: `.claude/knowledge-base.md` (system-wide learned rules — read before every task)
- Task Board: `Task Board.md`
- Scratchpad: `Scratchpad.md` (quick capture, processed during /sync, cleared at /wrap-up)
- Daily Notes: `Daily Notes/` (created automatically by /start)
- Knowledge Nominations: `.claude/knowledge-nominations.md` (candidate learnings — auditor reviews)
- Command Index: `.claude/command-index.md` (all commands with triggers and tools)

## System Architecture
- **Agents** (`.claude/agents/`): Specialist subagents with persistent memory
  - `auditor` — Quality gate. Reviews work, promotes knowledge, proposes SOP revisions
  - `unsticker` — Unblocks you when stuck. Root-cause analysis, fresh approaches
  - `error-whisperer` — Translates cryptic errors into fixes. Pattern matching across sessions
  - `rubber-duck` — Forces you to articulate the real problem. Socratic debugging
  - `pr-ghostwriter` — Writes PR descriptions, commit messages, changelogs from diffs
  - `yak-shave-detector` — Catches scope creep. "You started doing X but now you're doing Y"
  - `debt-collector` — Tracks tech debt. Catalogues shortcuts, suggests when to pay them down
  - `onboarding-sherpa` — Learns a new codebase fast. Architecture maps, key-file identification
  - `archaeologist` — Excavates why code exists. Git blame + context reconstruction
- **Commands** (`.claude/commands/`): Workflow rituals and utilities
- **Hooks** (`.claude/hooks/`): Deterministic safety enforcement (logging, verification)
- **Logs** (`.claude/logs/`): Audit trail + incident log — auto-populated by hooks
- **Skills** (`.claude/skills/`): Domain knowledge, loaded on demand

## Memory Architecture (6 Tiers)
1. **memory.md** — Active session context (what you're doing now)
2. **Agent Memory** (`.claude/agent-memory/`) — Per-agent persistent knowledge across sessions
3. **Knowledge Base** (`.claude/knowledge-base.md`) — System-wide learned rules (auditor-gated)
4. **Knowledge Nominations** (`.claude/knowledge-nominations.md`) — Candidate learnings pipeline
5. **MCP Knowledge Graph** — Structured entities and relations (if memory MCP enabled)
6. **Daily Notes** — Chronological session history and handoff records

## Command Awareness

All agents can invoke system commands. Read `.claude/command-index.md` for the full catalog.

- **Self-execute**: If you have the tools a command requires, read `.claude/commands/{name}.md` and follow the procedure directly.
- **Recommend**: If you lack the tools, output `RECOMMEND: /command [args] — [reason]` for the orchestrator.
- Agents should proactively invoke commands when trigger conditions match.

## Retrieval Map — Where to look for what

| You need... | Check first | Then |
|---|---|---|
| What am I doing right now? | `memory.md` → Now | Task Board → Today |
| How to do a procedure | `.claude/commands/` or `.claude/skills/` | CLAUDE.md |
| A fact or learned rule | `knowledge-base.md` | Agent memory |
| What happened on a specific day | `Daily Notes/MMDDYY.md` | Audit trail |
| What went wrong before | `knowledge-base.md` → Hard Rules | Agent memory → Known Patterns |
| What commands exist | `.claude/command-index.md` | `.claude/commands/{name}.md` |

## Regole di stile — contenuti italiani (SEMPRE ATTIVE)

Ogni volta che scrivi testo in italiano per questo sito (copy, prompt, guide, descrizioni, caroselli, reel, articoli, newsletter, post social), rispetta tutte le regole qui sotto. Nessuna è opzionale.

### 1. Affermazione diretta, mai definizione per negazione

Afferma direttamente quello che vuoi dire, senza mai passare dalla negazione di un'alternativa come trampolino. Questo vincolo copre tutte le varianti, visibili e mascherate:

- "non X ma Y"
- "non è X, è Y"
- "non è X. È Y" (stessa cosa con il punto, lo stesso meccanismo concettuale)
- "X non è A, è B"
- "il punto non è X, è Y"
- "non si tratta di X, si tratta di Y"
- "non parlo di X, parlo di Y"
- "non sto dicendo X, sto dicendo Y"
- "non serve X, serve Y"
- "non è una questione di X, è una questione di Y"
- "X non viene da A. Viene da B"
- "X non arriva da A. Arriva da B"
- "X non riguarda A. Riguarda B"
- "X non dipende da A. Dipende da B"
- "X non è un A. È un B"

Non basta cambiare la punteggiatura, non basta allungare il testo tra la negazione e l'affermazione, non basta inserire parole in mezzo. Se la tua tesi è forte deve stare in piedi da sola, in forma affermativa, senza la stampella dell'alternativa negata.

**Unica eccezione ammessa:** quando il contrasto serve davvero al senso del testo, puoi menzionare l'alternativa dentro la stessa frase della tesi, legata da una congiunzione in un unico flusso continuo. Le congiunzioni ammesse sono: *più che*, *anziché*, *invece di*, *piuttosto che*, *al posto di*. Mai due frasi separate che funzionino come "prima nego, poi affermo".

### 2. Varietà obbligatoria delle aperture

Nessuna formula di apertura può ripetersi come stampo da post a post, da slide a slide, da paragrafo a paragrafo. In particolare vanno ruotate e mai sovrautilizzate queste aperture tipiche del registro AI italiano:

- "C'è un X che..."
- "Esiste un X che..."
- "Mi capita spesso di..."
- "Ho notato che..."
- "Nel settore olistico italiano..."
- "C'è una cosa che..."
- "Quando un counselor..."
- "Ogni volta che..."
- "Molti professionisti..."
- "La prima cosa che..."

Ciascuna di queste aperture è lecita usata una volta, diventa pattern AI quando ricompare all'apertura di due paragrafi o slide consecutivi nello stesso documento. Su dieci pezzi consecutivi, ciascun tipo di apertura va usato al massimo una volta.

Per la varietà alterna attivamente aperture di questi tipi:

- **Scena concreta vissuta** con dialogo breve o gesto fisico ("Parlo con Anna, counselor da sette anni, e mi dice che...")
- **Affermazione diretta senza preamboli** che entra subito nel merito ("Più un counselor è preparato, più fatica a farsi capire online.")
- **Osservazione personale** con riferimento temporale specifico ("L'altro giorno ho visto un post di una coach che...")
- **Domanda implicita** che il lettore si sta già facendo ("Perché i counselor più preparati faticano di più a scrivere?")
- **Dettaglio sensoriale** o frase sentita da un cliente ("Non riesco più a dormire di mercoledì notte, mi ha detto un cliente la settimana scorsa.")
- **Numero concreto o fatto verificabile** senza "c'è" ("Il settanta per cento dei counselor che seguo ha il blog fermo da mesi.")
- **Riferimento a ciò che il lettore sa già per esperienza** ("Lo sai bene cosa succede quando provi a scrivere un post e cancelli tutto dopo dieci minuti.")
- **Apertura con contrasto interno** del professionista ("Quando scrivi un post sul tuo lavoro, dentro di te succedono due cose contemporaneamente.")
- **Apertura con una scelta** che qualcuno deve fare ("Puoi fare due cose con un cliente che cancella all'ultimo minuto.")
- **Nome proprio di una situazione ricorrente** che poi spieghi ("La chiamo la trappola dell'esperto, e colpisce più o meno tutti i counselor che conosco.")

Quando non trovi l'apertura, leggi le prime parole dei tre pezzi precedenti: se iniziano tutti nello stesso registro, cambia. La varietà delle aperture è la cosa che rende il testo umano e vivo; la ripetizione è il marcatore AI più riconoscibile dopo "non X ma Y".

### 3. Scene concrete, non concetti astratti

Lavora per scene e conseguenze verificabili, non per concetti astratti. Ogni volta che usi una parola come *consapevolezza*, *lucidità*, *profondo*, *responsabilità*, *autenticità*, *nel rispetto*, *presenza*, *spiritualità*, *resilienza*, *cambiamento*, *trasformazione*, deve esserci subito prima o subito dopo un dettaglio concreto che la rende visibile al lettore: una frase che una persona ha detto, un gesto fisico, un oggetto nella stanza, una settimana tipo con giorni specifici, una conseguenza misurabile. Senza l'ancora concreta, la parola astratta va eliminata e sostituita dall'ancora stessa, che dice la stessa cosa in forma tangibile. Preferisci sempre descrivere cosa fa una persona invece di nominare cosa prova.

### 4. Niente triplette in nessuna forma

Niente sequenze di tre aggettivi, tre verbi, tre stati, tre "senza…", tre sostantivi collegati, tre possibilità elencate. Due elementi vanno bene, uno va benissimo, tre diventano sempre retorica. Il vincolo vale anche nelle enumerazioni interne a una frase lunga: *"con pause, con parole semplici, con ripetizioni"* è una tripletta, non una lista. Se hai davvero bisogno di elencare tre cose perché servono tutte al senso, spezza la frase e usa un altro costrutto, oppure taglia una delle tre e tienine due.

### 5. Niente meta-frasi

Non commentare il testo mentre lo scrivi. Sono bandite tutte queste formule che dicono al lettore come dovrebbe leggere invece di lasciargli lo spazio di capire da solo:

- "è importante", "è chiaro che", "è fondamentale", "è essenziale", "è cruciale", "è basilare"
- "è la parte più forte", "è giusto partire da...", "è il cuore di tutto"
- "vale la pena sottolineare che", "merita attenzione il fatto che"
- "va detto che", "voglio dire che", "sto per dirti una cosa importante"

Se un'osservazione è importante, dilla e basta. Il peso viene dal contenuto, non dall'annuncio del peso.

### 6. Ritmo discorsivo e disteso, mai telegrafico

Ogni pensiero si sviluppa per almeno tre o quattro righe prima del punto. Se in due righe consecutive compaiono più di due punti, il testo è frammentato in micro-pensieri staccati e va riscritto legando i periodi con congiunzioni naturali: *perché*, *quando*, *e*, *mentre*, *dove*, *finché*, *al punto di*, *così che*, *al momento in cui*, *con il tempo*. Il respiro del testo deve somigliare a quello di una persona che ragiona mentre scrive, non a quello di chi prende appunti di fretta.

Periodi lunghi collegati sono sempre meglio di frasi brevi giustapposte. Allo stesso tempo non scrivere periodi labirintici: il punto arriva quando il pensiero si chiude, semplicemente arriva dopo tre o quattro righe invece che dopo una sola.

### 7. Zero difesa preventiva

Niente "so che sembra strano ma...", niente "qualcuno potrebbe obiettare che...", niente "non voglio dire che...", niente "attenzione però...". Se la tesi è forte regge da sola. Se non regge, rivedi la tesi invece di difenderla in anticipo. La difesa preventiva indebolisce sempre il testo e lo fa suonare incerto.

### 8. Chiusure concrete, mai da comunicato stampa

La chiusura di un pezzo deve contenere un gesto osservabile, una scelta che il lettore può fare, una conseguenza nel tempo, un numero, un'immagine che resta. Sono bandite tutte le chiusure formula:

- "Questo è il cuore di tutto"
- "E alla fine è di questo che si tratta"
- "Questa è la differenza vera"
- "Ecco perché conta"
- "Questa è la sfida di chi lavora nel settore"
- Qualsiasi chiusura che ripete con parole diverse quello che hai appena detto

Se non trovi una chiusura concreta, è probabile che il contenuto non avesse un punto preciso da fare: rivedi il contenuto, non cercare una chiusura retorica per coprire il vuoto.

### 9. Niente em-dash nel copy rivolto agli utenti

Mai. Usa virgole, punti, parentesi tonde, oppure il middle dot (·) per le firme e i separatori visivi. L'em-dash (—) è un segno tipografico che il registro italiano colloquiale non usa, e la sua presenza è di per sé un marcatore AI.

### 10. Auto-controllo sulla regola stessa

Ogni regola qui sopra può diventare un nuovo tic se applicata meccanicamente. Le regole esistono per liberare la scrittura, non per imporre nuovi stampi. Se ti accorgi di stare usando la stessa strategia di riformulazione per la decima volta di seguito — la stessa congiunzione alternativa, la stessa apertura con scena concreta, lo stesso tipo di chiusura pratica, la stessa struttura di paragrafo — quella strategia sta diventando il nuovo pattern AI. Cambia approccio anche dentro il rispetto delle regole. La varietà delle forme è più importante dell'aderenza perfetta a una singola regola, purché nessuna regola venga violata del tutto.

### Audit automatico

Usa `python scripts/audit_caroselli_style.py` per verificare i contenuti prima del commit. Lo script rileva automaticamente: pattern "non X ma Y" in 13 varianti, trampolini semantici (negazione in una frase + affermazione nella successiva), em-dash, triplette, meta-frasi, ritmo telegrafico, astratti non supportati. Zero violazioni hard prima di pubblicare.

## Context Health

Sessions have finite context. Heavy operations consume it fast.

**Automatic safety net (hooks):**
- `PreCompact` hook saves state before auto-compaction
- `SessionStart(compact)` hook restores context after compaction
- `SessionStart(user)` hook resets stale gate files on every fresh session

**Completeness gates (PreToolUse Write|Edit — hard blocks):**
- **knowledge-base.md**: Every entry needs `[Source:]` provenance, max 200 lines, no TBD/TODO
- **memory.md**: Max 100 lines (Write only)
- **settings.json**: Must be valid JSON (broken JSON breaks all hooks)
- **Agent defs** (`.claude/agents/*.md`): No TBD/TODO — instructions must be definitive
- **Ungated** (iterative by nature): Daily Notes, Scratchpad, Templates, Logs, Commands, Skills

**Self-monitoring (soft signals — Claude's responsibility):**
- After ~15 messages or 3+ large file reads: run `/clear` proactively (token cost grows as S×N(N+1)/2 — message 30 costs 31× more than message 1)
- If you see a "compacting conversation" warning: run `/clear` immediately
- If output quality degrades (repetition, missed details): run `/clear`
- When a discrete multi-step task completes: consider `/clear` before starting the next unrelated task
- When switching between different task domains: acknowledge the boundary, prefer `/clear` for heavy switches

**Peak hours (Anthropic rolling 5-hour window):**
- Tokens are consumed faster during: **5:00–11:00 AM Pacific / 14:00–20:00 CET on weekdays**
- Same task costs more tokens during peak — prefer heavy sessions in evenings or weekends
- The 5-hour window rolls continuously — tokens from 5 hours ago are freed automatically

**Model selection:**
- Use Haiku for: simple tasks, drafts, quick answers, formatting, git summaries
- Use Sonnet for: real implementation, code review, research, complex reasoning
- Use Opus for: deep architecture, hardest problems only
- Default to Sonnet. Agents: rubber-duck, pr-ghostwriter, archaeologist → Haiku

**How /clear works:** Distills session state into memory.md + daily note handoff, preserving retrieval paths. Then automatically resumes work by reloading compressed context and executing the next action. Seamless to the user.

## Maintenance
- Keep memory.md compact (<100 lines)
- Aggressively prune stale items
- Done list cleared on Fridays
- Review incident log during /sync and /wrap-up
- Auditor proposes SOP revisions — user approves before changes apply
