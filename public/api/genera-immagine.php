<?php
/**
 * POST /api/genera-immagine.php
 * Genera un'immagine per l'articolo usando Gemini Flash + Imagen 4.
 *
 * Flusso:
 *   1. Legge l'articolo da GitHub
 *   2. Chiama Gemini Flash per un prompt visivo professionale
 *   3. Chiama Imagen 4 con il prompt
 *   4. Converte PNG → JPEG con GD
 *   5. Carica su GitHub in public/images/articoli/{slug}.jpg
 *   6. Aggiorna frontmatter immagine nel .mdoc
 *   7. Invalida cache lista
 *
 * Body: { slug: string }
 * Response: { success: true, immagine: '{slug}.jpg', url: '/images/articoli/{slug}.jpg' }
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
$imagenKey = getenv('IMAGEN_API_KEY');
if (!$imagenKey) {
    jsonResponse(['error' => 'IMAGEN_API_KEY non configurata nel server .env'], 500);
}

// ── 1. Leggi articolo ────────────────────────────────────────────────────────
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

// Testo utile per il prompt: titolo + descrizione + inizio corpo (senza markdown)
$corpoPlain = preg_replace(['/^#+\s*/m', '/\*+/', '/\[([^\]]+)\]\([^)]+\)/'], ['', '', '$1'], $corpo);
$corpoPlain = preg_replace('/\n{2,}/', ' ', trim($corpoPlain));
$estratto   = mb_substr($corpoPlain, 0, 500, 'UTF-8');

// ── 2. Genera prompt visivo con Gemini Flash ─────────────────────────────────
$geminiPrompt = "Sei un art director editoriale. Scrivi un prompt fotografico in inglese (max 90 parole) per un'immagine blog professionale basata su questo articolo.\n\nTitolo: {$titolo}\nDescrizione: {$descrizione}\nInizio testo: {$estratto}\n\nIl sito parla di personal branding autentico, marketing olistico e presenza online per coach, counselor e operatori del benessere.\n\nRegole per il prompt:\n- Nessuna persona, nessun viso\n- Stile: fotografia editoriale, lifestyle, oggetti simbolici, atmosfera professionale e calda\n- Luce naturale cinematica, bokeh, toni caldi dorati\n- Niente testo, niente scritte, niente loghi nell'immagine\n- Ambiente: scrivania pulita, piante, luce morbida, notebook, tazze, elementi naturali\n- Formato 16:9, qualità ultra-realistica\n\nRispondi SOLO con il prompt fotografico, niente altro.";

$geminiUrl  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$imagenKey}";
$geminiBody = json_encode([
    'contents'         => [['parts' => [['text' => $geminiPrompt]]]],
    'generationConfig' => ['maxOutputTokens' => 200, 'temperature' => 0.7],
]);

$ch = curl_init($geminiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $geminiBody,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);
$geminiRes  = curl_exec($ch);
$geminiCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($geminiCode !== 200) {
    jsonResponse(['error' => 'Gemini API error ' . $geminiCode . ': ' . $geminiRes], 500);
}

$geminiData   = json_decode($geminiRes, true);
$visualPrompt = trim($geminiData['candidates'][0]['content']['parts'][0]['text'] ?? '');

if (!$visualPrompt) {
    jsonResponse(['error' => 'Gemini non ha restituito un prompt'], 500);
}

// Sicurezza: aggiungi sempre il divieto di testo all'immagine
$visualPrompt .= '. No text, no words, no letters, no logos, no watermarks anywhere in the image. Ultra-realistic editorial photography, 16:9 aspect ratio.';

// ── 3. Genera immagine con Imagen 4 ─────────────────────────────────────────
$imagenUrl  = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={$imagenKey}";
$imagenBody = json_encode([
    'instances'  => [['prompt' => $visualPrompt]],
    'parameters' => [
        'sampleCount' => 1,
        'aspectRatio' => '16:9',
        'safetyFilterLevel' => 'BLOCK_ONLY_HIGH',
    ],
]);

$ch = curl_init($imagenUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $imagenBody,
    CURLOPT_TIMEOUT        => 90,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);
$imagenRes  = curl_exec($ch);
$imagenCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($imagenCode !== 200) {
    jsonResponse(['error' => 'Imagen API error ' . $imagenCode . ': ' . mb_substr($imagenRes, 0, 300)], 500);
}

$imagenData  = json_decode($imagenRes, true);
$b64Png      = $imagenData['predictions'][0]['bytesBase64Encoded'] ?? '';

if (!$b64Png) {
    jsonResponse(['error' => 'Imagen non ha restituito dati immagine'], 500);
}

$pngBytes = base64_decode($b64Png);

// ── 4. Converti PNG → JPEG con GD (se disponibile) ──────────────────────────
$imageFilename = "{$slug}.jpg";
$imagePath     = "public/images/articoli/{$imageFilename}";

if (extension_loaded('gd') && function_exists('imagecreatefromstring')) {
    $src = imagecreatefromstring($pngBytes);
    if ($src !== false) {
        ob_start();
        imagejpeg($src, null, 88);
        $jpegBytes = ob_get_clean();
        imagedestroy($src);
        $uploadBytes = $jpegBytes;
    } else {
        // GD failed to parse — save PNG as-is with .jpg extension
        $uploadBytes = $pngBytes;
    }
} else {
    // No GD — save PNG bytes (GitHub will serve it fine, just slightly larger)
    $uploadBytes = $pngBytes;
}

// ── 5. Carica immagine su GitHub ─────────────────────────────────────────────
// Check se esiste già (per ottenere SHA e sovrascrivere)
$existingImg = ghGetFile($imagePath);
$imgSha      = $existingImg ? $existingImg['sha'] : null;

$commitMsg = "feat: immagine generata con Imagen 4 per \"{$slug}\"";
$imgRes    = ghPutFile($imagePath, $uploadBytes, $commitMsg, $imgSha);

if ($imgRes['code'] !== 200 && $imgRes['code'] !== 201) {
    jsonResponse(['error' => 'Upload immagine GitHub error ' . $imgRes['code']], 500);
}

// ── 6. Aggiorna frontmatter immagine nel .mdoc ───────────────────────────────
// Aggiunge/sostituisce riga immagine nel frontmatter
if (preg_match('/^immagine:\s*.+$/m', $content)) {
    $newContent = preg_replace('/^immagine:\s*.+$/m', "immagine: {$imageFilename}", $content);
} else {
    // Inserisce dopo la riga 'data:'
    $newContent = preg_replace(
        '/(^data:\s*.+$)/m',
        "$1\nimmagine: {$imageFilename}",
        $content,
        1
    );
}

if ($newContent && $newContent !== $content) {
    $mdocRes = ghPutFile($filePath, $newContent, "feat: aggiunge immagine generata in \"{$slug}\"", $file['sha']);
    if ($mdocRes['code'] !== 200 && $mdocRes['code'] !== 201) {
        // L'immagine è già caricata — rispondi con successo parziale
        jsonResponse([
            'success'  => true,
            'immagine' => $imageFilename,
            'url'      => "/images/articoli/{$imageFilename}",
            'prompt'   => $visualPrompt,
            'warning'  => 'Immagine caricata ma frontmatter non aggiornato: ' . $mdocRes['code'],
        ]);
    }
}

// ── 7. Invalida cache lista ──────────────────────────────────────────────────
@unlink(sys_get_temp_dir() . '/mm_lista_articoli.json');

jsonResponse([
    'success'  => true,
    'immagine' => $imageFilename,
    'url'      => "/images/articoli/{$imageFilename}",
    'prompt'   => $visualPrompt,
]);
