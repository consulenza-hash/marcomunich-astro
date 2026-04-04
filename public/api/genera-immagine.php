<?php
/**
 * POST /api/genera-immagine.php
 * Analizza l'articolo completo con Claude Opus 4.6 e genera un prompt
 * ottimizzato per creare l'immagine di copertina.
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
if (!$slug) jsonResponse(['error' => 'Slug mancante'], 400);

// ── API key ──────────────────────────────────────────────────────────────────
$anthropicKey = getenv('ANTHROPIC_API_KEY');
if (!$anthropicKey) {
    jsonResponse(['error' => 'ANTHROPIC_API_KEY non configurata'], 500);
}

// ── 1. Leggi articolo completo da GitHub ─────────────────────────────────────
$filePath = "src/content/articoli/{$slug}/index.mdoc";
$file     = ghGetFile($filePath);
if (!$file) jsonResponse(['error' => 'Articolo non trovato'], 404);

$rawContent = $file['content'];

// Rimuovi frontmatter e pulisci markdown per passare solo il testo
$corpo = $rawContent;
if (preg_match('/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/m', $rawContent, $m)) {
    $corpo = trim($m[1]);
}
$corpoPlain = preg_replace(['/^#+\s*/m', '/\*+/', '/\[([^\]]+)\]\([^)]+\)/', '/!\[[^\]]*\]\([^)]+\)/'], ['', '', '$1', ''], $corpo);
$corpoPlain = preg_replace('/\n{3,}/', "\n\n", trim($corpoPlain));

// Estrai titolo e descrizione dal frontmatter
$titolo      = '';
$descrizione = '';
if (preg_match('/^titolo:\s*["\']?(.*?)["\']?\s*$/m', $rawContent, $t))
    $titolo = trim($t[1], " \t\"'");
if (preg_match('/^descrizione:\s*["\']?(.*?)["\']?\s*$/m', $rawContent, $d))
    $descrizione = trim($d[1], " \t\"'");

// ── 2. Chiama Claude Opus 4.6 ────────────────────────────────────────────────
$systemPrompt = <<<SYSTEM
You are an art director for a personal branding and coaching blog (marcomunich.com — Italian audience, coaches, counselors, wellness practitioners). Your task: generate ONE image prompt in English for Midjourney/Ideogram/DALL-E.

THE GOLDEN RULE: the image must be instantly readable by someone who has NOT read the article. A person scrolling should see the image and immediately understand what it is about — no abstract puzzles, no metaphors requiring explanation.

PRIORITY ORDER:
1. DIRECT — show the literal topic with recognizable objects from the coaching/branding world
2. CONCRETE METAPHOR — a physical scene that visually communicates the concept without explanation
3. ATMOSPHERIC — lifestyle/desk scene that sets the emotional tone

GOOD EXAMPLES:

Article about "social media vs authenticity":
→ "Overhead flat lay: open journal with handwritten personal notes next to a smartphone face-down on a warm walnut desk, ceramic coffee mug with steam, single dried flower, soft morning window light, cream and warm amber palette, the phone deliberately ignored, mindful authenticity aesthetic, editorial lifestyle photography --ar 16:9 --style raw --q 2"

Article about "finding your niche":
→ "A single bright spotlight illuminating one empty chair on a dark stage, all other chairs in shadow, dramatic side lighting, deep charcoal and warm gold palette, clarity and standing-out concept, cinematic editorial photography --ar 16:9 --style raw --q 2"

Article about "pricing your services":
→ "Close-up of confident hands placing a premium hardcover book on a clean marble surface, a gold pen resting beside it, soft directional light, ivory and matte gold palette, value and confidence aesthetic, editorial product photography --ar 16:9 --style raw --q 2"

Article about "visibility online":
→ "Minimal desk: MacBook open showing a warm personal website homepage, ceramic mug with steam, small potted succulent, notebook open, golden afternoon window light, warm cream and sage palette, professional yet human workspace, editorial lifestyle photography --ar 16:9 --style raw --q 2"

PROMPT STRUCTURE:
[Shot type + main subject], [2-4 specific props directly relevant to the article topic], [exact lighting], [color palette: max 3 colors], [mood/aesthetic label], --ar 16:9 --style raw --q 2

HARD RULES:
- NO faces, NO recognizable people
- NO text, words, letters, logos in the image
- 60-100 words total
- Must be immediately readable — if you need to explain it, it has failed
- Write in English

Respond with ONLY the prompt. Nothing else.
SYSTEM;

$userMessage = "Article title: {$titolo}\nMeta description: {$descrizione}\n\nFull article text:\n{$corpoPlain}";

$claudeBody = json_encode([
    'model'      => 'claude-opus-4-6',
    'max_tokens' => 1024,
    'system'     => $systemPrompt,
    'messages'   => [
        ['role' => 'user', 'content' => $userMessage],
    ],
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $claudeBody,
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $anthropicKey,
        'anthropic-version: 2023-06-01',
    ],
]);

$res  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
    jsonResponse(['error' => 'Claude API error ' . $code . ': ' . $res], 500);
}

$data   = json_decode($res, true);
$prompt = trim($data['content'][0]['text'] ?? '');

if (!$prompt) {
    jsonResponse(['error' => 'Claude non ha restituito un prompt'], 500);
}

jsonResponse(['success' => true, 'prompt' => $prompt]);
