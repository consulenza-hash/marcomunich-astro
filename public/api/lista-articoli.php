<?php
/**
 * GET /api/lista-articoli.php
 * Lists all articles (draft + published + scheduled) from Ghost Admin API.
 * Returns [{id, slug, titolo, data, status, bozza, hasImmagine}]
 * 5-minute server-side cache.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// ── Cache (5-min TTL) ─────────────────────────────────────────────────────
define('LISTA_TTL', 300);

if (file_exists(LISTA_GHOST_CACHE) && (time() - filemtime(LISTA_GHOST_CACHE)) < LISTA_TTL) {
    header('Content-Type: application/json');
    header('X-Cache: HIT');
    readfile(LISTA_GHOST_CACHE);
    exit;
}

try {
    $fields = 'id,slug,title,published_at,updated_at,status,feature_image';
    $res    = ghostRequest(
        'posts/?limit=all' .
        '&filter=status%3A[draft,published,scheduled]' .
        '&fields=' . $fields .
        '&order=published_at%20desc'
    );

    if ($res['code'] !== 200) {
        $msg = $res['body']['errors'][0]['message'] ?? $res['raw'];
        jsonResponse(['error' => 'Ghost API ' . $res['code'] . ': ' . $msg], 500);
    }

    $posts    = $res['body']['posts'] ?? [];
    $articoli = [];

    foreach ($posts as $p) {
        $status     = $p['status'] ?? 'draft';
        $articoli[] = [
            'id'          => $p['id'],
            'slug'        => $p['slug'],
            'titolo'      => $p['title'] ?? $p['slug'],
            'data'        => $p['published_at'] ? substr($p['published_at'], 0, 10) : '',
            'status'      => $status,
            'bozza'       => ($status === 'draft'),
            'hasImmagine' => !empty($p['feature_image']),
        ];
    }

    $json = json_encode($articoli, JSON_UNESCAPED_UNICODE);
    @file_put_contents(LISTA_GHOST_CACHE, $json);

    header('Content-Type: application/json');
    header('X-Cache: MISS');
    echo $json;

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
