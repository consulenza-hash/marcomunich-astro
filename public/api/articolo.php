<?php
/**
 * GET /api/articolo.php?slug=xxx
 * Reads a single article from Ghost Admin API.
 * Returns { testo, id, status, updated_at }
 * where `testo` is a pseudo-.mdoc string (YAML frontmatter + HTML body)
 * for backwards compatibility with admin pages.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $slug = trim($_GET['slug'] ?? '');
    if (!$slug) {
        jsonResponse(['error' => 'Missing slug'], 400);
    }

    $post = ghostGetPost($slug);
    if (!$post) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    jsonResponse([
        'testo'      => ghostPostToTesto($post),
        'id'         => $post['id'],
        'status'     => $post['status'],
        'updated_at' => $post['updated_at'],
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
