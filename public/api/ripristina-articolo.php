<?php
/**
 * POST /api/ripristina-articolo.php
 * Restores a Ghost post from a pseudo-.mdoc backup string.
 * Input: { slug, content }
 * where `content` is the pseudo-.mdoc format (YAML frontmatter + HTML body)
 * previously obtained from articolo.php.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body    = readJsonBody();
    $slug    = $body['slug'] ?? '';
    $content = $body['content'] ?? '';

    if (!$slug)    jsonResponse(['error' => 'Slug mancante'], 400);
    if (!$content) jsonResponse(['error' => 'Contenuto mancante'], 400);

    // ── Parse pseudo-.mdoc frontmatter ──
    $titolo   = '';
    $descr    = '';
    $seoTitle = '';
    $seoDescr = '';
    $immagine = '';
    $bozza    = false;

    if (preg_match('/^titolo:\s*"?([^"\n]+)"?\s*$/m',         $content, $m)) $titolo   = trim($m[1], " \t\"'");
    if (preg_match('/^descrizione:\s*"?([^"\n]+)"?\s*$/m',    $content, $m)) $descr    = trim($m[1], " \t\"'");
    if (preg_match('/^seo_title:\s*"?([^"\n]+)"?\s*$/m',      $content, $m)) $seoTitle = trim($m[1], " \t\"'");
    if (preg_match('/^seo_description:\s*"?([^"\n]+)"?\s*$/m',$content, $m)) $seoDescr = trim($m[1], " \t\"'");
    if (preg_match('/^immagine:\s*(\S+)/m',                    $content, $m)) $immagine = trim($m[1]);
    if (preg_match('/^bozza:\s*true/m',                        $content))     $bozza    = true;

    // ── Extract body (everything after the closing ---) ──
    $parts = preg_split('/^---$/m', $content, -1, PREG_SPLIT_NO_EMPTY);
    // parts[0] = frontmatter fields, parts[1] = body (or parts[2] if empty frontmatter)
    $corpo = count($parts) >= 2 ? trim(implode('---', array_slice($parts, 1))) : '';

    // ── Get existing post for optimistic lock ──
    $post = ghostGetPost($slug);
    if (!$post) jsonResponse(['error' => 'Articolo non trovato in Ghost'], 404);

    $mobiledoc = buildMobiledoc($corpo ?: '<p></p>');

    $postData = [
        'title'            => $titolo ?: $slug,
        'custom_excerpt'   => $descr ? substr($descr, 0, 300) : null,
        'meta_title'       => $seoTitle ?: null,
        'meta_description' => $seoDescr ?: null,
        'mobiledoc'        => $mobiledoc,
        'status'           => $bozza ? 'draft' : 'published',
        'updated_at'       => $post['updated_at'],
    ];
    if ($immagine) $postData['feature_image'] = $immagine;

    $res = ghostRequest('posts/' . $post['id'] . '/', 'PUT', ['posts' => [$postData]]);

    if ($res['code'] !== 200) {
        $msg = $res['body']['errors'][0]['message'] ?? json_encode($res['body']);
        jsonResponse(['error' => 'Ghost ' . $res['code'] . ': ' . $msg], 500);
    }

    ghostInvalidateListCache();
    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
