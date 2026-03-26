<?php
/**
 * POST /api/admin/pp-grant.php
 * Body: { "email": "...", "name": "..." }
 * Admin only. Manually grants Prompt Pack access: creates token in Gist and sends email.
 */
require_once __DIR__ . '/../_config.php';
require_once __DIR__ . '/../_github.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$body = readJsonBody();
$email = strtolower(trim($body['email'] ?? ''));
$name  = trim($body['name'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Email non valida'], 400);
}

try {
    $resendApiKey = getenv('RESEND_API_KEY');
    $siteUrl      = getenv('SITE_URL') ?: 'https://marcomunich.com';

    // Generate token
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    $token = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

    // Save to Gist
    $store = gistRead();
    $store["token:{$token}"] = [
        'email'             => $email,
        'name'              => $name,
        'createdAt'         => date('c'),
        'stripeSessionId'   => 'manual-grant',
        'stripeReceiptUrl'  => null,
        'newsletterConsent' => false,
    ];
    $store['email:' . $email] = $token;
    gistWrite($store);

    // Send access email
    $accessUrl = "{$siteUrl}/prompt-pack/accesso?token={$token}";

    if ($resendApiKey) {
        $firstName = explode(' ', $name)[0] ?: 'ciao';
        $html = "<!DOCTYPE html><html lang='it'><head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;background:#0C0B09;font-family:Georgia,serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#0C0B09;'>
<tr><td align='center' style='padding:40px 16px;'>
<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;'>
<tr><td style='padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);'>
<span style='font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;color:#C58A37;'>Marco Munich</span>
</td></tr>
<tr><td style='padding:32px 0 16px;'>
<h1 style='margin:0;font-size:1.9rem;font-weight:700;color:#fff;line-height:1.2;'>
Il tuo Prompt Pack<br><span style='color:#C58A37;'>è pronto.</span>
</h1></td></tr>
<tr><td style='padding-bottom:24px;'>
<p style='margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);'>Ciao {$firstName},</p>
<p style='margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);'>
Clicca il pulsante per accedere al pack — il link è personale, salvalo nei preferiti.
</p></td></tr>
<tr><td style='padding:8px 0 32px;'>
<a href='{$accessUrl}' style='display:inline-block;background:#C58A37;color:#0A0A0A;padding:16px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;'>
Accedi al Prompt Pack &rarr;
</a></td></tr>
<tr><td style='padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);'>
<p style='margin:0;font-size:0.78rem;color:rgba(240,235,227,0.35);'>
Se hai problemi, rispondi a questa email.<br>
<a href='https://marcomunich.com' style='color:rgba(197,138,55,0.5);text-decoration:none;'>marcomunich.com</a>
</p></td></tr>
</table></td></tr></table></body></html>";

        $payload = json_encode([
            'from'    => 'Marco Munich <noreply@marcomunich.com>',
            'to'      => [$email],
            'subject' => 'Il tuo Prompt Pack è pronto',
            'html'    => $html,
        ]);
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $resendApiKey,
        ]);
        $resendResult = curl_exec($ch);
        $resendCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }

    jsonResponse([
        'ok'        => true,
        'token'     => $token,
        'accessUrl' => $accessUrl,
        'emailSent' => isset($resendCode) && $resendCode < 300,
    ]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
