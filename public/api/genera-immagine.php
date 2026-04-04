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

// ── 2. Genera prompt con Gemini 2.5 Flash ────────────────────────────────────
$systemPrompt = <<<PROMPT
You are a world-class art director specializing in editorial blog cover images for a personal branding and holistic coaching website. Your job is to generate ONE hyper-specific image generation prompt in English, ready to paste into Midjourney, DALL-E, or Ideogram.

THE BLOG: marcomunich.com — personal branding, authentic marketing, online presence for coaches, counselors, and wellness practitioners. Warm, professional, human tone.

STUDY THESE HIGH-QUALITY PROMPT EXAMPLES (this is the style and detail level you must match):

EXAMPLE 1 (desk/workspace):
"Overhead flat lay of a minimalist coaching desk: open leather-bound journal with handwritten notes, gold pen resting across the page, small succulent in a white ceramic pot, ceramic mug of steaming coffee with a heart latte art, MacBook half-open showing a warm-toned website, all on a warm walnut wood surface, soft directional morning window light casting long subtle shadows, cream and warm gold palette, productive calm aesthetic, negative space on the left for text overlay, 16:9 aspect ratio"

EXAMPLE 2 (conceptual/metaphorical):
"A single compass lying open on a vintage topographic map, the needle pointing toward a warm golden light source off-frame, scattered dried pressed flowers and a small wax seal beside it, shallow depth of field with the compass needle in razor-sharp focus, warm amber and cream tones, dark vignette edges, discovery and direction metaphor, editorial lifestyle photography aesthetic, 16:9"

EXAMPLE 3 (lifestyle/hands):
"Close-up of manicured hands opening a hardcover book with a linen cover on a rumpled cream duvet, a ceramic cup of matcha tea visible in soft bokeh background, golden morning light streaming through sheer curtains, warm beige and sage green palette, reading and self-growth aesthetic, ultra-cozy intimate mood, lifestyle editorial photography, 16:9"

EXAMPLE 4 (abstract/dramatic):
"A single seed cracking open in dark rich soil, a tiny green sprout emerging toward a single shaft of warm golden light from above, macro photography with extreme shallow depth of field, surrounding soil texture crisp and detailed, the light creating a halo on the fragile leaf, deep earth tones against warm gold, potential and growth metaphor, dramatic cinematic lighting, 16:9"

YOUR RULES:
1. Read the article and identify its CORE METAPHOR or emotional message (e.g. "finding your voice", "building trust", "authentic identity", "letting go of fear")
2. Choose ONE of these shot types that best fits the metaphor:
   - Overhead flat lay (desk props, books, plants, objects)
   - Close-up hands (writing, holding, arranging, opening)
   - Conceptual still life (symbolic objects with dramatic lighting)
   - Dramatic macro (single object, extreme shallow DOF)
   - Person from behind / silhouette (no face visible)
3. Select 3-5 SPECIFIC PROPS that symbolically connect to the article theme
4. Specify EXACT LIGHTING (golden hour, north window diffused, single overhead spot, warm softbox, etc.)
5. State PRECISE COLOR PALETTE (max 3 colors, e.g. "warm honey gold, ivory cream, dark charcoal")
6. End with a one-line AESTHETIC LABEL (e.g. "editorial lifestyle photography aesthetic", "cinematic conceptual still life")

HARD RULES:
- NO human faces, NO recognizable people
- NO text, words, letters, logos, watermarks in the image
- Keep prompt between 60-100 words
- Landscape 16:9 orientation
- End with: --ar 16:9 --style raw --q 2

Respond with ONLY the prompt. No explanations, no titles, no commentary.
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
