<?php
/**
 * POST /api/salva-bozza.php
 * Creates or updates a Ghost post.
 * Status: draft (default) or published (when art.bozza === false from editor).
 * Input: { art, modo, slug_esistente, existing_titolo, existing_corpo, existing_immagine, existing_data }
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body             = readJsonBody();
    $art              = $body['art'] ?? [];
    $modo             = $body['modo'] ?? '';
    $slugEsistente    = $body['slug_esistente'] ?? '';
    $existingTitolo   = $body['existing_titolo'] ?? '';
    $existingCorpo    = $body['existing_corpo'] ?? '';
    $existingImmagine = $body['existing_immagine'] ?? '';

    // ── Resolve fields (AI output overrides existing) ──
    $titolo   = notNull($art['titolo'])   ?: $existingTitolo;
    $corpo    = notNull($art['corpo'])    ?: $existingCorpo;
    $descr    = notNull($art['descrizione']) ?: '';
    $seoTitle = notNull($art['seo_title']);
    $seoDescr = notNull($art['seo_description']);
    $immagine = notNull($art['immagine']) ?: $existingImmagine;
    $faqs     = is_array($art['schema_faq'] ?? null) ? $art['schema_faq'] : [];

    // ── Determine slug ──
    if ($slugEsistente) {
        $slug = $slugEsistente;
    } else {
        $raw  = notNull($art['slug']) ?: $titolo ?: ('articolo-' . time());
        $slug = ghostSlugify($raw) ?: ('articolo-' . time());
    }

    // ── Build mobiledoc ──
    $faqHtml   = buildFaqHtml($faqs);
    $mobiledoc = buildMobiledoc($corpo ?: '<p></p>', $faqHtml);

    // ── Status: art.bozza===false means "Pubblicato" in the editor toggle ──
    $wantPublish = array_key_exists('bozza', $art) && $art['bozza'] === false;
    $ghostStatus = $wantPublish ? 'published' : 'draft';

    // ── Build Ghost post payload ──
    $postData = [
        'title'            => $titolo,
        'slug'             => $slug,
        'custom_excerpt'   => $descr ? substr($descr, 0, 300) : null,
        'meta_title'       => $seoTitle ?: null,
        'meta_description' => $seoDescr ?: null,
        'mobiledoc'        => $mobiledoc,
        'status'           => $ghostStatus,
    ];
    if ($immagine) $postData['feature_image'] = $immagine;

    // ── Create or update ──
    $existing = $slugEsistente ? ghostGetPost($slug) : null;

    if ($existing) {
        $postData['updated_at'] = $existing['updated_at']; // optimistic lock
        $res = ghostRequest('posts/' . $existing['id'] . '/', 'PUT', ['posts' => [$postData]]);
    } else {
        $res = ghostRequest('posts/', 'POST', ['posts' => [$postData]]);
    }

    if ($res['code'] !== 200 && $res['code'] !== 201) {
        $msg = $res['body']['errors'][0]['message'] ?? json_encode($res['body']);
        jsonResponse(['error' => 'Ghost ' . $res['code'] . ': ' . $msg], 500);
    }

    $savedSlug = $res['body']['posts'][0]['slug'] ?? $slug;
    ghostInvalidateListCache();

    jsonResponse(['success' => true, 'slug' => $savedSlug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

/** Return value only if non-empty and not the literal string "null". */
function notNull($v): string {
    if ($v === null || $v === 'null' || $v === '') return '';
    return (string) $v;
}
