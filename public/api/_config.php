<?php
/**
 * Shared configuration — loadEnv() + CORS + auth check
 * Include this in every API file.
 */

function loadEnv() {
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) continue;
            putenv(trim($parts[0]) . '=' . trim($parts[1]));
        }
    }
}

loadEnv();

// CORS headers for all responses
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');

/**
 * Check stats_auth cookie against STATS_PASSWORD env var.
 * Call this at the top of protected endpoints.
 */
function checkAuth(): void {
    $password = getenv('STATS_PASSWORD') ?: 'stats2024';
    $cookie = $_COOKIE['stats_auth'] ?? '';
    if (urldecode($cookie) !== $password) {
        http_response_code(401);
        echo json_encode(['error' => 'Non autorizzato']);
        exit;
    }
}

/**
 * Read raw JSON body and decode it.
 */
function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON non valido']);
        exit;
    }
    return $data ?? [];
}

/**
 * Send a JSON response and exit.
 */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
