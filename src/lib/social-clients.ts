/**
 * Wrapper per le API social: X (Twitter), LinkedIn, Facebook.
 * Ogni funzione prende testo + link + imageUrl opzionale e pubblica.
 */
import OAuth from 'oauth-1.0a';
import { createHmac } from 'crypto';

// ─── X (Twitter) ──────────────────────────────────────────────────────────────

interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export async function postToX(
  text: string,
  link: string,
  imageUrl: string | null,
  creds: XCredentials
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const oauth = new OAuth({
    consumer: { key: creds.apiKey, secret: creds.apiSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return createHmac('sha1', key).update(base_string).digest('base64');
    },
  });

  const token = { key: creds.accessToken, secret: creds.accessTokenSecret };
  const fullText = `${text}\n\n${link}`;

  let mediaId: string | undefined;

  // Upload immagine se presente
  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl);
      const imgBuffer = await imgRes.arrayBuffer();
      const imgBase64 = Buffer.from(imgBuffer).toString('base64');

      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
      const uploadData = new URLSearchParams({ media_data: imgBase64 });
      const uploadAuth = oauth.authorize({ url: uploadUrl, method: 'POST' }, token);
      const uploadHeaders = oauth.toHeader(uploadAuth) as Record<string, string>;

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { ...uploadHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: uploadData.toString(),
      });

      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json() as { media_id_string: string };
        mediaId = uploadJson.media_id_string;
      }
    } catch {
      // Procedi senza immagine
    }
  }

  // Pubblica tweet
  const tweetUrl = 'https://api.x.com/2/tweets';
  const tweetBody: Record<string, any> = { text: fullText };
  if (mediaId) {
    tweetBody.media = { media_ids: [mediaId] };
  }

  const tweetAuth = oauth.authorize({ url: tweetUrl, method: 'POST' }, token);
  const tweetHeaders = oauth.toHeader(tweetAuth) as Record<string, string>;

  const res = await fetch(tweetUrl, {
    method: 'POST',
    headers: { ...tweetHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(tweetBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: `X API ${res.status}: ${errText.substring(0, 200)}` };
  }

  const data = await res.json() as { data: { id: string } };
  return {
    success: true,
    postUrl: `https://x.com/marcomunich_/status/${data.data.id}`,
  };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

export async function postToLinkedIn(
  text: string,
  link: string,
  _imageUrl: string | null,
  accessToken: string,
  personUrn: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const fullText = `${text}\n\n${link}`;

  const body = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: fullText },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status: 'READY',
          originalUrl: link,
        }],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: `LinkedIn API ${res.status}: ${errText.substring(0, 200)}` };
  }

  const data = await res.json() as { id: string };
  return {
    success: true,
    postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
  };
}

// ─── Facebook Page ────────────────────────────────────────────────────────────

export async function postToFacebook(
  text: string,
  link: string,
  _imageUrl: string | null,
  pageId: string,
  pageAccessToken: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const fullText = `${text}\n\n${link}`;

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: fullText,
      link: link,
      access_token: pageAccessToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: `Facebook API ${res.status}: ${errText.substring(0, 200)}` };
  }

  const data = await res.json() as { id: string };
  const postId = data.id.split('_')[1] || data.id;
  return {
    success: true,
    postUrl: `https://www.facebook.com/${pageId}/posts/${postId}`,
  };
}
