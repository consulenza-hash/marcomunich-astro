<?php
/**
 * /api/clienti.php
 * GET: returns clienti.json from GitHub
 * POST: create, update, add_note, delete actions
 */
require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/_github.php';

checkAuth();

define('CLIENTI_PATH', 'src/data/clienti.json');

function fetchClienti(): array {
    $file = ghGetFile(CLIENTI_PATH);
    if (!$file) {
        return ['clienti' => [], 'sha' => ''];
    }
    $clienti = json_decode($file['content'], true);
    if (!is_array($clienti)) $clienti = [];
    return ['clienti' => $clienti, 'sha' => $file['sha']];
}

function saveClienti(array $clienti, string $sha, string $message): void {
    $content = json_encode($clienti, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $res = ghPutFile(CLIENTI_PATH, $content, $message, $sha ?: null);
    if ($res['code'] !== 200 && $res['code'] !== 201) {
        throw new Exception('GitHub PUT fallito: ' . $res['code'] . ' — ' . json_encode($res['body']));
    }
}

function generateUUID(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

try {
    // ── GET: list all clients ──
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $data = fetchClienti();
        jsonResponse($data['clienti']);
    }

    // ── POST: create, update, add_note, delete ──
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = readJsonBody();
        $action = $body['action'] ?? '';

        if ($action === 'create') {
            $cliente = $body['cliente'] ?? null;
            if (!$cliente) {
                jsonResponse(['error' => 'Campo cliente mancante'], 400);
            }
            $data = fetchClienti();
            $cliente['id'] = generateUUID();
            $data['clienti'][] = $cliente;
            saveClienti($data['clienti'], $data['sha'], 'Nuovo cliente: ' . $cliente['id']);
            jsonResponse($cliente, 201);
        }

        if ($action === 'update') {
            $cliente = $body['cliente'] ?? null;
            if (!$cliente || empty($cliente['id'])) {
                jsonResponse(['error' => 'Campo cliente con id mancante'], 400);
            }
            $data = fetchClienti();
            $found = false;
            foreach ($data['clienti'] as &$c) {
                if ($c['id'] === $cliente['id']) {
                    $c = array_merge($c, $cliente);
                    $found = true;
                    break;
                }
            }
            unset($c);
            if (!$found) {
                jsonResponse(['error' => 'Cliente non trovato'], 404);
            }
            saveClienti($data['clienti'], $data['sha'], 'Aggiornato cliente: ' . $cliente['id']);
            $updated = array_values(array_filter($data['clienti'], fn($c) => $c['id'] === $cliente['id']));
            jsonResponse($updated[0] ?? $cliente);
        }

        if ($action === 'add_note') {
            $id = $body['id'] ?? '';
            $nota = $body['nota'] ?? ($body['azione'] ?? '');
            if (!$id || !$nota) {
                jsonResponse(['error' => 'Campi id e nota richiesti'], 400);
            }
            $data = fetchClienti();
            $found = false;
            foreach ($data['clienti'] as &$c) {
                if ($c['id'] === $id) {
                    if (!isset($c['storico']) || !is_array($c['storico'])) {
                        $c['storico'] = [];
                    }
                    $c['storico'][] = [
                        'data' => date('Y-m-d'),
                        'azione' => $nota,
                    ];
                    $found = true;
                    $updated = $c;
                    break;
                }
            }
            unset($c);
            if (!$found) {
                jsonResponse(['error' => 'Cliente non trovato'], 404);
            }
            saveClienti($data['clienti'], $data['sha'], 'Nota aggiunta a cliente: ' . $id);
            jsonResponse($updated);
        }

        if ($action === 'delete') {
            $id = $body['id'] ?? '';
            if (!$id) {
                jsonResponse(['error' => 'Campo id richiesto'], 400);
            }
            $data = fetchClienti();
            $before = count($data['clienti']);
            $data['clienti'] = array_values(array_filter($data['clienti'], fn($c) => $c['id'] !== $id));
            if (count($data['clienti']) === $before) {
                jsonResponse(['error' => 'Cliente non trovato'], 404);
            }
            saveClienti($data['clienti'], $data['sha'], 'Rimosso cliente: ' . $id);
            jsonResponse(['success' => true]);
        }

        jsonResponse(['error' => "Azione non valida: {$action}"], 400);
    }

    jsonResponse(['error' => 'Metodo non consentito'], 405);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
