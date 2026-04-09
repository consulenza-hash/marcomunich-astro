<?php
/**
 * POST /api/cambia-password.php
 * Cambia la password admin aggiornando il file .env sul server.
 * Richiede autenticazione tramite cookie stats_auth.
 *
 * Body JSON: { "password_nuova": "..." }
 * Response:  { "success": true, "password": "..." }
 */
require_once __DIR__ . '/_config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body = readJsonBody();
$nuova = trim($body['password_nuova'] ?? '');

if (strlen($nuova) < 6) {
    jsonResponse(['error' => 'Password troppo corta (min 6 caratteri)'], 400);
}

$envPath = __DIR__ . '/../../.env';
$lines = file_exists($envPath) ? file($envPath, FILE_IGNORE_NEW_LINES) : [];

$updated = false;
foreach ($lines as &$line) {
    if (strpos(trim($line), 'STATS_PASSWORD=') === 0) {
        $line = 'STATS_PASSWORD=' . $nuova;
        $updated = true;
    }
}
unset($line);

if (!$updated) {
    $lines[] = 'STATS_PASSWORD=' . $nuova;
}

if (file_put_contents($envPath, implode("\n", $lines) . "\n") === false) {
    jsonResponse(['error' => 'Impossibile aggiornare .env — controlla i permessi'], 500);
}

jsonResponse(['success' => true, 'password' => $nuova]);
