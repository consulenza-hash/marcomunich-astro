<?php
/**
 * GET /api/prompt-pack/validate-token.php?token=xxx
 * Validates an access token. Returns { valid: true, email, name } or { valid: false }.
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$token = trim($_GET['token'] ?? '');

if (!$token) {
    jsonResponse(['valid' => false, 'reason' => 'token mancante']);
}

try {
    $store = gistRead();

    $key = 'token:' . $token;
    if (!isset($store[$key]) || !is_array($store[$key])) {
        jsonResponse(['valid' => false, 'reason' => 'token non trovato']);
    }

    $entry = $store[$key];

    jsonResponse([
        'valid'  => true,
        'email'  => $entry['email'] ?? '',
        'name'   => $entry['name'] ?? '',
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
