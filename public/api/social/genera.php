<?php
/**
 * POST /api/social/genera.php
 * Receives article text, calls Claude to generate social posts for X, LinkedIn, Facebook, Instagram.
 * Returns JSON with platform-specific texts.
 */
require_once __DIR__ . '/../_config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$apiKey = getenv('ANTHROPIC_API_KEY');
if (!$apiKey) {
    jsonResponse(['error' => 'ANTHROPIC_API_KEY mancante'], 500);
}

try {
    $body = readJsonBody();
    $testo = $body['testo'] ?? '';

    if (!$testo) {
        jsonResponse(['error' => 'Testo mancante'], 400);
    }

    $sistema = "Sei un social media manager italiano esperto di personal branding. Scrivi in italiano naturale, senza strutture \"non X ma Y\", senza triplette, senza emdash. Tono diretto e professionale. Rispondi SEMPRE e SOLO con JSON valido.";

    $prompt = "Genera post per i social media basati su questo articolo. Per ogni piattaforma, rispetta il formato e il tono tipici.

ARTICOLO:
{$testo}

Rispondi SOLO con questo JSON:
{
  \"x\": {\"testo\": \"Post per X/Twitter, max 280 caratteri, con 2-3 hashtag\"},
  \"linkedin\": {\"testo\": \"Post per LinkedIn, 3-5 paragrafi brevi, professionale, con emoji moderate e 3-5 hashtag alla fine\"},
  \"facebook\": {\"testo\": \"Post per Facebook, tono conversazionale, 2-3 paragrafi, invita alla discussione\"},
  \"instagram\": {\"testo\": \"Caption Instagram, gancio iniziale forte, corpo con valore, CTA finale, 10-15 hashtag alla fine\"}
}";

    $requestPayload = json_encode([
        'model' => 'claude-opus-4-5',
        'max_tokens' => 4000,
        'system' => $sistema,
        'messages' => [
            ['role' => 'user', 'content' => $prompt],
        ],
    ]);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestPayload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("Anthropic API error: HTTP {$httpCode}");
    }

    $data = json_decode($response, true);
    $rawText = '';
    foreach (($data['content'] ?? []) as $block) {
        if (($block['type'] ?? '') === 'text') {
            $rawText .= $block['text'];
        }
    }

    // Parse JSON from response
    $cleaned = preg_replace('/^```(?:json)?\s*/m', '', $rawText);
    $cleaned = preg_replace('/\s*```\s*$/m', '', $cleaned);
    $cleaned = trim($cleaned);

    $start = strpos($cleaned, '{');
    $end = strrpos($cleaned, '}');
    if ($start === false || $end === false) {
        throw new Exception('Nessun JSON nella risposta AI');
    }

    $result = json_decode(substr($cleaned, $start, $end - $start + 1), true);
    if (!$result) {
        throw new Exception('Impossibile parsare JSON dalla risposta AI');
    }

    jsonResponse(['success' => true, 'posts' => $result]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
