<?php
/**
 * POST /api/salva-batch.php
 * Saves multiple articles to Ghost in sequence.
 * Input: { articles: [{ slug, art, modo, existing_titolo, existing_corpo, existing_immagine, existing_data }] }
 * Returns: { success, saved, errors, results }
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_ghost.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// Shared notNull helper
function notNull($v): string {
    if ($v === null || $v === 'null' || $v === '') return '';
    return (string) $v;
}

try {
    $body     = readJsonBody();
    $articles = $body['articles'] ?? [];

    if (empty($articles)) {
        jsonResponse(['error' => 'Nessun articolo'], 400);
    }

    $results = [];
    $errors  = [];

    foreach ($articles as $item) {
        $slug             = $item['slug'] ?? '';
        $art              = $item['art'] ?? [];
        $existingTitolo   = $item['existing_titolo'] ?? '';
        $existingCorpo    = $item['existing_corpo'] ?? '';
        $existingImmagine = $item['existing_immagine'] ?? '';

        try {
            $titolo   = notNull($art['titolo'])       ?: $existingTitolo;
            $corpo    = notNull($art['corpo'])         ?: $existingCorpo;
            $descr    = notNull($art['descrizione'])   ?: '';
            $seoTitle = notNull($art['seo_title'])     ?: null;
            $seoDescr = notNull($art['seo_description']) ?: null;
            $immagine = notNull($art['immagine'])      ?: $existingImmagine;
            $faqs     = is_array($art['schema_faq'] ?? null) ? $art['schema_faq'] : [];

            $faqHtml   = buildFaqHtml($faqs);
            $mobiledoc = buildMobiledoc($corpo ?: '<p></p>', $faqHtml);

            $postData = [
                'title'            => $titolo,
                'custom_excerpt'   => $descr ? substr($descr, 0, 300) : null,
                'meta_title'       => $seoTitle ?: null,
                'meta_description' => $seoDescr ?: null,
                'mobiledoc'        => $mobiledoc,
                'status'           => 'draft',
            ];
            if ($immagine) $postData['feature_image'] = $immagine;

            // Fetch existing post
            $existing = $slug ? ghostGetPost($slug) : null;

            if ($existing) {
                $postData['updated_at'] = $existing['updated_at'];
                $res = ghostRequest('posts/' . $existing['id'] . '/', 'PUT', ['posts' => [$postData]]);
            } else {
                if ($slug) $postData['slug'] = $slug;
                $res = ghostRequest('posts/', 'POST', ['posts' => [$postData]]);
            }

            if ($res['code'] !== 200 && $res['code'] !== 201) {
                $msg     = $res['body']['errors'][0]['message'] ?? json_encode($res['body']);
                $errors[] = ['slug' => $slug, 'error' => 'Ghost ' . $res['code'] . ': ' . $msg];
            } else {
                $savedSlug = $res['body']['posts'][0]['slug'] ?? $slug;
                $results[] = ['slug' => $savedSlug, 'ok' => true];
            }

        } catch (Exception $e) {
            $errors[] = ['slug' => $slug, 'error' => $e->getMessage()];
        }

        // Throttle: avoid Ghost rate limiting (200ms between requests)
        usleep(200000);
    }

    ghostInvalidateListCache();

    jsonResponse([
        'success' => empty($errors),
        'saved'   => count($results),
        'errors'  => $errors,
        'results' => $results,
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
