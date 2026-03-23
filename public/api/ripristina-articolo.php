<?php
/**
 * POST /api/ripristina-articolo.php
 * Writes raw content to a GitHub article file.
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
    $content = $body['content'] ?? '';

    if (!$slug) {
        jsonResponse(['error' => 'Slug mancante'], 400);
    }
    if (!$content) {
        jsonResponse(['error' => 'Contenuto mancante'], 400);
    }

    $filePath = "src/content/articoli/{$slug}/index.mdoc";

    // Check existing SHA
    $existing = ghGetFile($filePath);
    $sha = $existing ? $existing['sha'] : null;

    $res = ghPutFile($filePath, $content, "fix: ripristina articolo \"{$slug}\"", $sha);

    if ($res['code'] !== 200 && $res['code'] !== 201) {
        jsonResponse(['error' => 'GitHub PUT ' . $res['code'] . ': ' . json_encode($res['body'])], 500);
    }

    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
