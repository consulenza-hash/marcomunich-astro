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

// Write to .admin-pwd — this file is NOT touched by deploys (lftp mirror without --delete)
$pwdFile = __DIR__ . '/../../.admin-pwd';
if (file_put_contents($pwdFile, $nuova) === false) {
    jsonResponse(['error' => 'Impossibile scrivere .admin-pwd — controlla i permessi'], 500);
}

// SEC-021 FIX: mai restituire la password nel body della risposta
jsonResponse(['success' => true]);
