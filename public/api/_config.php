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
            $val = trim($parts[1]);
            $val = trim($val, '"\'');
            putenv(trim($parts[0]) . '=' . $val);
        }
    }
}

loadEnv();

// CORS headers — allow only marcomunich.com (and localhost for dev)
$allowedOrigins = ['https://marcomunich.com', 'https://www.marcomunich.com', 'http://localhost:4321'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://marcomunich.com');
}
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
function getAdminPassword(): string {
    // Check .admin-pwd first — survives deploys (deploy never touches this file)
    $pwdFile = __DIR__ . '/../../.admin-pwd';
    if (file_exists($pwdFile)) {
        $pwd = trim(file_get_contents($pwdFile));
        if ($pwd !== '') return $pwd;
    }
    $env = getenv('STATS_PASSWORD');
    if ($env !== false && $env !== '') return $env;

    // SEC-016 FIX: fail closed — never return a hardcoded default
    http_response_code(503);
    echo json_encode(['error' => 'Admin password non configurata sul server']);
    exit;
}

function checkAuth(): void {
    $password = getAdminPassword();
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
