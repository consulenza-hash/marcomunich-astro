/**
 * /api/prompt-pack/resend-access
 * Riceve un'email, cerca il token nel Gist store e re-invia il link di accesso.
 * Usato dalla pagina di recupero accesso su /prompt-pack/accesso.
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getTokenByEmail } from '@lib/prompt-pack-auth';


export const POST: APIRoute = async ({ request }) => {
  const resend = new Resend((process.env.RESEND_API_KEY || '').trim());
  const siteUrl = (process.env.SITE_URL || 'https://marcomunich.com').trim();

  // Leggi email dal body (form o JSON)
  let email = '';
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    email = (body.email || '').trim().toLowerCase();
  } else {
    const form = await request.formData().catch(() => new FormData());
    email = ((form.get('email') as string) || '').trim().toLowerCase();
  }

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ ok: false, error: 'Email non valida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cerca il token — risposta generica anche se non trovato (non rivela se l'email è registrata)
  const token = await getTokenByEmail(email);

  if (token) {
    const accessUrl = `${siteUrl}/prompt-pack/accesso?token=${token}`;
    await resend.emails.send({
      from: 'Marco Munich <noreply@marcomunich.com>',
      to: email,
      subject: 'Il tuo link di accesso al Prompt Pack',
      html: `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0C0B09;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0B09;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-family:Georgia,serif;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;color:#C58A37;">Marco Munich</span>
        </td></tr>
        <tr><td style="padding:32px 0 16px;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#fff;">
            Ecco il tuo link di accesso
          </h1>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);">
            Hai richiesto di ricevere di nuovo il link per accedere al tuo Prompt Pack.
          </p>
          <p style="margin:0;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);">
            Clicca qui sotto per accedere — salva questa email per non doverla richiedere di nuovo.
          </p>
        </td></tr>
        <tr><td style="padding:8px 0 32px;">
          <a href="${accessUrl}"
             style="display:inline-block;background:#C58A37;color:#0A0A0A;padding:16px 32px;
                    border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;
                    font-family:Georgia,serif;letter-spacing:0.02em;">
            Accedi al Prompt Pack →
          </a>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0;font-size:0.78rem;line-height:1.5;color:rgba(240,235,227,0.35);">
            Se non hai richiesto questo link, ignora questa email.<br>
            <a href="https://marcomunich.com" style="color:rgba(197,138,55,0.5);text-decoration:none;">marcomunich.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  }

  // Risposta generica — non rivela se l'email è nel sistema o meno
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
