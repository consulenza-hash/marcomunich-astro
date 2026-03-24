<?php
/**
 * GET /api/statistiche.php?days=30
 * Ritorna dati GA4 + Google Search Console in formato JSON.
 * Auth: cookie stats_auth verificato da _config.php::checkAuth().
 *
 * Env vars richieste nel .env:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — JSON del service account (o base64 del JSON)
 *   GA4_PROPERTY_ID              — ID numerico proprietà GA4 (es. "123456789")
 *   GSC_SITE_URL                 — URL sito Search Console (es. "https://marcomunich.com/")
 */
require_once __DIR__ . '/_config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// ── Parametri ─────────────────────────────────────────────────────────────────
$validDays = [7, 14, 30, 90, 180, 0];
$daysParam = isset($_GET['days']) ? intval($_GET['days']) : 30;
$days      = in_array($daysParam, $validDays) ? $daysParam : 30;
$from      = isset($_GET['from']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['from']) ? $_GET['from'] : '';
$to        = isset($_GET['to'])   && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['to'])   ? $_GET['to']   : '';
$isCustom  = $from !== '' && $to !== '';

// ── Credenziali ───────────────────────────────────────────────────────────────
$saRaw = getenv('GOOGLE_SERVICE_ACCOUNT_JSON') ?: '';
if (!$saRaw) jsonResponse(['error' => 'GOOGLE_SERVICE_ACCOUNT_JSON mancante'], 500);

// Supporta JSON diretto o base64
$saJson = json_decode($saRaw, true) ? $saRaw : base64_decode($saRaw);
$sa     = json_decode($saJson, true);
if (!$sa) jsonResponse(['error' => 'GOOGLE_SERVICE_ACCOUNT_JSON non valido'], 500);

$propertyId = getenv('GA4_PROPERTY_ID') ?: '';
if (!$propertyId) jsonResponse(['error' => 'GA4_PROPERTY_ID mancante'], 500);

$siteUrl = rtrim(getenv('GSC_SITE_URL') ?: 'https://marcomunich.com/', '/') . '/';

// ── JWT / Token ───────────────────────────────────────────────────────────────
function makeJwt(array $sa, array $scopes): string {
    $now    = time();
    $header  = rtrim(strtr(base64_encode(json_encode(['alg'=>'RS256','typ'=>'JWT'])), '+/', '-_'), '=');
    $payload = rtrim(strtr(base64_encode(json_encode([
        'iss'   => $sa['client_email'],
        'scope' => implode(' ', $scopes),
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ])), '+/', '-_'), '=');

    $data = "$header.$payload";
    $key  = openssl_pkey_get_private($sa['private_key']);
    if (!$key) throw new RuntimeException('Chiave privata non valida nel service account');
    openssl_sign($data, $sig, $key, 'SHA256');
    $sigB64 = rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');
    return "$header.$payload.$sigB64";
}

function getAccessToken(array $sa, array $scopes): string {
    $jwt = makeJwt($sa, $scopes);
    $ch  = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 15,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200) throw new RuntimeException("Google auth error ($code): $res");
    $data = json_decode($res, true);
    return $data['access_token'] ?? '';
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpPost(string $url, array $body, string $token): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 400) throw new RuntimeException("HTTP $code: $res");
    return json_decode($res, true) ?? [];
}

// ── Date logic ────────────────────────────────────────────────────────────────
$today = date('Y-m-d');

if ($isCustom) {
    $startDate = $from;
    $endDate   = $to;
    $msRange   = max(1, (strtotime($to) - strtotime($from)) / 86400);
    $prevDays  = (int) round($msRange);
    $prevStart = date('Y-m-d', strtotime($from) - ($msRange + 1) * 86400);
    $prevEnd   = date('Y-m-d', strtotime($from) - 86400);
} elseif ($days === 0) {
    $startDate = '2020-01-01';
    $endDate   = 'today';
    $prevDays  = 365;
    $prevStart = '2018-01-01';
    $prevEnd   = '2019-12-31';
} else {
    $startDate = "{$days}daysAgo";
    $endDate   = 'today';
    $prevDays  = $days;
    $prevStart = ($days * 2) . 'daysAgo';
    $prevEnd   = ($days + 1) . 'daysAgo';
}

// GSC ha 3gg di ritardo; max 16 mesi indietro
$gscEnd      = date('Y-m-d', strtotime('-3 days'));
$gscMinDate  = date('Y-m-d', strtotime('-480 days'));
if ($isCustom) {
    $gscStart = $from < $gscMinDate ? $gscMinDate : $from;
} elseif ($days === 0) {
    $gscStart = $gscMinDate;
} else {
    $d = date('Y-m-d', strtotime("-{$prevDays} days"));
    $gscStart = $d < $gscMinDate ? $gscMinDate : $d;
}

// ── Fetch tokens ──────────────────────────────────────────────────────────────
try {
    $ga4Token = getAccessToken($sa, ['https://www.googleapis.com/auth/analytics.readonly']);
} catch (Exception $e) {
    jsonResponse(['error' => 'GA4 auth fallita: ' . $e->getMessage()], 500);
}

$gscToken  = '';
$gscError  = null;
try {
    $gscToken = getAccessToken($sa, ['https://www.googleapis.com/auth/webmasters.readonly']);
} catch (Exception $e) {
    $gscError = 'TOKEN: ' . $e->getMessage();
}

// ── GA4 richieste parallele (simulate in PHP — sequenziali) ───────────────────
$ga4Url = "https://analyticsdata.googleapis.com/v1beta/properties/{$propertyId}:runReport";

try {
    $rCur = httpPost($ga4Url, [
        'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
        'metrics'    => [
            ['name' => 'sessions'], ['name' => 'activeUsers'], ['name' => 'screenPageViews'],
            ['name' => 'averageSessionDuration'], ['name' => 'bounceRate'],
        ],
    ], $ga4Token);

    $rPrev = httpPost($ga4Url, [
        'dateRanges' => [['startDate' => $prevStart, 'endDate' => $prevEnd]],
        'metrics'    => [['name' => 'sessions'], ['name' => 'activeUsers'], ['name' => 'screenPageViews']],
    ], $ga4Token);

    $rDaily = httpPost($ga4Url, [
        'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
        'dimensions' => [['name' => 'date']],
        'metrics'    => [['name' => 'sessions']],
        'orderBys'   => [['dimension' => ['dimensionName' => 'date']]],
    ], $ga4Token);

    $rPages = httpPost($ga4Url, [
        'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
        'dimensions' => [['name' => 'pagePath']],
        'metrics'    => [['name' => 'screenPageViews'], ['name' => 'activeUsers']],
        'orderBys'   => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
        'limit'      => 15,
    ], $ga4Token);

    $rSources = httpPost($ga4Url, [
        'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
        'dimensions' => [['name' => 'sessionDefaultChannelGroup']],
        'metrics'    => [['name' => 'sessions']],
        'orderBys'   => [['metric' => ['metricName' => 'sessions'], 'desc' => true]],
    ], $ga4Token);
} catch (Exception $e) {
    jsonResponse(['error' => 'GA4 fetch fallita: ' . $e->getMessage()], 500);
}

// ── GSC opzionale ─────────────────────────────────────────────────────────────
$rKeywords = ['rows' => []];
$rGscPages = ['rows' => []];
if ($gscToken) {
    $gscUrl = 'https://searchconsole.googleapis.com/webmasters/v3/sites/' . rawurlencode($siteUrl) . '/searchAnalytics/query';
    try {
        $rKeywords = httpPost($gscUrl, [
            'startDate'  => $gscStart, 'endDate' => $gscEnd,
            'dimensions' => ['query'], 'rowLimit' => 25,
            'orderBy'    => [['fieldName' => 'clicks', 'sortOrder' => 'DESCENDING']],
        ], $gscToken);
        $rGscPages = httpPost($gscUrl, [
            'startDate'  => $gscStart, 'endDate' => $gscEnd,
            'dimensions' => ['page'], 'rowLimit' => 10,
            'orderBy'    => [['fieldName' => 'clicks', 'sortOrder' => 'DESCENDING']],
        ], $gscToken);
    } catch (Exception $e) {
        $gscError = $e->getMessage();
    }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function mV(array $row, int $i): float {
    return floatval($row['metricValues'][$i]['value'] ?? 0);
}
function dV(array $row, int $i): string {
    return $row['dimensionValues'][$i]['value'] ?? '';
}
function calcDelta(float $a, float $b): int {
    if ($b == 0) return 0;
    return (int) round(($a - $b) / $b * 100);
}
function fmtDate(string $ymd): string {
    $months = ['','gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    $p = explode('-', $ymd);
    return intval($p[2]) . ' ' . ($months[intval($p[1])] ?? $p[1]) . ' ' . $p[0];
}
function fmtShort(string $ymd): string {
    $months = ['','gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    $p = explode('-', $ymd);
    return intval($p[2]) . ' ' . ($months[intval($p[1])] ?? $p[1]);
}

// ── Assembla risposta ─────────────────────────────────────────────────────────
$curTot  = $rCur['totals'][0]  ?? $rCur['rows'][0]  ?? [];
$prevTot = $rPrev['totals'][0] ?? $rPrev['rows'][0] ?? [];

$overview = [
    'sessions'       => (int) round(mV($curTot, 0)),
    'sessionsDelta'  => calcDelta(mV($curTot, 0), mV($prevTot, 0)),
    'users'          => (int) round(mV($curTot, 1)),
    'usersDelta'     => calcDelta(mV($curTot, 1), mV($prevTot, 1)),
    'pageviews'      => (int) round(mV($curTot, 2)),
    'pageviewsDelta' => calcDelta(mV($curTot, 2), mV($prevTot, 2)),
    'avgDuration'    => (int) round(mV($curTot, 3)),
    'bounceRate'     => round(mV($curTot, 4) * 100 * 10) / 10,
];

$daily = array_map(fn($r) => [
    'date'     => dV($r, 0),
    'sessions' => (int) round(mV($r, 0)),
], $rDaily['rows'] ?? []);

$topPages = array_map(fn($r) => [
    'path'      => dV($r, 0),
    'pageviews' => (int) round(mV($r, 0)),
    'users'     => (int) round(mV($r, 1)),
], $rPages['rows'] ?? []);

$totalSess = array_sum(array_map(fn($r) => mV($r, 0), $rSources['rows'] ?? []));
$sources   = array_map(fn($r) => [
    'channel'  => dV($r, 0),
    'sessions' => (int) round(mV($r, 0)),
    'pct'      => $totalSess > 0 ? (int) round(mV($r, 0) / $totalSess * 100) : 0,
], $rSources['rows'] ?? []);

$keywords = array_map(fn($r) => [
    'query'       => $r['keys'][0] ?? '',
    'clicks'      => $r['clicks'] ?? 0,
    'impressions' => $r['impressions'] ?? 0,
    'ctr'         => round(($r['ctr'] ?? 0) * 1000) / 10,
    'position'    => round(($r['position'] ?? 0) * 10) / 10,
], $rKeywords['rows'] ?? []);

$gscPages = array_map(fn($r) => [
    'page'        => $r['keys'][0] ?? '',
    'clicks'      => $r['clicks'] ?? 0,
    'impressions' => $r['impressions'] ?? 0,
], $rGscPages['rows'] ?? []);

// Periodo label
if ($isCustom) {
    $periodStart = fmtDate($from);
    $periodEnd   = fmtDate($to);
} elseif ($days === 0) {
    $periodStart = fmtDate('2020-01-01');
    $periodEnd   = fmtDate($today);
} else {
    $periodStart = fmtDate(date('Y-m-d', strtotime("-{$days} days")));
    $periodEnd   = fmtDate($today);
}

$result = [
    'overview'  => $overview,
    'daily'     => $daily,
    'topPages'  => $topPages,
    'sources'   => $sources,
    'keywords'  => $keywords,
    'gscPages'  => $gscPages,
    'period'    => ['start' => $periodStart, 'end' => $periodEnd],
    'gscPeriod' => ['start' => fmtShort($gscStart), 'end' => fmtShort($gscEnd)],
];
if ($gscError) $result['gscError'] = $gscError;

jsonResponse($result);
