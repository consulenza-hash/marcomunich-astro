<?php
/**
 * POST /api/reset-password.php
 * Reset password tramite codice di recupero (nessuna auth richiesta).
 * Usare solo quando si è bloccati fuori dall'admin.
 *
 * Body JSON: { "recovery_code": "...", "password_nuova": "..." }
 * Response:  { "success": true }
 *
 * Il recovery code è letto ESCLUSIVAMENTE da ADMIN_RECOVERY_CODE nel file .env.
 * SEC-018 FIX: nessun default hardcoded, rate limiting 3 tentativi / 15 min.
 */
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// ── SEC-018: Rate limiting (3 tentativi per 15 minuti) ────────────────────────
$lockFile = sys_get_temp_dir() . '/mm_reset_attempts.json';
$now      = time();
$attempts = [];
if (file_exists($lockFile)) {
    $attempts = json_decode(file_get_contents($lockFile), true) ?: [];
}
// Tieni solo i tentativi degli ultimi 15 minuti
$attempts = array_values(array_filter($attempts, fn($t) => ($now - $t) < 900));
if (count($attempts) >= 3) {
    jsonResponse(['error' => 'Troppi tentativi. Riprova tra 15 minuti.'], 429);
}
$attempts[] = $now;
@file_put_contents($lockFile, json_encode($attempts));

// ── Leggi body ────────────────────────────────────────────────────────────────
$body     = readJsonBody();
$recovery = trim($body['recovery_code'] ?? '');
$nuova    = trim($body['password_nuova'] ?? '');

// ── SEC-018: Nessun default — fallback chiuso ─────────────────────────────────
$expectedRecovery = getenv('ADMIN_RECOVERY_CODE');
if ($expectedRecovery === false || $expectedRecovery === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Recovery code non configurato sul server']);
    exit;
}

// SEC-018: hash_equals previene timing attacks
if (!hash_equals($expectedRecovery, $recovery)) {
    jsonResponse(['error' => 'Codice non valido'], 401);
}

if (strlen($nuova) < 8) {
    jsonResponse(['error' => 'Password troppo corta (min 8 caratteri)'], 400);
}

// Scrivi in .admin-pwd — non toccato dai deploy (lftp mirror senza --delete)
$pwdFile = __DIR__ . '/../../.admin-pwd';
if (file_put_contents($pwdFile, $nuova) === false) {
    jsonResponse(['error' => 'Impossibile scrivere .admin-pwd — controlla i permessi'], 500);
}

// Reset contatore tentativi dopo successo
@unlink($lockFile);

jsonResponse(['success' => true]);
