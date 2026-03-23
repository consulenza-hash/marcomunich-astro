<?php
/**
 * POST /api/social/pubblica.php
 * Publishes a post to Facebook page using Graph API.
 * Requires FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN env vars.
 */
require_once __DIR__ . '/../_config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

try {
    $body = readJsonBody();
    $message = $body['message'] ?? '';
    $platform = $body['platform'] ?? 'facebook';
    $link = $body['link'] ?? '';

    if (!$message) {
        jsonResponse(['error' => 'Messaggio mancante'], 400);
    }

    if ($platform === 'facebook') {
        $pageId = getenv('FB_PAGE_ID');
        $accessToken = getenv('FB_PAGE_ACCESS_TOKEN');

        if (!$pageId || !$accessToken) {
            jsonResponse(['error' => 'FB_PAGE_ID o FB_PAGE_ACCESS_TOKEN mancanti'], 500);
        }

        $url = "https://graph.facebook.com/v19.0/{$pageId}/feed";

        $postData = [
            'message' => $message,
            'access_token' => $accessToken,
        ];
        if ($link) {
            $postData['link'] = $link;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new Exception('cURL error: ' . curl_error($ch));
        }
        curl_close($ch);

        $data = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = $data['error']['message'] ?? 'Unknown Facebook API error';
            throw new Exception("Facebook API error: {$errorMsg}");
        }

        jsonResponse([
            'success' => true,
            'platform' => 'facebook',
            'post_id' => $data['id'] ?? null,
        ]);
    }

    jsonResponse(['error' => "Piattaforma non supportata: {$platform}"], 400);

} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
