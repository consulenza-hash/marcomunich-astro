<?php
/**
 * POST /api/prompt-pack/checkout.php
 * Creates a Stripe Checkout Session and returns the URL for redirect.
 */
require_once __DIR__ . '/../_config.php';

// No auth check — this is a public endpoint

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $stripeSecretKey = getenv('STRIPE_SECRET_KEY');
    $priceId = getenv('STRIPE_PRICE_ID');
    $siteUrl = getenv('SITE_URL') ?: 'https://marcomunich.com';

    if (!$stripeSecretKey) {
        jsonResponse(['error' => 'STRIPE_SECRET_KEY mancante'], 500);
    }
    if (!$priceId) {
        jsonResponse(['error' => 'STRIPE_PRICE_ID mancante'], 500);
    }

    $newsletter = ($_GET['newsletter'] ?? $_POST['newsletter'] ?? '0') === '1' ? 'true' : 'false';

    // Create Stripe Checkout Session via API
    $sessionData = http_build_query([
        'mode' => 'payment',
        'line_items[0][price]' => $priceId,
        'line_items[0][quantity]' => 1,
        'success_url' => "{$siteUrl}/prompt-pack/grazie?session_id={CHECKOUT_SESSION_ID}",
        'cancel_url' => "{$siteUrl}/prompt-pack?cancelled=1",
        'billing_address_collection' => 'auto',
        'customer_creation' => 'always',
        'invoice_creation[enabled]' => 'true',
        'invoice_creation[invoice_data][description]' => 'Prompt Pack per Coach, Counselor e Operatori Olistici',
        'locale' => 'it',
        'consent_collection[terms_of_service]' => 'required',
        'custom_text[terms_of_service_acceptance][message]' => 'Accetto i [Termini e Condizioni](https://marcomunich.com/termini) e la [Privacy Policy](https://marcomunich.com/privacy-policy). Confermo di voler ricevere immediatamente il prodotto digitale e rinuncio al diritto di recesso ai sensi dell\'art. 59 D.Lgs. 206/2005.',
        'metadata[product]' => 'prompt-pack',
        'metadata[newsletterConsent]' => $newsletter,
    ]);

    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $sessionData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $stripeSecretKey,
        'Content-Type: application/x-www-form-urlencoded',
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    curl_close($ch);

    $session = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMsg = $session['error']['message'] ?? 'Stripe API error';
        throw new Exception("Stripe error: {$errorMsg}");
    }

    $checkoutUrl = $session['url'] ?? '';
    if (!$checkoutUrl) {
        throw new Exception('Stripe non ha restituito un URL');
    }

    // For GET requests, redirect directly
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        header('Location: ' . $checkoutUrl, true, 303);
        exit;
    }

    // For POST requests, return JSON with URL
    jsonResponse(['url' => $checkoutUrl]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
