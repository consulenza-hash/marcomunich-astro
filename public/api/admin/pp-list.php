<?php
/**
 * GET /api/admin/pp-list.php
 * Returns list of all Prompt Pack purchasers (admin only).
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $store = gistRead();

    $purchasers = [];
    foreach ($store as $key => $value) {
        if (strpos($key, 'token:') === 0 && is_array($value)) {
            $purchasers[] = [
                'token'            => substr($key, 6),
                'name'             => $value['name'] ?? '',
                'email'            => $value['email'] ?? '',
                'createdAt'        => $value['createdAt'] ?? '',
                'newsletterConsent'=> (bool)($value['newsletterConsent'] ?? false),
                'stripeSessionId'  => $value['stripeSessionId'] ?? '',
                'stripeReceiptUrl' => $value['stripeReceiptUrl'] ?? null,
            ];
        }
    }

    // Sort by createdAt desc (most recent first)
    usort($purchasers, function($a, $b) {
        return strcmp($b['createdAt'], $a['createdAt']);
    });

    jsonResponse($purchasers);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
