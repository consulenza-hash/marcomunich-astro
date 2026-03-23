<?php
/**
 * POST /api/admin-auth.php
 * Verifica password admin e ritorna success/failure.
 */
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body = readJsonBody();
    $password = $body['password'] ?? '';

    $expected = getenv('STATS_PASSWORD') ?: 'stats2024';

    if ($password === $expected) {
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Password non valida'], 401);
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
