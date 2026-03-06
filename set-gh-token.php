<?php
// One-time token updater — eliminare dopo l'uso
define('ACCESS', 'mmu2026_oneshot_7x9k');
if (($_GET['key'] ?? '') !== ACCESS) { http_response_code(403); exit("403\n"); }

$new_token = $_GET['t'] ?? '';
if (empty($new_token)) { exit("Parametro 't' mancante\n"); }

define('ABSPATH', realpath(__DIR__) . '/');
require_once __DIR__ . '/wp-load.php';

$old = get_option('github_dispatch_token', '(vuoto)');
update_option('github_dispatch_token', $new_token);
$check = get_option('github_dispatch_token', '');

header('Content-Type: text/plain; charset=utf-8');
echo "Vecchio token: " . substr($old, 0, 8) . "...\n";
echo "Nuovo token:   " . substr($check, 0, 8) . "...\n";
echo ($check === $new_token) ? "✅ Salvato correttamente!\n" : "❌ Errore salvataggio\n";
