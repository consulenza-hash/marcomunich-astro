<?php
/**
 * Marco Munich — Deploy Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Chiamato da GitHub Actions dopo il push sul branch deploy.
 * Esegue: git reset --hard origin/deploy
 *
 * INSTALLAZIONE: copia questo file in ~/public_html/deploy-webhook.php
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Token segreto — deve corrispondere al GitHub Secret WEBHOOK_SECRET
define('SECRET', 'dee77c38fa4d0bf61046eee260ec9ead252c8e7af111f523');

// Verifica header X-Webhook-Secret (inviato da GitHub Actions)
$provided = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? ($_GET['secret'] ?? '');
if (!hash_equals(SECRET, $provided)) {
    http_response_code(403);
    header('Content-Type: text/plain');
    exit("403 Unauthorized\n");
}

// Solo POST o GET
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit("405 Method Not Allowed\n");
}

// Percorso assoluto alla document root
$docRoot = realpath(__DIR__);

// Esegui git reset
$cmd    = "cd " . escapeshellarg($docRoot) . " && git reset --hard origin/deploy 2>&1";
$output = shell_exec($cmd);

// Risposta
http_response_code(200);
header('Content-Type: text/plain; charset=utf-8');
echo "Deploy completato ✓\n\n";
echo $output . "\n";
echo "Timestamp: " . date('Y-m-d H:i:s T') . "\n";
