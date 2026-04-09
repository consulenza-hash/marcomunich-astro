<?php
/**
 * POST /api/reset-password.php
 * Reset password tramite codice di recupero (nessuna auth richiesta).
 * Usare solo quando si è bloccati fuori dall'admin.
 *
 * Body JSON: { "recovery_code": "...", "password_nuova": "..." }
 * Response:  { "success": true }
 *
 * Il recovery code è letto da ADMIN_RECOVERY_CODE nel file .env.
 * Default: MARCOMUNICH-RESET-2026
 */
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body = readJsonBody();
$recovery = trim($body['recovery_code'] ?? '');
$nuova    = trim($body['password_nuova'] ?? '');

$expectedRecovery = getenv('ADMIN_RECOVERY_CODE') ?: 'MARCOMUNICH-RESET-2026';

if ($recovery !== $expectedRecovery) {
    // Risposta volutamente generica per non rivelare se il codice era vicino
    http_response_code(401);
    echo json_encode(['error' => 'Codice non valido']);
    exit;
}

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

jsonResponse(['success' => true]);
