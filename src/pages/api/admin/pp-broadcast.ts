import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { isAdminRequest } from '@lib/admin-auth';
import { getAllPurchasers } from '@lib/prompt-pack-auth';


export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  let subject: string, body: string;
  try {
    const data = await request.json();
    subject = (data.subject || '').trim();
    body = (data.body || '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400 });
  }

  if (!subject || !body) {
    return new Response(JSON.stringify({ error: 'Subject e body richiesti' }), { status: 400 });
  }

  const resend = new Resend((process.env.RESEND_API_KEY || '').trim());
  const siteUrl = (process.env.SITE_URL || 'https://marcomunich.com').trim();

  let purchasers: Awaited<ReturnType<typeof getAllPurchasers>>;
  try {
    purchasers = await getAllPurchasers();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Impossibile leggere gli acquirenti: ' + e.message }), { status: 500 });
  }

  const htmlBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  let sent = 0;
  let failed = 0;

  for (const p of purchasers) {
    try {
      const { error } = await resend.emails.send({
        from: 'Marco Munich <noreply@marcomunich.com>',
        to: p.email,
        subject,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:32px auto;background:#fff;border-radius:12px;padding:36px;color:#1a1a1a;font-size:15px;line-height:1.65">
    <p style="margin:0 0 24px">${htmlBody}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
    <p style="font-size:12px;color:#94a3b8;margin:0">
      Hai acquistato il Prompt Pack su marcomunich.com.<br>
      <a href="${siteUrl}/prompt-pack/accesso" style="color:#f59e0b;text-decoration:none">Accedi al tuo pack →</a>
    </p>
  </div>
</body>
</html>`,
      });
      if (error) { failed++; } else { sent++; }
    } catch {
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed, total: purchasers.length }), { status: 200 });
};
