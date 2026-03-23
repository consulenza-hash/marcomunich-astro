<?php
/**
 * POST /api/pubblica-articolo.php
 * Reads article from GitHub, removes bozza: true from frontmatter, commits back.
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

    $filePath = "src/content/articoli/{$slug}/index.mdoc";
    $file = ghGetFile($filePath);

    if (!$file) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    $content = $file['content'];

    // Remove bozza: true line from frontmatter
    $content = preg_replace('/^bozza:\s*true\n?/m', '', $content);

    $res = ghPutFile($filePath, $content, "feat: pubblica articolo \"{$slug}\"", $file['sha']);

    if ($res['code'] !== 200 && $res['code'] !== 201) {
        jsonResponse(['error' => 'GitHub PUT ' . $res['code']], 500);
    }

    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
