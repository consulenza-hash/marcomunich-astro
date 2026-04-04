<?php
/**
 * GET /api/lista-articoli.php
 * Optimised: 1 Git Tree call + parallel blob fetch + 5-min server cache.
 *   Old approach: 1 + N + N = 449 sequential API calls (~30 s)
 *   New approach: 1 tree + N parallel blobs + file cache (~2-5 s first load, ~0 ms cached)
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// ── Server-side cache (5-min TTL) ──────────────────────────────────────────
define('LISTA_CACHE', sys_get_temp_dir() . '/mm_lista_articoli.json');
define('LISTA_TTL', 300);

if (file_exists(LISTA_CACHE) && (time() - filemtime(LISTA_CACHE)) < LISTA_TTL) {
    header('Content-Type: application/json');
    header('X-Cache: HIT');
    readfile(LISTA_CACHE);
    exit;
}

try {
    // ── Step 1: One recursive Git Tree call ─────────────────────────────────
    $treeUrl = GH_API_BASE . '/git/trees/' . GH_BRANCH . '?recursive=1';
    $treeRes = githubRequest($treeUrl);

    if ($treeRes['code'] !== 200) {
        jsonResponse(['error' => 'Tree API ' . $treeRes['code']], 500);
    }

    if (!empty($treeRes['body']['truncated'])) {
        // Fallback: very large repos — still works, just incomplete for huge sites
        error_log('[lista-articoli] git tree truncated, some articles may be missing');
    }

    $tree   = $treeRes['body']['tree'] ?? [];
    $prefix = 'src/content/articoli/';
    $slugs  = []; // slug => ['sha' => string, 'hasImmagine' => bool]

    foreach ($tree as $item) {
        $path = $item['path'] ?? '';
        if (!str_starts_with($path, $prefix)) continue;

        $rel   = substr($path, strlen($prefix)); // e.g. "mio-articolo/index.mdoc"
        $slash = strpos($rel, '/');
        if ($slash === false) continue;           // root-level file, skip

        $slug     = substr($rel, 0, $slash);
        $filename = substr($rel, $slash + 1);

        if ($filename === 'index.mdoc') {
            if (!isset($slugs[$slug])) $slugs[$slug] = ['sha' => '', 'hasImmagine' => false];
            $slugs[$slug]['sha'] = $item['sha'];
        } elseif (preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $filename)) {
            if (!isset($slugs[$slug])) $slugs[$slug] = ['sha' => '', 'hasImmagine' => false];
            $slugs[$slug]['hasImmagine'] = true;
        }
    }

    // ── Step 2: Parallel blob fetch via curl_multi ──────────────────────────
    $token   = getenv('GITHUB_TOKEN');
    $mh      = curl_multi_init();
    $handles = []; // slug => curl handle

    foreach ($slugs as $slug => $info) {
        if (empty($info['sha'])) continue;

        $url = GH_API_BASE . '/git/blobs/' . $info['sha'];
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_HTTPHEADER     => [
                'Authorization: token ' . $token,
                'Accept: application/vnd.github.v3+json',
                'User-Agent: marcomunich-api',
            ],
        ]);
        curl_multi_add_handle($mh, $ch);
        $handles[$slug] = $ch;
    }

    // Run all requests in parallel
    $running = null;
    do {
        $status = curl_multi_exec($mh, $running);
        if ($running) curl_multi_select($mh, 1.0);
    } while ($running > 0 && $status === CURLM_OK);

    // ── Step 3: Parse frontmatter from each blob ─────────────────────────────
    $articoli = [];

    foreach ($handles as $slug => $ch) {
        $raw  = curl_multi_getcontent($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);

        if ($code !== 200 || !$raw) continue;

        $blob    = json_decode($raw, true);
        // Blob content is base64-encoded with newlines every 60 chars
        $content = base64_decode(str_replace(["\n", "\r", ' '], '', $blob['content'] ?? ''));
        if (!$content) continue;

        $titolo      = '';
        $data        = '';
        $bozza       = false;
        $hasImmagine = $slugs[$slug]['hasImmagine'] ?? false;

        // Extract frontmatter fields (handles quoted and unquoted values)
        if (preg_match('/^titolo:\s*["\']?(.*?)["\']?\s*$/m', $content, $m))
            $titolo = trim($m[1], " \t\"'");
        if (preg_match('/^data:\s*([\d\-]+)/m', $content, $m))
            $data = trim($m[1]);
        if (preg_match('/^bozza:\s*true/m', $content))
            $bozza = true;
        // Frontmatter immagine field as additional signal
        if (!$hasImmagine && preg_match('/^immagine:\s*\S/m', $content))
            $hasImmagine = true;

        $articoli[] = [
            'slug'        => $slug,
            'titolo'      => $titolo ?: $slug,
            'data'        => $data,
            'bozza'       => $bozza,
            'hasImmagine' => $hasImmagine,
        ];
    }

    curl_multi_close($mh);

    // Sort by date descending
    usort($articoli, fn($a, $b) => strcmp($b['data'], $a['data']));

    $json = json_encode($articoli, JSON_UNESCAPED_UNICODE);

    // Save cache
    @file_put_contents(LISTA_CACHE, $json);

    header('Content-Type: application/json');
    header('X-Cache: MISS');
    echo $json;
    exit;

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
