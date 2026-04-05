<?php
/**
 * POST /api/salva-bozza.php
 * Builds .mdoc frontmatter + body, commits to GitHub with bozza: true.
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body = readJsonBody();

    $art = $body['art'] ?? [];
    $modo = $body['modo'] ?? '';
    $slugEsistente = $body['slug_esistente'] ?? '';
    $existingTitolo = $body['existing_titolo'] ?? '';
    $existingCorpo = $body['existing_corpo'] ?? '';
    $existingImmagine = $body['existing_immagine'] ?? '';

    // ── Determine slug ──
    if ($slugEsistente) {
        $slug = $slugEsistente;
    } else {
        $rawSlug = (!empty($art['slug']) && $art['slug'] !== 'null') ? $art['slug']
            : ((!empty($art['titolo']) && $art['titolo'] !== 'null') ? $art['titolo']
            : 'articolo-' . time());
        $slug = slugify($rawSlug);
        if (!$slug) $slug = 'articolo-' . time();
    }

    $filePath = "src/content/articoli/{$slug}/index.mdoc";

    // Check if file exists (need SHA for update) and preserve existing fields
    $existing = ghGetFile($filePath);
    $sha = $existing ? $existing['sha'] : null;

    // Preserve immagine and bozza from existing frontmatter
    if ($existing) {
        if (empty($existingImmagine) && preg_match('/^immagine:\s*(\S+)/m', $existing['content'], $m)) {
            $existingImmagine = trim($m[1]);
        }
        // Preserve bozza status from existing file (pubblica-articolo.php removes it separately)
        $preserveBozza = (bool) preg_match('/^bozza:\s*true/m', $existing['content']);
    } else {
        $preserveBozza = true; // new articles always start as draft
    }

    // ── Build .mdoc content ──
    $mdocContent = buildMdoc($art, $existingTitolo, $existingCorpo, $preserveBozza, $existingImmagine);

    $commitMessage = 'feat: bozza AI "' . ($art['titolo'] ?? $slug) . '" [' . $modo . ']';
    $res = ghPutFile($filePath, $mdocContent, $commitMessage, $sha);

    if ($res['code'] !== 200 && $res['code'] !== 201) {
        jsonResponse(['error' => 'GitHub PUT ' . $res['code'] . ': ' . json_encode($res['body'])], 500);
    }

    // Invalidate list cache so next load reflects this change
    @unlink(sys_get_temp_dir() . '/mm_lista_articoli.json');

    jsonResponse(['success' => true, 'slug' => $slug]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

// ── Helper functions ──

function slugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    // Remove accents via transliteration
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

function escYaml(string $s): string {
    return str_replace(['"', '\\'], ['\\"', '\\\\'], $s);
}

function buildMdoc(array $art, string $existingTitolo, string $existingCorpo, bool $bozza = false, string $existingImmagine = ''): string {
    $titolo = (!empty($art['titolo']) && $art['titolo'] !== 'null') ? $art['titolo'] : $existingTitolo;
    $corpo = (!empty($art['corpo']) && $art['corpo'] !== 'null') ? $art['corpo'] : $existingCorpo;
    $descr = (!empty($art['descrizione']) && $art['descrizione'] !== 'null') ? $art['descrizione'] : '';
    $seoTitle = (!empty($art['seo_title']) && $art['seo_title'] !== 'null') ? $art['seo_title'] : null;
    $seoDescr = (!empty($art['seo_description']) && $art['seo_description'] !== 'null') ? $art['seo_description'] : null;
    $faqs = is_array($art['schema_faq'] ?? null) ? $art['schema_faq'] : [];
    $today = date('Y-m-d');

    $yaml = "---\n";
    $yaml .= 'titolo: "' . escYaml($titolo) . "\"\n";
    $yaml .= 'descrizione: "' . escYaml($descr) . "\"\n";
    $yaml .= "data: {$today}\n";
    if ($seoTitle) $yaml .= 'seo_title: "' . escYaml($seoTitle) . "\"\n";
    if ($seoDescr) $yaml .= 'seo_description: "' . escYaml($seoDescr) . "\"\n";
    $yaml .= "seo_noindex: false\n";
    // Preserve immagine if present (from upload or existing frontmatter)
    $immagine = (!empty($art['immagine']) && $art['immagine'] !== 'null') ? $art['immagine'] : $existingImmagine;
    if ($immagine) $yaml .= 'immagine: ' . $immagine . "\n";
    if ($bozza) $yaml .= "bozza: true\n";

    if (count($faqs) > 0) {
        $yaml .= "schema_faq:\n";
        foreach ($faqs as $faq) {
            if (!empty($faq['domanda']) && !empty($faq['risposta'])) {
                $yaml .= '  - domanda: "' . escYaml($faq['domanda']) . "\"\n";
                $yaml .= '    risposta: "' . escYaml($faq['risposta']) . "\"\n";
            }
        }
    }

    $yaml .= "---\n\n";
    return $yaml . ($corpo ?? '');
}
