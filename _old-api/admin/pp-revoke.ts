import type { APIRoute } from 'astro';
import { isAdminRequest } from '@lib/admin-auth';
import { revokeToken } from '@lib/prompt-pack-auth';


export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  let token: string | undefined;
  try {
    const body = await request.json();
    token = body.token;
  } catch {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400 });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token mancante' }), { status: 400 });
  }

  try {
    await revokeToken(token);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
