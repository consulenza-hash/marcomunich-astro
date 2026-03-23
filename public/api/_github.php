<?php
/**
 * GitHub API helper functions.
 * Requires _config.php to be loaded first (for env vars).
 */

define('GH_REPO', 'consulenza-hash/marcomunich-astro');
define('GH_BRANCH', 'main');
define('GH_API_BASE', 'https://api.github.com/repos/' . GH_REPO);

/**
 * Make a GitHub API request.
 */
function githubRequest(string $url, string $method = 'GET', $data = null): array {
    $token = getenv('GITHUB_TOKEN');
    if (!$token) {
        jsonResponse(['error' => 'GITHUB_TOKEN mancante'], 500);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: token ' . $token,
        'Accept: application/vnd.github.v3+json',
        'Content-Type: application/json',
        'User-Agent: marcomunich-api',
    ]);

    if ($method === 'PUT' || $method === 'POST' || $method === 'DELETE' || $method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        jsonResponse(['error' => 'cURL error: ' . $error], 500);
    }

    curl_close($ch);
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

/**
 * Get file content from GitHub (decoded from base64).
 * Returns ['content' => string, 'sha' => string] or null if not found.
 */
function ghGetFile(string $filePath): ?array {
    $url = GH_API_BASE . '/contents/' . $filePath . '?ref=' . GH_BRANCH;
    $res = githubRequest($url);

    if ($res['code'] === 404) return null;
    if ($res['code'] !== 200) {
        jsonResponse(['error' => 'GitHub GET ' . $res['code']], 500);
    }

    $content = base64_decode(str_replace("\n", '', $res['body']['content'] ?? ''));
    return [
        'content' => $content,
        'sha' => $res['body']['sha'] ?? '',
    ];
}

/**
 * Put (create/update) a file on GitHub.
 */
function ghPutFile(string $filePath, string $content, string $commitMessage, ?string $sha = null): array {
    $url = GH_API_BASE . '/contents/' . $filePath;
    $payload = [
        'message' => $commitMessage,
        'content' => base64_encode($content),
        'branch' => GH_BRANCH,
    ];
    if ($sha) $payload['sha'] = $sha;

    return githubRequest($url, 'PUT', $payload);
}

/**
 * Delete a file on GitHub.
 */
function ghDeleteFile(string $filePath, string $sha, string $commitMessage): array {
    $url = GH_API_BASE . '/contents/' . $filePath;
    $payload = [
        'message' => $commitMessage,
        'sha' => $sha,
        'branch' => GH_BRANCH,
    ];
    return githubRequest($url, 'DELETE', $payload);
}

/**
 * List directory contents from GitHub.
 */
function ghListDir(string $dirPath): array {
    $url = GH_API_BASE . '/contents/' . $dirPath . '?ref=' . GH_BRANCH;
    $res = githubRequest($url);

    if ($res['code'] === 404) return [];
    if ($res['code'] !== 200) {
        jsonResponse(['error' => 'GitHub LIST ' . $res['code']], 500);
    }

    return $res['body'] ?? [];
}

/**
 * Gist KV store for prompt-pack tokens.
 */
function gistRead(): array {
    $gistId = getenv('PP_GIST_ID');
    $token = getenv('GITHUB_TOKEN');
    if (!$gistId || !$token) return [];

    $url = "https://api.github.com/gists/{$gistId}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'X-GitHub-Api-Version: 2022-11-28',
        'User-Agent: marcomunich-api',
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $gist = json_decode($response, true);
    $raw = $gist['files']['tokens.json']['content'] ?? '{}';
    return json_decode($raw, true) ?: [];
}

function gistWrite(array $data): void {
    $gistId = getenv('PP_GIST_ID');
    $token = getenv('GITHUB_TOKEN');
    if (!$gistId || !$token) return;

    $url = "https://api.github.com/gists/{$gistId}";
    $payload = json_encode([
        'files' => [
            'tokens.json' => [
                'content' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            ],
        ],
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'X-GitHub-Api-Version: 2022-11-28',
        'User-Agent: marcomunich-api',
    ]);
    curl_exec($ch);
    curl_close($ch);
}
