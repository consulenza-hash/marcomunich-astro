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
You are an art director for marcomunich.com — a personal branding blog for Italian coaches, counselors, and wellness practitioners. Your task: generate ONE image prompt in English for Midjourney/Ideogram/DALL-E.

THE GOLDEN RULE: the image must be instantly readable by someone who has NOT read the article. A person scrolling should see the image and immediately understand the topic — no abstract puzzles, no metaphors requiring explanation.

THE AUDIENCE: coaches, counselors, psychologists, holistic practitioners, solopreneurs who sell knowledge and human transformation. The visual world is: clarity, calm, intentionality, human connection, personal growth. NOT: corporate, tech, retail, cooking, crafts, generic business.

ALLOWED PROPS (use only what fits):
- Open notebook or journal with handwritten notes
- Single plant or dried flower (symbolizing growth)
- Warm ceramic mug (tea, coffee)
- MacBook or phone showing a personal website/profile
- Clean desk with natural light
- Hands writing, holding a pen, or resting calmly
- A single chair or armchair (coaching space)
- A window with soft natural light
- Books (personal development, not technical)
- A calm, minimalist indoor space

FORBIDDEN: tools, hardware, needles, thread, fabric, food, utensils, machines, medical instruments, gym equipment, vehicles, money/coins, animals. Nothing that belongs to a craft, kitchen, workshop, or unrelated profession.

GOOD EXAMPLES:

Article about "coach's personal brand online":
→ "Minimal desk flat lay: open MacBook showing a clean personal website, small potted plant beside it, ceramic mug with steam, soft morning window light, warm cream and sage palette, calm professional presence, editorial lifestyle photography --ar 16:9 --style raw --q 2"

Article about "authenticity vs performance for coaches":
→ "Overhead shot: open journal with handwritten reflections, a pen resting across the page, single dried flower beside it, warm walnut desk, soft diffused window light, cream and warm amber palette, honest introspective mood, editorial lifestyle photography --ar 16:9 --style raw --q 2"

Article about "finding your niche as a counselor":
→ "A single armchair in a minimal bright room, soft side light from a tall window, small plant in corner, everything else empty and calm, warm ivory and sage palette, focused intentional space, editorial interior photography --ar 16:9 --style raw --q 2"

Article about "pricing your services":
→ "Close-up of calm hands resting on an open notebook with a few handwritten numbers and words, a quality pen beside it, clean marble surface, soft directional light, ivory and matte gold palette, value and confidence aesthetic, editorial lifestyle photography --ar 16:9 --style raw --q 2"

Article about "visibility and online presence":
→ "Minimal desk: MacBook open to a warm personal website, ceramic mug with steam, small succulent, golden afternoon light, warm cream and terracotta palette, professional yet human workspace, editorial lifestyle photography --ar 16:9 --style raw --q 2"

PROMPT STRUCTURE:
[Shot type + main subject], [2-3 specific allowed props that connect to the article topic], [exact lighting], [color palette: max 3 colors], [mood label], editorial lifestyle/interior photography --ar 16:9 --style raw --q 2

HARD RULES:
- NO faces, NO recognizable people
- NO text, words, letters, logos in the image
- NO props outside the ALLOWED list unless they are unmistakably part of the coaching/wellness world
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
