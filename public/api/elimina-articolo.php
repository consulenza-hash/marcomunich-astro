<?php
/**
 * POST /api/elimina-articolo.php
 * Permanently deletes a Ghost post.
 * Input: { slug }
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

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

    $post = ghostGetPost($slug);
    if (!$post) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    $res = ghostRequest('posts/' . $post['id'] . '/', 'DELETE');

    // Ghost DELETE returns 204 No Content on success
    if ($res['code'] !== 204) {
        $msg = $res['body']['errors'][0]['message'] ?? ('HTTP ' . $res['code']);
        jsonResponse(['error' => 'Ghost ' . $res['code'] . ': ' . $msg], 500);
    }

    ghostInvalidateListCache();
    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
