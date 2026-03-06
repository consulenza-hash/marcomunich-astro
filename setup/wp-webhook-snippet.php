<?php
/**
 * WordPress → GitHub Actions Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Quando pubblichi un articolo, WordPress notifica GitHub Actions
 * che fa automaticamente il build e deploy del sito Astro.
 *
 * INSTALLAZIONE:
 * 1. Vai in WP Admin → Aspetto → Editor tema → functions.php
 * 2. Incolla questo codice IN FONDO al file (prima del ?> finale se esiste)
 * 3. Vai in WP Admin → Impostazioni → Generali
 *    Aggiungi in fondo all'URL del sito: /wp-admin/options.php
 *    Cerca "github_dispatch_token" e inserisci il tuo GitHub PAT
 *    (vedi istruzioni nel file SETUP.md)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Trigger deploy quando un articolo viene pubblicato (o aggiornato da bozza)
add_action('transition_post_status', function($new_status, $old_status, $post) {

    // Solo per post (non pagine, non custom post types)
    if ($post->post_type !== 'post') return;

    // Solo quando lo stato passa a "publish"
    if ($new_status !== 'publish') return;

    // Non ritriggerare se era già pubblicato (aggiornamenti interni)
    // Rimuovi questa riga se vuoi il deploy anche per aggiornamenti
    if ($old_status === 'publish') return;

    $token = get_option('github_dispatch_token', '');
    if (empty($token)) {
        error_log('[WP-Deploy] github_dispatch_token non configurato in WP options');
        return;
    }

    $response = wp_remote_post(
        'https://api.github.com/repos/consulenza-hash/marcomunich-astro/dispatches',
        [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Accept'        => 'application/vnd.github.v3+json',
                'Content-Type'  => 'application/json',
                'User-Agent'    => 'WordPress-Deploy-Hook/1.0',
            ],
            'body'    => json_encode(['event_type' => 'wp_post_published']),
            'timeout' => 15,
        ]
    );

    if (is_wp_error($response)) {
        error_log('[WP-Deploy] Errore webhook: ' . $response->get_error_message());
    } else {
        $code = wp_remote_retrieve_response_code($response);
        error_log('[WP-Deploy] Webhook inviato — HTTP ' . $code . ' — post: ' . $post->post_title);
    }

}, 10, 3);
