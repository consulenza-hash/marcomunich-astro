import type { APIRoute } from 'astro';
import { postToX, postToLinkedIn, postToFacebook } from '../../../lib/social-clients';


export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  let body: {
    platform: 'x' | 'linkedin' | 'facebook';
    text: string;
    link: string;
    imageUrl?: string;
  };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { platform, text, link, imageUrl } = body;
  if (!platform || !text || !link) {
    return new Response(JSON.stringify({ error: 'platform, text e link obbligatori' }), { status: 400, headers });
  }

  try {
    let result: { success: boolean; postUrl?: string; error?: string };

    switch (platform) {
      case 'x': {
        const xKey = import.meta.env.X_API_KEY;
        const xSecret = import.meta.env.X_API_SECRET;
        const xToken = import.meta.env.X_ACCESS_TOKEN;
        const xTokenSecret = import.meta.env.X_ACCESS_TOKEN_SECRET;
        if (!xKey || !xSecret || !xToken || !xTokenSecret) {
          return new Response(JSON.stringify({ error: 'Credenziali X non configurate. Aggiungi X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET su Vercel.' }), { status: 500, headers });
        }
        result = await postToX(text, link, imageUrl || null, {
          apiKey: xKey, apiSecret: xSecret, accessToken: xToken, accessTokenSecret: xTokenSecret,
        });
        break;
      }

      case 'linkedin': {
        const liToken = (import.meta.env.LINKEDIN_ACCESS_TOKEN || '').trim();
        const liUrn = (import.meta.env.LINKEDIN_PERSON_URN || '').trim();
        if (!liToken || !liUrn) {
          return new Response(JSON.stringify({ error: 'Credenziali LinkedIn non configurate. Aggiungi LINKEDIN_ACCESS_TOKEN e LINKEDIN_PERSON_URN su Vercel.' }), { status: 500, headers });
        }
        result = await postToLinkedIn(text, link, imageUrl || null, liToken, liUrn);
        break;
      }

      case 'facebook': {
        const fbPageId = import.meta.env.FB_PAGE_ID;
        const fbToken = import.meta.env.FB_PAGE_ACCESS_TOKEN;
        if (!fbPageId || !fbToken) {
          return new Response(JSON.stringify({ error: 'Credenziali Facebook non configurate. Aggiungi FB_PAGE_ID e FB_PAGE_ACCESS_TOKEN su Vercel.' }), { status: 500, headers });
        }
        result = await postToFacebook(text, link, imageUrl || null, fbPageId, fbToken);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Piattaforma "${platform}" non supportata` }), { status: 400, headers });
    }

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ success: true, postUrl: result.postUrl }), { headers });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Errore pubblicazione: ${err.message}` }),
      { status: 500, headers }
    );
  }
};
