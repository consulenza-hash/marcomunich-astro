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
$estratto   = mb_substr($corpoPlain, 0, 1500, 'UTF-8');

// ── 2. Genera prompt con Gemini 2.5 Flash ────────────────────────────────────
$systemPrompt = <<<PROMPT
You are an art director for a personal branding and coaching blog (marcomunich.com). Generate ONE image prompt in English for Midjourney/Ideogram/DALL-E based on the article provided.

THE GOLDEN RULE: the image must be instantly readable by someone who has NOT read the article. A person scrolling a blog should see the image and immediately understand the topic — no abstract puzzles, no hidden metaphors that require explanation.

PRIORITY ORDER (choose the highest that applies):
1. DIRECT — show the literal topic using recognizable objects from the coaching/branding world
2. CONCRETE METAPHOR — a physical scene that visually communicates the concept (e.g. two paths, an open door, a full vs empty glass)
3. ATMOSPHERIC — lifestyle/desk scene that sets the emotional tone of the article

GOOD EXAMPLES:

Article about "social media authenticity":
→ "Overhead flat lay: open journal with handwritten personal notes next to a smartphone face-down on a warm walnut desk, a ceramic coffee mug, single dried flower, soft morning window light, cream and warm amber palette, the phone deliberately ignored, mindful authenticity aesthetic, editorial lifestyle photography --ar 16:9 --style raw --q 2"

Article about "finding your niche":
→ "A single bright spotlight illuminating one empty chair on a dark stage, all other chairs in shadow, dramatic side lighting, deep charcoal and warm gold palette, clarity and focus concept, cinematic editorial photography --ar 16:9 --style raw --q 2"

Article about "pricing your services":
→ "Close-up of confident hands placing a premium hardcover book on a clean marble surface, a gold pen beside it, a small elegant price tag visible, soft directional light, ivory and matte gold palette, value and confidence aesthetic, editorial product photography --ar 16:9 --style raw --q 2"

Article about "online presence for coaches":
→ "Minimal desk scene: MacBook open to a clean personal website, ceramic mug, small potted plant, notebook with 'MY STORY' written — but WAIT: no text allowed — instead: MacBook open showing a warm homepage design, ceramic mug with steam, small succulent, golden afternoon light, professional yet human aesthetic, editorial workspace photography --ar 16:9 --style raw --q 2"

STRUCTURE OF YOUR PROMPT:
[Shot type + main subject], [2-4 specific props relevant to the article topic], [exact lighting], [color palette: max 3 colors], [mood/aesthetic label], --ar 16:9 --style raw --q 2

HARD RULES:
- NO faces, NO recognizable people
- NO text, words, letters, logos in the image
- 60-100 words total
- Must be immediately readable — if you need to explain the connection, the image has failed

Respond with ONLY the prompt.
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
        'maxOutputTokens' => 1024,
        'temperature'     => 0.8,
        'thinkingConfig'  => ['thinkingBudget' => 0],
    ],
]);

$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$geminiKey}";

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
