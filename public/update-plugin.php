<?php
// One-shot: aggiorna il plugin Marco Munich Auto Deploy
// Eliminare dopo l'uso!
define('ACCESS', 'mmu2026_plugin_upd_9z3w');
if (($_GET['key'] ?? '') !== ACCESS) { http_response_code(403); exit("403\n"); }

$plugin_path = __DIR__ . '/wp-content/plugins/marco-munich-auto-deploy/marco-munich-auto-deploy.php';

$new_code = '<?php
/**
 * Plugin Name: Marco Munich Auto Deploy
 * Description: Invia webhook a GitHub Actions quando pubblichi, aggiorni o elimini un articolo.
 * Version: 1.1
 */

function mm_trigger_github_deploy($reason = \'unknown\') {
    $token = get_option(\'github_dispatch_token\', \'\');
    if (empty($token)) {
        error_log(\'[MM-Deploy] github_dispatch_token non configurato\');
        return;
    }

    $response = wp_remote_post(
        \'https://api.github.com/repos/consulenza-hash/marcomunich-astro/dispatches\',
        [
            \'headers\' => [
                \'Authorization\' => \'Bearer \' . $token,
                \'Accept\'        => \'application/vnd.github.v3+json\',
                \'Content-Type\'  => \'application/json\',
                \'User-Agent\'    => \'WordPress-Deploy-Hook/1.1\',
            ],
            \'body\'    => json_encode([\'event_type\' => \'wp_content_changed\']),
            \'timeout\' => 15,
        ]
    );

    if (is_wp_error($response)) {
        error_log(\'[MM-Deploy] Errore: \' . $response->get_error_message());
    } else {
        $code = wp_remote_retrieve_response_code($response);
        error_log(\'[MM-Deploy] Webhook inviato (HTTP \' . $code . \') — motivo: \' . $reason);
    }
}

// Trigger su: pubblica nuovo, aggiorna pubblicato, de-pubblica
add_action(\'transition_post_status\', function($new_status, $old_status, $post) {
    if ($post->post_type !== \'post\') return;
    if ($new_status === $old_status) return;

    $involves_publish = ($new_status === \'publish\' || $old_status === \'publish\');
    if (!$involves_publish) return;

    // Escludi auto-draft e revisioni
    if (in_array($new_status, [\'auto-draft\', \'inherit\']) || in_array($old_status, [\'auto-draft\', \'inherit\'])) return;

    $reason = $old_status . \' → \' . $new_status . \' (\' . $post->post_title . \')\';
    mm_trigger_github_deploy($reason);
}, 10, 3);

// Trigger anche su eliminazione definitiva di post pubblicati
add_action(\'before_delete_post\', function($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== \'post\') return;
    if ($post->post_status === \'publish\') {
        mm_trigger_github_deploy(\'delete: \' . $post->post_title);
    }
});
';

if (!file_exists($plugin_path)) {
    // Lista tutte le cartelle plugin per trovare il path corretto
    $plugins_dir = __DIR__ . '/wp-content/plugins/';
    $dirs = glob($plugins_dir . '*', GLOB_ONLYDIR);
    echo "❌ Plugin file non trovato: $plugin_path\n\n";
    echo "📂 Plugin disponibili:\n";
    foreach ($dirs as $d) {
        $dirname = basename($d);
        $files = glob($d . '/*.php');
        foreach ($files as $f) {
            echo "   $dirname/" . basename($f) . "\n";
        }
    }
    exit();
}

$backup_path = $plugin_path . '.bak';
copy($plugin_path, $backup_path);

$result = file_put_contents($plugin_path, $new_code);

header('Content-Type: text/plain; charset=utf-8');
if ($result !== false) {
    echo "✅ Plugin aggiornato ({$result} bytes)\n";
    echo "📦 Backup salvato in: $backup_path\n";
    echo "📋 Nuovi trigger:\n";
    echo "   • Pubblica nuovo articolo\n";
    echo "   • Aggiorna articolo già pubblicato\n";
    echo "   • De-pubblica / manda in bozza\n";
    echo "   • Sposta in cestino\n";
    echo "   • Elimina definitivamente\n";
} else {
    echo "❌ Errore scrittura file\n";
}
