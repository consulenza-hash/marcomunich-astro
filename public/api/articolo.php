<?php
/**
 * GET /api/articolo.php?slug=xxx
 * Reads a single article from GitHub and returns its full .mdoc content.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $slug = $_GET['slug'] ?? '';
    if (!$slug) {
        jsonResponse(['error' => 'Missing slug'], 400);
    }

    $filePath = "src/content/articoli/{$slug}/index.mdoc";
    $file = ghGetFile($filePath);

    if (!$file) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    jsonResponse(['testo' => $file['content']]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
