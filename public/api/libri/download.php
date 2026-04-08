<?php
/**
 * GET /api/libri/download.php?token={uuid}&book={slug}
 * Verifica il token di acquisto e redireziona al PDF corrispondente.
 * Il token ha validità 30 giorni dal momento dell'acquisto.
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

// Mappa slug → percorso PDF pubblico
$PDF_FILES = [
    'scrivere-per-restare'     => '/libri/pdf/scrivere-per-restare.pdf',
    'restare-autentici-con-ai' => '/libri/pdf/restare-autentici-con-ai.pdf',
    'un-anno-di-scrittura'     => '/libri/pdf/un-anno-di-scrittura.pdf',
];

$siteUrl  = getenv('SITE_URL') ?: 'https://marcomunich.com';
$token    = trim($_GET['token'] ?? '');
$bookSlug = trim($_GET['book'] ?? '');

// Valida parametri
if (!$token || !$bookSlug) {
    errorPage('Link non valido. Controlla l\'email di conferma o scrivi su WhatsApp.');
}

if (!isset($PDF_FILES[$bookSlug])) {
    errorPage('Libro non trovato: ' . htmlspecialchars($bookSlug));
}

// Leggi Gist KV store
$store = gistRead();
$key   = "libro-token:{$token}";

if (!isset($store[$key])) {
    errorPage('Link non valido o già scaduto. Controlla l\'email di conferma o scrivi su WhatsApp.');
}

$entry     = $store[$key];
$bookSlugs = $entry['bookSlugs'] ?? [];
$createdAt = $entry['createdAt'] ?? '';

// Verifica che questo libro sia incluso nell'acquisto
if (!in_array($bookSlug, $bookSlugs, true)) {
    errorPage('Questo libro non è incluso nel tuo acquisto.');
}

// Verifica scadenza (30 giorni)
if ($createdAt) {
    $created = strtotime($createdAt);
    if ($created && (time() - $created) > (30 * 24 * 3600)) {
        errorPage('Il link di download è scaduto (validità 30 giorni). Scrivi su WhatsApp per rinnovarlo.');
    }
}

// Redirect al PDF
$pdfUrl = $siteUrl . $PDF_FILES[$bookSlug];
header('Location: ' . $pdfUrl, true, 302);
exit;

// ── Helper ──────────────────────────────────────────────────────────────────

function errorPage(string $message): void {
    http_response_code(403);
    // Reimposta content-type per HTML
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Download non disponibile — Marco Munich</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d1117;color:#fff;font-family:-apple-system,sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
    .card{max-width:520px;text-align:center}
    .icon{font-size:2.5rem;margin-bottom:1.5rem}
    h1{font-size:1.4rem;font-weight:800;margin-bottom:1rem;line-height:1.3}
    p{font-size:0.95rem;color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:1.8rem}
    a{display:inline-block;background:#E8590C;color:#fff;padding:12px 28px;
      border-radius:5px;text-decoration:none;font-weight:700;font-size:0.9rem}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;</div>
    <h1>' . htmlspecialchars($message) . '</h1>
    <p>Se hai problemi con il download contattami su WhatsApp e lo risolviamo subito.</p>
    <a href="https://wa.me/3895776332">Scrivi su WhatsApp &rarr;</a>
  </div>
</body>
</html>';
    exit;
}
