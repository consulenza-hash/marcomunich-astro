<?php
/**
 * POST /api/carica-immagine.php
 * Carica un'immagine dal client, la converte in JPEG ottimizzata,
 * la commette su GitHub e aggiorna il frontmatter dell'articolo.
 *
 * Body: multipart/form-data  { file: <image>, slug: string }
 * Response: { success: true, filename: '{slug}.jpg', url: '/images/articoli/{slug}.jpg' }
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$slug = trim($_POST['slug'] ?? '');
if (!$slug) jsonResponse(['error' => 'Slug mancante'], 400);
// SEC-023 FIX: valida slug — previene path traversal nei path GitHub
if (!preg_match('/^[a-z0-9][a-z0-9\-]{0,99}$/', $slug)) {
    jsonResponse(['error' => 'Slug non valido'], 400);
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['error' => 'File mancante o errore upload'], 400);
}

$tmpPath  = $_FILES['file']['tmp_name'];
$mimeType = mime_content_type($tmpPath);

// Accetta solo immagini
if (!in_array($mimeType, ['image/jpeg','image/png','image/webp','image/gif'], true)) {
    jsonResponse(['error' => 'Formato non supportato: ' . $mimeType], 400);
}

// ── Converti in JPEG con GD ──────────────────────────────────────
if (!extension_loaded('gd')) {
    jsonResponse(['error' => 'GD non disponibile sul server'], 500);
}

if ($mimeType === 'image/jpeg')      $src = imagecreatefromjpeg($tmpPath);
elseif ($mimeType === 'image/png')   $src = imagecreatefrompng($tmpPath);
elseif ($mimeType === 'image/webp')  $src = imagecreatefromwebp($tmpPath);
elseif ($mimeType === 'image/gif')   $src = imagecreatefromgif($tmpPath);
else $src = false;

if (!$src) jsonResponse(['error' => 'Impossibile leggere l\'immagine'], 500);

// Ridimensiona se > 1600px di larghezza
$w = imagesx($src);
$h = imagesy($src);
if ($w > 1600) {
    $newH = (int) round($h * 1600 / $w);
    $dst  = imagecreatetruecolor(1600, $newH);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, 1600, $newH, $w, $h);
    imagedestroy($src);
    $src = $dst;
}

ob_start();
imagejpeg($src, null, 88);
$jpegData = ob_get_clean();
imagedestroy($src);

// ── Commit su GitHub ──────────────────────────────────────────────
$filename   = $slug . '.jpg';
$remotePath = 'public/images/articoli/' . $filename;

$existing = ghGetFile($remotePath);
$sha      = $existing['sha'] ?? null;

$result = ghPutFile(
    $remotePath,
    $jpegData,
    ($sha ? 'Aggiorna' : 'Aggiunge') . ' immagine articolo: ' . $slug,
    $sha
);

if (!$result) {
    jsonResponse(['error' => 'Errore commit GitHub'], 500);
}

// ── Aggiorna frontmatter articolo ─────────────────────────────────
$articlePath = "src/content/articoli/{$slug}/index.mdoc";
$article     = ghGetFile($articlePath);

if ($article) {
    $content = $article['content'];
    // Sostituisce o aggiunge il campo immagine nel frontmatter
    if (preg_match('/^(---\r?\n[\s\S]*?)^immagine:.*$/m', $content)) {
        $newContent = preg_replace(
            '/^immagine:.*$/m',
            'immagine: ' . $filename,
            $content
        );
    } elseif (preg_match('/^---\r?\n([\s\S]*?)\r?\n---/m', $content, $m)) {
        $newContent = str_replace(
            $m[0],
            str_replace($m[1], $m[1] . "\nimmagine: " . $filename, $m[0]),
            $content
        );
    } else {
        $newContent = $content;
    }
    if ($newContent !== $content) {
        ghPutFile($articlePath, $newContent, 'Imposta immagine articolo: ' . $slug, $article['sha']);
    }
}

// Invalida cache lista
@unlink(sys_get_temp_dir() . '/mm_lista_articoli.json');

jsonResponse([
    'success'  => true,
    'filename' => $filename,
    'url'      => '/images/articoli/' . $filename,
]);
