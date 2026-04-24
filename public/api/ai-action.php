<?php
/**
 * POST /api/ai-action.php
 * Esegue azioni AI sull'articolo usando Claude Sonnet 4.6.
 *
 * Body: { azione: string, corpo: string, istruzione?: string }
 * Response: { success: true, corpo?: string, seo_title?: string, ... }
 */
require_once __DIR__ . '/_config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body      = readJsonBody();
$azione    = trim($body['azione'] ?? '');
$corpo     = trim($body['corpo'] ?? '');
$istruzione = trim($body['istruzione'] ?? '');

if (!$azione || !$corpo) {
    jsonResponse(['error' => 'Parametri mancanti: azione e corpo richiesti'], 400);
}

$apiKey = getenv('ANTHROPIC_API_KEY');
if (!$apiKey) jsonResponse(['error' => 'ANTHROPIC_API_KEY non configurata'], 500);

// ── System prompt ────────────────────────────────────────────────────────────
$sistema = 'Sei un ghostwriter italiano esperto di personal branding. Scrivi sempre in italiano naturale pulito.

Regole assolute:
- Nessuna struttura "non X ma Y" o "non è… è…"
- Nessuna tripletta (tre aggettivi, tre verbi, tre stati)
- Nessuna meta-frase ("è importante", "è chiaro", "è giusto partire da…")
- Nessun emdash (—)
- Ritmo discorsivo: ogni pensiero si sviluppa per 3-4 righe prima di chiudersi
- Testo specifico, asciutto, credibile. Zero enfasi artificiale.
- Rispondi SEMPRE con JSON valido. Nessun testo prima o dopo.';

// ── Build prompt per azione ──────────────────────────────────────────────────
$base = "ARTICOLO:\n{$corpo}\n\n";

switch ($azione) {
    case 'migliora':
        $prompt = $base . 'Migliora il testo dell\'articolo: rendi il linguaggio più diretto, elimina ridondanze, mantieni lo stesso messaggio e la stessa struttura.

Rispondi SOLO con: {"corpo": "testo migliorato in markdown"}';
        break;

    case 'seo':
        $prompt = $base . 'Ottimizza l\'articolo per la SEO: aggiungi parole chiave naturalmente nel testo, migliora i sottotitoli H3, assicurati che il testo sia almeno 600 parole, aggiungi varianti semantiche del topic principale.

Rispondi SOLO con: {"corpo": "testo ottimizzato in markdown", "seo_title": "SEO title max 60 caratteri", "seo_description": "meta description max 155 caratteri"}';
        break;

    case 'riscrivi-intro':
        $prompt = $base . 'Riscrivi SOLO il primo paragrafo dell\'articolo. Deve catturare subito l\'attenzione, essere specifico e concreto. Il resto dell\'articolo resta invariato.

Rispondi SOLO con: {"corpo": "articolo completo con intro riscritta in markdown"}';
        break;

    case 'aggiungi-cta':
        $prompt = $base . 'Aggiungi una call to action efficace alla fine dell\'articolo. Deve essere naturale, non aggressiva, coerente con il tono del testo. Non usare "clicca qui" o frasi da copywriting generico.

Rispondi SOLO con: {"corpo": "articolo completo con CTA aggiunta in markdown"}';
        break;

    case 'meta-description':
        $prompt = $base . 'Genera solo i metadati SEO per questo articolo. Non modificare il testo.

Rispondi SOLO con: {"seo_title": "SEO title max 60 caratteri", "seo_description": "meta description max 155 caratteri", "descrizione": "descrizione breve 1-2 frasi max 160 caratteri"}';
        break;

    case 'link-interni':
        $prompt = $base . 'Suggerisci 3-5 punti del testo dove inserire link interni a marcomunich.com/[topic]. Per ogni punto indica: il testo da linkare e la pagina di destinazione suggerita (/corsi, /chi-sono, /contatti, /risorse, o un articolo correlato).

Rispondi SOLO con: {"suggerimenti": [{"testo": "testo da linkare", "destinazione": "/pagina-suggerita", "contesto": "frase dove si trova"}]}';
        break;

    case 'bold':
        $prompt = $base . 'Aggiungi grassetti (**testo**) alle parole e frasi chiave dell\'articolo. I grassetti devono essere coerenti con il tema centrale del testo: evidenzia solo i concetti più importanti e le affermazioni decisive, non più di 8-12 grassetti in tutto. Non modificare nient\'altro.

Rispondi SOLO con: {"corpo": "articolo completo con grassetti aggiunti in markdown"}';
        break;

    case 'personalizzata':
        $prompt = $base . "Istruzione: {$istruzione}

Rispondi SOLO con JSON. Se hai modificato il testo: {\"corpo\": \"testo modificato in markdown\"}. Se hai solo suggerimenti: {\"suggerimenti\": \"...\"}. Se hai generato metadati: {\"seo_title\": \"...\", \"seo_description\": \"...\"}";
        break;

    default:
        jsonResponse(['error' => 'Azione non valida'], 400); // SEC-034 FIX: non riflettere $azione
}

// ── Chiama Claude ─────────────────────────────────────────────────────────────
$claudeBody = json_encode([
    'model'      => 'claude-sonnet-4-6',
    'max_tokens' => 8000,
    'system'     => $sistema,
    'messages'   => [['role' => 'user', 'content' => $prompt]],
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $claudeBody,
    CURLOPT_TIMEOUT        => 120,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
    ],
]);

$res  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
    jsonResponse(['error' => 'Claude API error ' . $code . ': ' . substr($res, 0, 300)], 500);
}

$data = json_decode($res, true);
$raw  = trim($data['content'][0]['text'] ?? '');

if (!$raw) jsonResponse(['error' => 'Claude non ha restituito testo'], 500);

// Pulisci e parsa JSON
$cleaned = preg_replace('/^```(?:json)?\s*/m', '', $raw);
$cleaned = preg_replace('/\s*```\s*$/m', '', $cleaned);
$cleaned = trim($cleaned);

$start = strpos($cleaned, '{');
$end   = strrpos($cleaned, '}');
if ($start === false || $end === false) {
    jsonResponse(['error' => 'Risposta AI non valida', 'raw' => substr($raw, 0, 300)], 500);
}

$result = json_decode(substr($cleaned, $start, $end - $start + 1), true);
if (!$result) {
    jsonResponse(['error' => 'JSON non parsabile', 'raw' => substr($raw, 0, 300)], 500);
}

jsonResponse(array_merge(['success' => true], $result));
