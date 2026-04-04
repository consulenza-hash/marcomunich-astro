<?php
/**
 * POST /api/genera-immagine.php
 * Analizza l'articolo e genera un prompt ottimizzato per creare l'immagine
 * di copertina (stile YouTube thumbnail / editorial inspiration).
 *
 * Flusso:
 *   1. Legge l'articolo da GitHub
 *   2. Chiama Gemini Flash Lite per generare il prompt visivo
 *   3. Restituisce il prompt pronto per Midjourney / DALL-E / Ideogram
 *
 * Body: { slug: string }
 * Response: { success: true, prompt: string }
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body = readJsonBody();
$slug = trim($body['slug'] ?? '');

if (!$slug) {
    jsonResponse(['error' => 'Slug mancante'], 400);
}

// ── API key ─────────────────────────────────────────────────────────────────
$apiKey = getenv('IMAGEN_API_KEY') ?: getenv('ANTHROPIC_API_KEY');
// Usa IMAGEN_API_KEY (Google AI Studio) se presente, altrimenti fallisce
$geminiKey = getenv('IMAGEN_API_KEY');
if (!$geminiKey) {
    jsonResponse(['error' => 'IMAGEN_API_KEY non configurata nel server .env'], 500);
}

// ── 1. Leggi articolo da GitHub ──────────────────────────────────────────────
$filePath = "src/content/articoli/{$slug}/index.mdoc";
$file     = ghGetFile($filePath);
if (!$file) {
    jsonResponse(['error' => 'Articolo non trovato'], 404);
}
$content = $file['content'];

// Estrai frontmatter
$titolo      = '';
$descrizione = '';
$corpo       = '';

if (preg_match('/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m', $content, $m)) {
    $fm    = $m[1];
    $corpo = trim($m[2]);
    if (preg_match('/^titolo:\s*["\']?(.*?)["\']?\s*$/m', $fm, $t))
        $titolo = trim($t[1], " \t\"'");
    if (preg_match('/^descrizione:\s*["\']?(.*?)["\']?\s*$/m', $fm, $d))
        $descrizione = trim($d[1], " \t\"'");
}

// Testo utile: titolo + descrizione + inizio corpo senza markdown
$corpoPlain = preg_replace(['/^#+\s*/m', '/\*+/', '/\[([^\]]+)\]\([^)]+\)/'], ['', '', '$1'], $corpo);
$corpoPlain = preg_replace('/\n{2,}/', ' ', trim($corpoPlain));
$estratto   = mb_substr($corpoPlain, 0, 600, 'UTF-8');

// ── 2. Genera prompt con Gemini Flash Lite ───────────────────────────────────
$systemPrompt = <<<PROMPT
Sei un art director specializzato in copertine editoriali digitali stile YouTube Inspiration / Medium / blog professionale.

Il sito parla di personal branding autentico, marketing olistico e presenza online per coach, counselor e operatori del benessere.

Devi generare UN SOLO prompt fotografico in inglese, ottimizzato per Midjourney / DALL-E / Ideogram, basato sull'articolo fornito.

STILE VISIVO TARGET (YouTube Inspirations / editorial thumbnail):
- Fotografia lifestyle editoriale, alta qualità, ultra-realistica
- Composizione bold e pulita, soggetto centrato o con rule of thirds
- Luce cinematica calda (golden hour, window light, studio soft box)
- Bokeh morbido sullo sfondo, profondità di campo
- Palette: toni caldi dorati, beige, bianco, verde salvia, terracotta
- Props simbolici: scrivania ordinata, piante verdi, notebook aperto, tazza di tè/caffè, laptop, cristalli, candele, elementi naturali
- Atmosfera: professionale ma umana, ispirazionale, accogliente
- NESSUN viso umano, nessuna persona riconoscibile
- NESSUN testo, parola, lettera, logo o watermark nell'immagine
- Formato 16:9, orientamento landscape

STRUTTURA DEL PROMPT (rispetta questo ordine):
[descrizione scena principale], [dettaglio props rilevanti], [stile luce], [atmosfera/mood], [stile fotografico], [dettagli tecnici]

Alla fine aggiungi sempre: --ar 16:9 --style raw --q 2

Rispondi SOLO con il prompt, niente spiegazioni.
PROMPT;

$geminiBody = json_encode([
    'contents' => [[
        'parts' => [[
            'text' => "Articolo:\nTitolo: {$titolo}\nDescrizione: {$descrizione}\nTesto: {$estratto}",
        ]],
    ]],
    'system_instruction' => [
        'parts' => [['text' => $systemPrompt]],
    ],
    'generationConfig' => [
        'maxOutputTokens' => 300,
        'temperature'     => 0.8,
    ],
]);

$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={$geminiKey}";

$ch = curl_init($geminiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $geminiBody,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);
$res  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
    jsonResponse(['error' => 'Gemini API error ' . $code . ': ' . $res], 500);
}

$data   = json_decode($res, true);
$prompt = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');

if (!$prompt) {
    jsonResponse(['error' => 'Gemini non ha restituito un prompt'], 500);
}

jsonResponse([
    'success' => true,
    'prompt'  => $prompt,
]);
