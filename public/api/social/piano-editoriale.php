<?php
/**
 * POST /api/social/piano-editoriale.php
 * Receives article text, calls Claude to generate a 5-day editorial plan.
 * Returns JSON with day-by-day content.
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

    $sistema = "Sei un social media strategist italiano esperto di personal branding per coach, counselor e operatori olistici. Scrivi in italiano naturale, senza strutture \"non X ma Y\", senza triplette, senza emdash. Rispondi SEMPRE e SOLO con JSON valido.";

    $prompt = "Crea un piano editoriale di 5 giorni per i social media basato su questo articolo. Ogni giorno deve avere un angolo diverso per massimizzare la copertura del tema.

ARTICOLO:
{$testo}

Rispondi SOLO con questo JSON:
{
  \"piano\": [
    {
      \"giorno\": 1,
      \"tema\": \"Titolo del tema del giorno\",
      \"piattaforma\": \"instagram|linkedin|facebook|x\",
      \"formato\": \"carosello|post|storia|reel|articolo\",
      \"testo\": \"Testo completo del post\",
      \"note\": \"Note per il creatore (es. tipo di immagine, orario consigliato)\"
    }
  ]
}";

    $requestPayload = json_encode([
        'model' => 'claude-opus-4-5',
        'max_tokens' => 6000,
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

    jsonResponse(['success' => true, ...$result]);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
