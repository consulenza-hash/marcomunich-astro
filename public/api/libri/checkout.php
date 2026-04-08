<?php
/**
 * GET /api/libri/checkout.php?book={slug}
 * Creates a Stripe Checkout Session for a single book or the bundle.
 *
 * Slugs:
 *   scrivere-per-restare          €7.90  → STRIPE_PRICE_BOOK_SPR
 *   restare-autentici-con-ai      €9.90  → STRIPE_PRICE_BOOK_RAI
 *   un-anno-di-scrittura          €12.90 → STRIPE_PRICE_BOOK_UAS
 *   bundle-tutti                  €24.90 → STRIPE_PRICE_BOOK_BUNDLE
 */
require_once __DIR__ . '/../_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$BOOKS = [
    'scrivere-per-restare' => [
        'name'     => 'Scrivere per Restare (PDF)',
        'price_id' => getenv('STRIPE_PRICE_BOOK_SPR') ?: '',
        'slugs'    => ['scrivere-per-restare'],
    ],
    'restare-autentici-con-ai' => [
        'name'     => "Restare Autentici Scrivendo con l'AI (PDF)",
        'price_id' => getenv('STRIPE_PRICE_BOOK_RAI') ?: '',
        'slugs'    => ['restare-autentici-con-ai'],
    ],
    'un-anno-di-scrittura' => [
        'name'     => 'Un Anno di Scrittura per Scoprire Chi Sei Davvero (PDF)',
        'price_id' => getenv('STRIPE_PRICE_BOOK_UAS') ?: '',
        'slugs'    => ['un-anno-di-scrittura'],
    ],
    'bundle-tutti' => [
        'name'     => 'Tutti i Libri PDF — Pacchetto Completo',
        'price_id' => getenv('STRIPE_PRICE_BOOK_BUNDLE') ?: '',
        'slugs'    => ['scrivere-per-restare', 'restare-autentici-con-ai', 'un-anno-di-scrittura'],
    ],
];

try {
    $stripeSecretKey = getenv('STRIPE_SECRET_KEY');
    $siteUrl = getenv('SITE_URL') ?: 'https://marcomunich.com';

    if (!$stripeSecretKey) {
        jsonResponse(['error' => 'STRIPE_SECRET_KEY mancante'], 500);
    }

    $bookSlug = trim($_GET['book'] ?? $_POST['book'] ?? '');
    if (!$bookSlug || !isset($BOOKS[$bookSlug])) {
        jsonResponse(['error' => 'Libro non trovato: ' . htmlspecialchars($bookSlug)], 404);
    }

    $book = $BOOKS[$bookSlug];
    if (!$book['price_id']) {
        jsonResponse(['error' => 'Stripe Price ID non configurato per: ' . $bookSlug . '. Aggiungere la variabile .env sul server.'], 500);
    }

    $sessionData = http_build_query([
        'mode'                       => 'payment',
        'line_items[0][price]'       => $book['price_id'],
        'line_items[0][quantity]'    => 1,
        'success_url'                => "{$siteUrl}/libri/grazie?book={$bookSlug}&session_id={CHECKOUT_SESSION_ID}",
        'cancel_url'                 => "{$siteUrl}/libri?cancelled=1",
        'billing_address_collection' => 'auto',
        'customer_creation'          => 'always',
        'invoice_creation[enabled]'  => 'true',
        'invoice_creation[invoice_data][description]' => $book['name'],
        'locale'                     => 'it',
        'consent_collection[terms_of_service]' => 'required',
        'custom_text[terms_of_service_acceptance][message]' =>
            "Accetto i [Termini e Condizioni](https://marcomunich.com/termini) e la [Privacy Policy](https://marcomunich.com/privacy-policy). " .
            "Confermo di voler ricevere immediatamente il prodotto digitale e rinuncio al diritto di recesso ai sensi dell'art. 59 D.Lgs. 206/2005.",
        'metadata[product]'          => 'libro-pdf',
        'metadata[bookSlug]'         => $bookSlug,
        'metadata[bookSlugs]'        => implode(',', $book['slugs']),
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

    // GET → redirect diretto al checkout Stripe
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        header('Location: ' . $checkoutUrl, true, 303);
        exit;
    }

    jsonResponse(['url' => $checkoutUrl]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
