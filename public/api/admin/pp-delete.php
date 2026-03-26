<?php
/**
 * POST /api/admin/pp-delete.php
 * Body: { "email": "..." }
 * Admin only. Removes a user's access from the Gist (both email: and token: keys).
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body  = readJsonBody();
$email = strtolower(trim($body['email'] ?? ''));

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Email non valida'], 400);
}

try {
    $store    = gistRead();
    $emailKey = 'email:' . $email;

    if (!isset($store[$emailKey])) {
        jsonResponse(['error' => 'Utente non trovato'], 404);
    }

    $token     = $store[$emailKey];
    $tokenKey  = 'token:' . $token;

    unset($store[$emailKey]);
    unset($store[$tokenKey]);

    gistWrite($store);

    // Verify deletion
    $verify = gistRead();
    if (isset($verify[$emailKey]) || isset($verify[$tokenKey])) {
        jsonResponse(['error' => 'Eliminazione fallita — riprova'], 500);
    }

    jsonResponse(['ok' => true]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
