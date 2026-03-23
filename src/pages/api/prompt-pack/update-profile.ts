/**
 * /api/prompt-pack/update-profile
 * Aggiorna nome ed email dell'utente nel Gist store.
 * Autenticazione via cookie pp_access.
 */

import type { APIRoute } from 'astro';
import { getTokenFromCookie, validateToken } from '@lib/prompt-pack-auth';


export const POST: APIRoute = async ({ request }) => {
  const token = getTokenFromCookie(request);
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Non autenticato' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await validateToken(token);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Token non valido' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json().catch(() => ({}));
  const newName  = (body.name  || '').trim().slice(0, 100);
  const newEmail = (body.email || '').trim().toLowerCase().slice(0, 200);

  if (newEmail && !newEmail.includes('@')) {
    return new Response(JSON.stringify({ ok: false, error: 'Email non valida' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Leggi store
  const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
  const GIST_ID = (process.env.PP_GIST_ID || '').trim();

  const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' },
  });
  const gist = await gistRes.json();
  const store: Record<string, any> = JSON.parse(gist.files?.['tokens.json']?.content || '{}');

  // Aggiorna dati utente
  const oldEmail = user.email.toLowerCase();
  const updatedUser = {
    ...store[`token:${token}`],
    name: newName || user.name,
    email: newEmail || user.email,
  };
  store[`token:${token}`] = updatedUser;

  // Aggiorna indice email se cambiata
  if (newEmail && newEmail !== oldEmail) {
    delete store[`email:${oldEmail}`];
    store[`email:${newEmail}`] = token;
  }

  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ files: { 'tokens.json': { content: JSON.stringify(store, null, 2) } } }),
  });

  return new Response(JSON.stringify({ ok: true, name: updatedUser.name, email: updatedUser.email }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
