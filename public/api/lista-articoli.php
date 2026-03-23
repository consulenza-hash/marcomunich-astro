<?php
/**
 * GET /api/lista-articoli.php
 * Reads src/content/articoli/ from GitHub, extracts metadata from each .mdoc.
 * Returns sorted JSON array.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    // List all folders in src/content/articoli/
    $dirs = ghListDir('src/content/articoli');
    $articoli = [];

    foreach ($dirs as $item) {
        if (($item['type'] ?? '') !== 'dir') continue;

        $slug = $item['name'];
        $filePath = "src/content/articoli/{$slug}/index.mdoc";
        $file = ghGetFile($filePath);

        if (!$file) continue;

        $content = $file['content'];

        // Extract frontmatter
        $titolo = '';
        $data = '';
        $bozza = false;
        $hasImmagine = false;

        if (preg_match('/^titolo:\s*"?([^"\n]+)"?/m', $content, $m)) {
            $titolo = str_replace('\\"', '"', trim($m[1]));
        }
        if (preg_match('/^data:\s*(.+)/m', $content, $m)) {
            $data = trim($m[1]);
        }
        if (preg_match('/^bozza:\s*true/m', $content)) {
            $bozza = true;
        }

        // Check if there's an image file in the folder
        $folderContents = ghListDir("src/content/articoli/{$slug}");
        foreach ($folderContents as $f) {
            $name = $f['name'] ?? '';
            if (preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $name)) {
                $hasImmagine = true;
                break;
            }
        }

        $articoli[] = [
            'slug' => $slug,
            'titolo' => $titolo,
            'data' => $data,
            'bozza' => $bozza,
            'hasImmagine' => $hasImmagine,
        ];
    }

    // Sort by data descending
    usort($articoli, function ($a, $b) {
        return strcmp($b['data'], $a['data']);
    });

    jsonResponse($articoli);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
