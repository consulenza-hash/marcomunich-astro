<?php
/**
 * POST /api/genera-json.php
 * Calls Anthropic Claude API with tool use (streaming).
 * Streams back input_json_delta partial_json chunks.
 */
require_once __DIR__ . '/_config.php';
// No _github.php needed here

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

$apiKey = getenv('ANTHROPIC_API_KEY');
if (!$apiKey) {
    jsonResponse(['error' => 'ANTHROPIC_API_KEY mancante'], 500);
}

$body = readJsonBody();
$testo = $body['testo'] ?? '';
$modo = $body['modo'] ?? '';
$isNew = $body['isNew'] ?? true;

if (!$testo || !$modo) {
    jsonResponse(['error' => 'Parametri mancanti'], 400);
}

// ── System prompt ──
$sistema = "Sei un ghostwriter italiano esperto. Scrivi sempre in italiano naturale seguendo queste regole assolute:

Genera testo in italiano naturale, senza strutture \"non X ma Y\" e senza \"non è… è…\". Qualsiasi frase che definisca qualcosa negando prima il suo opposto va eliminata e riscritta affermando direttamente ciò che si vuole dire.

Evita triplette (tre aggettivi, tre verbi, tre stati). Elimina meta-frasi che commentano il testo (\"è importante\", \"è chiaro\", \"è giusto partire da…\"). Preferisci scene brevi, azioni e conseguenze verificabili. Chiudi con un fatto o una decisione pratica.

Il ritmo del testo deve essere discorsivo e fluido: ogni pensiero si sviluppa per almeno tre o quattro righe prima di chiudersi. Evita il ritmo telegrafico dove ogni frase breve finisce con un punto.

Risultato: testo specifico, asciutto, credibile, con pochi aggettivi, zero enfasi artificiale, ritmo disteso e niente emdash.";

// ── Tool definition ──
$toolDef = [
    'name' => 'salva_articolo',
    'description' => "Salva il contenuto generato dell'articolo con tutti i campi richiesti.",
    'input_schema' => [
        'type' => 'object',
        'properties' => [
            'titolo' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => "Titolo dell'articolo. Null se si generano solo metadati."],
            'slug' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => 'Slug URL-friendly (lettere minuscole, trattini, no spazi). Null se solo metadati.'],
            'descrizione' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => 'Descrizione breve, max 160 caratteri.'],
            'corpo' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => "Corpo articolo in markdown con ### sottotitoli. Null se si generano solo metadati."],
            'seo_title' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => 'Titolo SEO ottimizzato, max 60 caratteri. Null se solo articolo.'],
            'seo_description' => ['anyOf' => [['type' => 'string'], ['type' => 'null']], 'description' => 'Meta description SEO, max 155 caratteri. Null se solo articolo.'],
            'schema_faq' => [
                'type' => 'array',
                'description' => 'Domande e risposte per lo schema FAQ (AEO/GEO)',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'domanda' => ['type' => 'string'],
                        'risposta' => ['type' => 'string'],
                    ],
                    'required' => ['domanda', 'risposta'],
                ],
            ],
        ],
        'required' => ['titolo', 'slug', 'descrizione', 'corpo', 'seo_title', 'seo_description', 'schema_faq'],
    ],
];

// ── Build prompt based on modo ──
function buildPrompt(string $modo, string $input, bool $isNew): string {
    if ($modo === 'solo-articolo') {
        if ($isNew) {
            return "Genera un articolo completo in italiano su questo tema. Almeno 600 parole, usa ### per i sottotitoli. Compila tutti i campi del tool.\n\nTEMA: {$input}";
        }
        return "Riscrivi completamente questo articolo sullo stesso tema ma con testo nuovo. Almeno 600 parole, usa ### per i sottotitoli. Compila tutti i campi del tool.\n\nARTICOLO ORIGINALE:\n{$input}";
    }

    if ($modo === 'solo-metadati') {
        return "Analizza questo articolo e genera SOLO i metadati SEO/AEO/GEO. Non riscrivere il testo: nel campo \"corpo\" metti null. Genera almeno 3 domande/risposte per schema_faq.\n\nARTICOLO:\n{$input}";
    }

    if ($modo === 'tutto-completo') {
        if ($isNew) {
            return "Genera un articolo completo con tutti i metadati SEO/AEO/GEO. Almeno 800 parole, usa ### per i sottotitoli. Genera almeno 3 domande/risposte per schema_faq. Compila tutti i campi del tool.\n\nTEMA/PROMPT: {$input}";
        }
        return "Riscrivi completamente questo articolo e genera tutti i metadati SEO/AEO/GEO. Almeno 800 parole, usa ### per i sottotitoli. Genera almeno 3 domande/risposte per schema_faq. Compila tutti i campi del tool.\n\nARTICOLO ORIGINALE:\n{$input}";
    }

    throw new Exception("Modalità non valida: {$modo}");
}

try {
    $prompt = buildPrompt($modo, $testo, $isNew);
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 400);
}

// ── Anthropic API request with streaming ──
$requestPayload = json_encode([
    'model' => 'claude-opus-4-5',
    'max_tokens' => 8000,
    'stream' => true,
    'system' => $sistema,
    'messages' => [
        ['role' => 'user', 'content' => $prompt],
    ],
    'tools' => [$toolDef],
    'tool_choice' => ['type' => 'tool', 'name' => 'salva_articolo'],
]);

// Set streaming headers
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, no-store');
header('X-Accel-Buffering: no');
header('Transfer-Encoding: chunked');

// Disable output buffering
while (ob_get_level()) ob_end_clean();

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);

// Process streaming response line by line
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) {
    // Each SSE line starts with "data: "
    $lines = explode("\n", $data);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, 'data: ') !== 0) continue;
        $json = substr($line, 6);
        if ($json === '[DONE]') continue;

        $event = json_decode($json, true);
        if (!$event) continue;

        // Extract input_json_delta partial_json
        if (
            ($event['type'] ?? '') === 'content_block_delta' &&
            ($event['delta']['type'] ?? '') === 'input_json_delta'
        ) {
            $partialJson = $event['delta']['partial_json'] ?? '';
            if ($partialJson !== '') {
                echo $partialJson;
                flush();
            }
        }
    }
    return strlen($data);
});

$result = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(['__error' => curl_error($ch)]);
}

curl_close($ch);
