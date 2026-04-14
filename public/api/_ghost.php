<?php
/**
 * Ghost Admin API helper functions.
 * Requires _config.php to be loaded first (for env vars + jsonResponse).
 */

function ghostAdminUrl(): string {
    return rtrim(getenv('GHOST_URL') ?: 'https://cms.marcomunich.com', '/');
}

/**
 * Generate a Ghost Admin API JWT token.
 * Key format: "id:hex_secret"
 */
function ghostJwt(): string {
    $key = getenv('GHOST_ADMIN_API_KEY') ?: '';
    if (!$key || strpos($key, ':') === false) {
        jsonResponse(['error' => 'GHOST_ADMIN_API_KEY mancante o non valida'], 500);
    }
    [$id, $secret] = explode(':', $key, 2);

    $now     = time();
    $header  = ghostBase64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT', 'kid' => $id]));
    $payload = ghostBase64url(json_encode(['iat' => $now, 'exp' => $now + 300, 'aud' => '/admin/']));
    $sig     = ghostBase64url(hash_hmac('sha256', "$header.$payload", hex2bin($secret), true));

    return "$header.$payload.$sig";
}

function ghostBase64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Make an authenticated Ghost Admin API request.
 * $endpoint examples: 'posts/', 'posts/slug/my-post/', 'posts/abc123/'
 */
function ghostRequest(string $endpoint, string $method = 'GET', $data = null): array {
    $url   = ghostAdminUrl() . '/ghost/api/admin/' . ltrim($endpoint, '/');
    $token = ghostJwt();

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Ghost ' . $token,
            'Content-Type: application/json',
            'Accept-Version: v5.130',
        ],
    ]);

    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    $response = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $err = curl_error($ch);
        curl_close($ch);
        jsonResponse(['error' => 'Ghost cURL error: ' . $err], 500);
    }
    curl_close($ch);

    return ['code' => $code, 'body' => json_decode($response, true), 'raw' => $response];
}

/**
 * Fetch a single Ghost post by slug (mobiledoc format).
 * Returns the post array or null if not found.
 */
function ghostGetPost(string $slug): ?array {
    $fields = 'id,slug,title,custom_excerpt,mobiledoc,meta_title,meta_description,feature_image,published_at,updated_at,status';
    $res    = ghostRequest('posts/slug/' . urlencode($slug) . '/?formats=mobiledoc&fields=' . $fields);

    if ($res['code'] === 404) return null;
    if ($res['code'] !== 200) {
        $msg = $res['body']['errors'][0]['message'] ?? $res['raw'];
        jsonResponse(['error' => 'Ghost GET post/' . $slug . ' → ' . $res['code'] . ': ' . $msg], 500);
    }
    return $res['body']['posts'][0] ?? null;
}

// ── Mobiledoc helpers ──────────────────────────────────────────────────────

/**
 * Extract HTML body from mobiledoc first card.
 */
function mobiledocToHtml(?string $mobiledocJson): string {
    if (!$mobiledocJson) return '';
    $md = json_decode($mobiledocJson, true);
    if (!$md || empty($md['cards'])) return '';
    $card = $md['cards'][0] ?? null;
    if ($card && $card[0] === 'html' && isset($card[1]['html'])) {
        return $card[1]['html'];
    }
    return '';
}

/**
 * Extract FAQ items from mobiledoc second card (JSON-LD FAQPage).
 * Returns [{domanda, risposta}] or [].
 */
function mobiledocExtractFaq(?string $mobiledocJson): array {
    if (!$mobiledocJson) return [];
    $md = json_decode($mobiledocJson, true);
    if (!$md || count($md['cards'] ?? []) < 2) return [];

    $card = $md['cards'][1] ?? null;
    if (!$card || $card[0] !== 'html') return [];

    $html = $card[1]['html'] ?? '';
    if (!preg_match('/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/s', $html, $m)) return [];

    $schema   = json_decode(trim($m[1]), true);
    $entities = $schema['mainEntity'] ?? [];
    if (empty($entities)) return [];

    $faqs = [];
    foreach ($entities as $item) {
        $domanda  = $item['name'] ?? '';
        $risposta = $item['acceptedAnswer']['text'] ?? '';
        if ($domanda && $risposta) {
            $faqs[] = ['domanda' => $domanda, 'risposta' => $risposta];
        }
    }
    return $faqs;
}

/**
 * Build FAQ HTML with embedded JSON-LD (for mobiledoc card 1).
 */
function buildFaqHtml(array $faqs): string {
    $faqs = array_filter($faqs, fn($f) => !empty($f['domanda']) && !empty($f['risposta']));
    if (empty($faqs)) return '';

    $html     = '<section class="faq-schema">';
    $entities = [];

    foreach ($faqs as $faq) {
        $d = htmlspecialchars($faq['domanda'], ENT_QUOTES, 'UTF-8');
        $r = htmlspecialchars($faq['risposta'], ENT_QUOTES, 'UTF-8');
        $html .= "<div class=\"faq-item\"><h3 class=\"faq-q\">{$d}</h3><p class=\"faq-a\">{$r}</p></div>";
        $entities[] = [
            '@type'          => 'Question',
            'name'           => $faq['domanda'],
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['risposta']],
        ];
    }

    $schema = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $entities];
    $html  .= '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_UNICODE) . '</script>';
    $html  .= '</section>';

    return $html;
}

/**
 * Build a mobiledoc JSON string from HTML body + optional FAQ HTML.
 */
function buildMobiledoc(string $html, string $faqHtml = ''): string {
    $cards    = [['html', ['html' => $html]]];
    $sections = [[10, 0]];

    if ($faqHtml) {
        $cards[]    = ['html', ['html' => $faqHtml]];
        $sections[] = [10, 1];
    }

    return json_encode([
        'version'  => '0.3.1',
        'markups'  => [],
        'atoms'    => [],
        'cards'    => $cards,
        'sections' => $sections,
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * Reconstruct a pseudo-.mdoc string from a Ghost post.
 * Preserves the format expected by admin pages (YAML frontmatter + body).
 */
function ghostPostToTesto(array $post): string {
    $titolo   = $post['title'] ?? '';
    $descr    = $post['custom_excerpt'] ?? '';
    $seoTitle = $post['meta_title'] ?? '';
    $seoDescr = $post['meta_description'] ?? '';
    $immagine = $post['feature_image'] ?? '';
    $data     = $post['published_at'] ? substr($post['published_at'], 0, 10) : date('Y-m-d');
    $status   = $post['status'] ?? 'draft';
    $bozza    = ($status === 'draft');
    $faqs     = mobiledocExtractFaq($post['mobiledoc'] ?? null);
    $corpo    = mobiledocToHtml($post['mobiledoc'] ?? null);

    $esc = fn(string $s) => str_replace(['"', '\\'], ['\\"', '\\\\'], $s);

    $yaml  = "---\n";
    $yaml .= 'titolo: "' . $esc($titolo) . "\"\n";
    if ($descr)    $yaml .= 'descrizione: "' . $esc($descr) . "\"\n";
    $yaml .= "data: {$data}\n";
    if ($seoTitle) $yaml .= 'seo_title: "' . $esc($seoTitle) . "\"\n";
    if ($seoDescr) $yaml .= 'seo_description: "' . $esc($seoDescr) . "\"\n";
    if ($immagine) $yaml .= "immagine: {$immagine}\n";
    if ($bozza)    $yaml .= "bozza: true\n";

    if (!empty($faqs)) {
        $yaml .= "schema_faq:\n";
        foreach ($faqs as $faq) {
            $yaml .= '  - domanda: "' . $esc($faq['domanda']) . "\"\n";
            $yaml .= '    risposta: "' . $esc($faq['risposta']) . "\"\n";
        }
    }
    $yaml .= "---\n\n";

    return $yaml . $corpo;
}

/**
 * Slug helper: lowercase, ASCII-safe, hyphenated.
 */
function ghostSlugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

/** Shared cache path for article list */
define('LISTA_GHOST_CACHE', sys_get_temp_dir() . '/mm_lista_articoli_ghost.json');

function ghostInvalidateListCache(): void {
    @unlink(LISTA_GHOST_CACHE);
}
