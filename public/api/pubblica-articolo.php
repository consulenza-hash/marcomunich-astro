<?php
/**
 * POST /api/pubblica-articolo.php
 * Publishes a Ghost post (changes status to 'published').
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
    // SEC-023 FIX: valida slug
    if (!preg_match('/^[a-z0-9][a-z0-9\-]{0,99}$/', $slug)) {
        jsonResponse(['error' => 'Slug non valido'], 400);
    }

    $post = ghostGetPost($slug);
    if (!$post) {
        jsonResponse(['error' => 'Articolo non trovato'], 404);
    }

    $res = ghostRequest('posts/' . $post['id'] . '/', 'PUT', [
        'posts' => [[
            'status'     => 'published',
            'updated_at' => $post['updated_at'], // optimistic lock
        ]],
    ]);

    if ($res['code'] !== 200) {
        $msg = $res['body']['errors'][0]['message'] ?? json_encode($res['body']);
        jsonResponse(['error' => 'Ghost ' . $res['code'] . ': ' . $msg], 500);
    }

    ghostInvalidateListCache();
    triggerRebuild('ghost_post_published');
    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
