<?php
/**
 * POST /api/prompt-pack/resend-access.php
 * Body: { "email": "..." }
 * Looks up the token for that email and re-sends the access link.
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body = readJsonBody();
$email = strtolower(trim($body['email'] ?? ''));

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Email non valida'], 400);
}

try {
    $store = gistRead();

    $emailKey = 'email:' . $email;
    if (!isset($store[$emailKey])) {
        // Return generic OK to avoid email enumeration
        jsonResponse(['ok' => true]);
    }

    $token = $store[$emailKey];
    $entry = $store['token:' . $token] ?? null;

    if (!$entry) {
        jsonResponse(['ok' => true]);
    }

    $resendApiKey = getenv('RESEND_API_KEY');
    $siteUrl = getenv('SITE_URL') ?: 'https://marcomunich.com';

    if ($resendApiKey) {
        $name = $entry['name'] ?? '';
        $accessUrl = "{$siteUrl}/prompt-pack/accesso?token={$token}";
        $receiptUrl = $entry['stripeReceiptUrl'] ?? null;
        $sessionId = $entry['stripeSessionId'] ?? '';
        sendResendEmail($resendApiKey, $email, $name, $accessUrl, $sessionId, $receiptUrl);
    }

    jsonResponse(['ok' => true]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function sendResendEmail(string $apiKey, string $email, string $name, string $accessUrl, string $sessionId, ?string $receiptUrl): void {
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
                Il tuo link di accesso<br>
                <span style=\"color:#C58A37;\">al Prompt Pack.</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style=\"padding-bottom:24px;\">
              <p style=\"margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);\">
                Ciao {$firstName},
              </p>
              <p style=\"margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);\">
                Ecco il tuo link personale per accedere al Prompt Pack.
                Salvalo nei preferiti oppure aggiungi questa email ai tuoi contatti per ritrovarlo.
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

    $payload = json_encode([
        'from'    => 'Marco Munich <noreply@marcomunich.com>',
        'to'      => [$email],
        'subject' => 'Il tuo link di accesso al Prompt Pack',
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
