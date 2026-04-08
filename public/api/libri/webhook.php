<?php
/**
 * POST /api/libri/webhook.php
 * Stripe webhook per acquisti libri PDF.
 * Su checkout.session.completed:
 *   - genera token UUID
 *   - salva nel Gist KV (stesso store del prompt-pack, namespace separato)
 *   - invia email via Resend con link/i di download
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// Mappa slug → nome leggibile
$BOOK_NAMES = [
    'scrivere-per-restare'         => 'Scrivere per Restare',
    'restare-autentici-con-ai'     => "Restare Autentici Scrivendo con l'AI",
    'un-anno-di-scrittura'         => 'Un Anno di Scrittura per Scoprire Chi Sei Davvero',
];

try {
    $webhookSecret   = getenv('STRIPE_WEBHOOK_SECRET_LIBRI') ?: getenv('STRIPE_WEBHOOK_SECRET');
    $resendApiKey    = getenv('RESEND_API_KEY');
    $siteUrl         = getenv('SITE_URL') ?: 'https://marcomunich.com';

    if (!$webhookSecret) {
        jsonResponse(['error' => 'STRIPE_WEBHOOK_SECRET_LIBRI mancante'], 500);
    }

    $payload   = file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

    if (!$sigHeader) {
        jsonResponse(['error' => 'Missing stripe-signature header'], 400);
    }

    $event = verifyStripeWebhook($payload, $sigHeader, $webhookSecret);
    if (!$event) {
        jsonResponse(['error' => 'Firma webhook non valida'], 400);
    }

    // Ignora eventi non rilevanti
    if ($event['type'] !== 'checkout.session.completed') {
        echo json_encode(['ok' => true, 'message' => 'Evento ignorato']);
        exit;
    }

    $session   = $event['data']['object'];
    $metadata  = $session['metadata'] ?? [];

    // Verifica che sia un acquisto libri
    if (($metadata['product'] ?? '') !== 'libro-pdf') {
        echo json_encode(['ok' => true, 'message' => 'Non un acquisto libri']);
        exit;
    }

    $email     = $session['customer_details']['email'] ?? '';
    $name      = $session['customer_details']['name'] ?? '';
    $sessionId = $session['id'] ?? '';
    $bookSlug  = $metadata['bookSlug'] ?? '';
    $bookSlugsRaw = $metadata['bookSlugs'] ?? $bookSlug;
    $bookSlugs = array_filter(array_map('trim', explode(',', $bookSlugsRaw)));

    if (!$email || empty($bookSlugs)) {
        jsonResponse(['error' => 'Email o slugs mancanti'], 400);
    }

    // Recupera URL fattura
    $stripeSecretKey = getenv('STRIPE_SECRET_KEY');
    $receiptUrl = null;
    $invoiceId = $session['invoice'] ?? '';
    if ($invoiceId && $stripeSecretKey) {
        $ch = curl_init("https://api.stripe.com/v1/invoices/{$invoiceId}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $stripeSecretKey]);
        $invData = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $receiptUrl = $invData['hosted_invoice_url'] ?? null;
    }

    // Genera token download
    $token = generateUUIDv4();

    // Salva nel Gist KV
    $store = gistRead();
    $store["libro-token:{$token}"] = [
        'email'            => strtolower($email),
        'name'             => $name,
        'bookSlugs'        => $bookSlugs,
        'createdAt'        => date('c'),
        'stripeSessionId'  => $sessionId,
        'stripeReceiptUrl' => $receiptUrl,
    ];
    // Indice email → token (per recupero)
    $existingTokens = isset($store['libro-email:' . strtolower($email)])
        ? explode(',', $store['libro-email:' . strtolower($email)])
        : [];
    $existingTokens[] = $token;
    $store['libro-email:' . strtolower($email)] = implode(',', $existingTokens);
    gistWrite($store);

    // Invia email
    if ($resendApiKey) {
        sendBookEmail($resendApiKey, $email, $name, $token, $bookSlugs, $BOOK_NAMES, $siteUrl, $sessionId, $receiptUrl);
    }

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

// ── Helper functions ──────────────────────────────────────────────────────────

function generateUUIDv4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function verifyStripeWebhook(string $payload, string $sigHeader, string $secret): ?array {
    $parts = [];
    foreach (explode(',', $sigHeader) as $item) {
        $kv = explode('=', trim($item), 2);
        if (count($kv) === 2) $parts[$kv[0]] = $kv[1];
    }
    $timestamp = $parts['t'] ?? '';
    $signature = $parts['v1'] ?? '';
    if (!$timestamp || !$signature) return null;
    if (abs(time() - (int)$timestamp) > 300) return null;
    $expected = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);
    if (!hash_equals($expected, $signature)) return null;
    return json_decode($payload, true);
}

function sendBookEmail(
    string $apiKey,
    string $email,
    string $name,
    string $token,
    array  $bookSlugs,
    array  $bookNames,
    string $siteUrl,
    string $sessionId,
    ?string $receiptUrl
): void {
    $firstName = explode(' ', $name)[0] ?: 'ciao';
    $isBundle  = count($bookSlugs) > 1;
    $subject   = $isBundle ? 'I tuoi libri PDF sono pronti' : 'Il tuo libro PDF è pronto';

    // Costruisce i link di download
    $linksHtml = '';
    foreach ($bookSlugs as $slug) {
        $bookName    = $bookNames[$slug] ?? $slug;
        $downloadUrl = "{$siteUrl}/api/libri/download.php?token={$token}&book={$slug}";
        $linksHtml  .= "
          <tr>
            <td style=\"padding-bottom:16px;\">
              <a href=\"{$downloadUrl}\"
                 style=\"display:inline-block;background:#E8590C;color:#fff;
                         padding:13px 28px;border-radius:5px;text-decoration:none;
                         font-weight:700;font-size:0.95rem;font-family:-apple-system,sans-serif;\">
                &#8595; Scarica: {$bookName}
              </a>
            </td>
          </tr>";
    }

    $receiptHtml = $receiptUrl ? "
          <tr>
            <td style=\"padding-bottom:20px;\">
              <a href=\"{$receiptUrl}\"
                 style=\"font-size:0.82rem;color:rgba(255,255,255,0.4);text-decoration:underline;\">
                Visualizza la ricevuta &rarr;
              </a>
            </td>
          </tr>" : '';

    $intro = $isBundle
        ? "Grazie per aver acquistato il pacchetto completo. Trovi qui sotto il link per scaricare ciascun libro."
        : "Grazie per l'acquisto. Clicca il pulsante qui sotto per scaricare il tuo PDF.";

    $html = "<!DOCTYPE html>
<html lang=\"it\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <title>{$subject}</title>
</head>
<body style=\"margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,sans-serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0d1117;\">
    <tr>
      <td align=\"center\" style=\"padding:40px 16px;\">
        <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;\">
          <tr>
            <td style=\"padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,0.08);\">
              <span style=\"font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;color:#E8590C;\">
                Marco Munich
              </span>
            </td>
          </tr>
          <tr>
            <td style=\"padding:28px 0 8px;\">
              <h1 style=\"margin:0;font-size:1.7rem;font-weight:800;color:#fff;line-height:1.2;\">
                " . ($isBundle ? "I tuoi libri<br><span style=\"color:#E8590C;\">sono pronti.</span>" : "Il tuo libro<br><span style=\"color:#E8590C;\">è pronto.</span>") . "
              </h1>
            </td>
          </tr>
          <tr>
            <td style=\"padding:16px 0 24px;\">
              <p style=\"margin:0 0 8px;font-size:0.98rem;line-height:1.65;color:rgba(240,235,227,0.7);\">
                Ciao {$firstName},
              </p>
              <p style=\"margin:0;font-size:0.98rem;line-height:1.65;color:rgba(240,235,227,0.7);\">
                {$intro}
              </p>
            </td>
          </tr>
          {$linksHtml}
          <tr>
            <td style=\"padding:4px 0 24px;\">
              <p style=\"margin:0;font-size:0.82rem;line-height:1.5;color:rgba(240,235,227,0.4);\">
                Il link di download è personale e funziona per 30 giorni.<br>
                Salvalo nei preferiti o scarica subito il file.
              </p>
            </td>
          </tr>
          {$receiptHtml}
          <tr>
            <td style=\"padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);\">
              <p style=\"margin:0;font-size:0.75rem;line-height:1.5;color:rgba(240,235,227,0.25);\">
                Ordine: {$sessionId}<br>
                Prodotto digitale — consegna immediata. Il diritto di recesso non si applica (art. 59 D.Lgs. 206/2005).<br>
                <a href=\"{$siteUrl}/termini\" style=\"color:rgba(232,89,12,0.4);text-decoration:underline;\">Termini e Condizioni</a>
                &nbsp;·&nbsp;
                <a href=\"https://wa.me/3895776332\" style=\"color:rgba(232,89,12,0.4);text-decoration:underline;\">Assistenza WhatsApp</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

    $payload = json_encode([
        'from'    => 'Marco Munich <noreply@marcomunich.com>',
        'to'      => [$email],
        'subject' => $subject,
        'html'    => $html,
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ]);
    curl_exec($ch);
    curl_close($ch);
}
