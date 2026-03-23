<?php
/**
 * POST /api/prompt-pack/webhook.php
 * Receives Stripe webhook events, verifies signature.
 * On checkout.session.completed: records buyer in Gist KV store, sends email via Resend.
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

// No auth check — Stripe sends webhooks directly

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $webhookSecret = getenv('STRIPE_WEBHOOK_SECRET');
    $stripeSecretKey = getenv('STRIPE_SECRET_KEY');
    $resendApiKey = getenv('RESEND_API_KEY');
    $siteUrl = getenv('SITE_URL') ?: 'https://marcomunich.com';

    if (!$webhookSecret) {
        jsonResponse(['error' => 'STRIPE_WEBHOOK_SECRET mancante'], 500);
    }

    // Read raw body for signature verification
    $payload = file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

    if (!$sigHeader) {
        jsonResponse(['error' => 'Missing stripe-signature header'], 400);
    }

    // ── Verify Stripe signature ──
    $event = verifyStripeWebhook($payload, $sigHeader, $webhookSecret);

    if (!$event) {
        jsonResponse(['error' => 'Firma webhook non valida'], 400);
    }

    // Only handle checkout.session.completed
    if ($event['type'] !== 'checkout.session.completed') {
        echo json_encode(['ok' => true, 'message' => 'Evento ignorato']);
        exit;
    }

    $session = $event['data']['object'];
    $email = $session['customer_details']['email'] ?? '';
    $name = $session['customer_details']['name'] ?? '';
    $sessionId = $session['id'] ?? '';
    $newsletterConsent = ($session['metadata']['newsletterConsent'] ?? '') === 'true';

    if (!$email) {
        jsonResponse(['error' => 'Nessuna email nella session'], 400);
    }

    // ── Get invoice/receipt URL ──
    $receiptUrl = null;
    $invoiceId = $session['invoice'] ?? '';
    if ($invoiceId && $stripeSecretKey) {
        $ch = curl_init("https://api.stripe.com/v1/invoices/{$invoiceId}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $stripeSecretKey,
        ]);
        $invResponse = curl_exec($ch);
        curl_close($ch);
        $invData = json_decode($invResponse, true);
        $receiptUrl = $invData['hosted_invoice_url'] ?? null;
    }

    // ── Generate UUID token ──
    $token = generateUUIDv4();

    // ── Save to Gist KV store ──
    $store = gistRead();
    $store["token:{$token}"] = [
        'email' => strtolower($email),
        'name' => $name,
        'createdAt' => date('c'),
        'stripeSessionId' => $sessionId,
        'stripeReceiptUrl' => $receiptUrl,
        'newsletterConsent' => $newsletterConsent,
    ];
    $store['email:' . strtolower($email)] = $token;
    gistWrite($store);

    // ── Send email via Resend ──
    $accessUrl = "{$siteUrl}/prompt-pack/accesso?token={$token}";

    if ($resendApiKey) {
        sendAccessEmail($resendApiKey, $email, $name, $accessUrl, $sessionId, $receiptUrl);
    }

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

// ── Helper functions ──

function generateUUIDv4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function verifyStripeWebhook(string $payload, string $sigHeader, string $secret): ?array {
    // Parse signature header
    $parts = [];
    foreach (explode(',', $sigHeader) as $item) {
        $kv = explode('=', trim($item), 2);
        if (count($kv) === 2) {
            $parts[$kv[0]] = $kv[1];
        }
    }

    $timestamp = $parts['t'] ?? '';
    $signature = $parts['v1'] ?? '';

    if (!$timestamp || !$signature) return null;

    // Verify tolerance (5 min)
    if (abs(time() - (int)$timestamp) > 300) return null;

    // Compute expected signature
    $signedPayload = "{$timestamp}.{$payload}";
    $expected = hash_hmac('sha256', $signedPayload, $secret);

    if (!hash_equals($expected, $signature)) return null;

    return json_decode($payload, true);
}

function sendAccessEmail(string $apiKey, string $email, string $name, string $accessUrl, string $sessionId, ?string $receiptUrl): void {
    $firstName = explode(' ', $name)[0] ?: 'ciao';

    $receiptHtml = $receiptUrl ? "<tr>
            <td style=\"padding-bottom:24px;\">
              <a href=\"{$receiptUrl}\"
                 style=\"font-size:0.85rem;color:rgba(197,138,55,0.7);text-decoration:underline;\">
                Visualizza la ricevuta di acquisto &rarr;
              </a>
            </td>
          </tr>" : '';

    $html = "<!DOCTYPE html>
<html lang=\"it\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>Il tuo Prompt Pack</title>
</head>
<body style=\"margin:0;padding:0;background:#0C0B09;font-family:Georgia,serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0B09;\">
    <tr>
      <td align=\"center\" style=\"padding:40px 16px;\">
        <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;\">
          <tr>
            <td style=\"padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);\">
              <span style=\"font-family:Georgia,serif;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;color:#C58A37;\">
                Marco Munich
              </span>
            </td>
          </tr>
          <tr>
            <td style=\"padding:32px 0 16px;\">
              <h1 style=\"margin:0;font-family:Georgia,serif;font-size:1.9rem;font-weight:700;color:#fff;line-height:1.2;\">
                Il tuo Prompt Pack<br>
                <span style=\"color:#C58A37;\">&#232; pronto.</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style=\"padding-bottom:24px;\">
              <p style=\"margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);\">
                Ciao {$firstName},
              </p>
              <p style=\"margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);\">
                Grazie per l'acquisto. Clicca il pulsante qui sotto per accedere al pack &mdash;
                il link &#232; personale, salvalo nei preferiti oppure aggiungi questa email ai preferiti per ritrovarlo.
              </p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:8px 0 32px;\">
              <a href=\"{$accessUrl}\"
                 style=\"display:inline-block;background:#C58A37;color:#0A0A0A;padding:16px 32px;
                        border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;
                        font-family:Georgia,serif;letter-spacing:0.02em;\">
                Accedi al Prompt Pack &rarr;
              </a>
            </td>
          </tr>
          {$receiptHtml}
          <tr>
            <td style=\"padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);\">
              <p style=\"margin:0 0 10px;font-size:0.78rem;line-height:1.5;color:rgba(240,235,227,0.35);\">
                Ordine: {$sessionId}<br>
                Se hai problemi con l'accesso, rispondi a questa email.<br>
                <a href=\"https://marcomunich.com\" style=\"color:rgba(197,138,55,0.5);text-decoration:none;\">marcomunich.com</a>
              </p>
              <p style=\"margin:0;font-size:0.72rem;line-height:1.5;color:rgba(240,235,227,0.2);\">
                Prodotto digitale &mdash; consegna immediata. Il diritto di recesso non si applica (art. 59 D.Lgs. 206/2005).<br>
                <a href=\"https://marcomunich.com/termini\" style=\"color:rgba(197,138,55,0.35);text-decoration:underline;\">Termini e Condizioni</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

    $emailPayload = json_encode([
        'from' => 'Marco Munich <noreply@marcomunich.com>',
        'to' => [$email],
        'subject' => 'Il tuo Prompt Pack è pronto',
        'html' => $html,
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $emailPayload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ]);
    curl_exec($ch);
    curl_close($ch);
}
