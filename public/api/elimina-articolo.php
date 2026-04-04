<?php
/**
 * POST /api/elimina-articolo.php
 * Deletes an article folder from GitHub (all files in the folder).
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body = readJsonBody();
    $slug = $body['slug'] ?? '';

    if (!$slug) {
        jsonResponse(['error' => 'Slug mancante'], 400);
    }

    $dirPath = "src/content/articoli/{$slug}";
    $files = ghListDir($dirPath);

    if (empty($files)) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    // Delete all files in the folder
    foreach ($files as $file) {
        $sha = $file['sha'] ?? '';
        $path = $file['path'] ?? '';
        if ($sha && $path) {
            ghDeleteFile($path, $sha, "chore: elimina {$path}");
        }
    }

    // Invalidate list cache
    @unlink(sys_get_temp_dir() . '/mm_lista_articoli.json');

    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
