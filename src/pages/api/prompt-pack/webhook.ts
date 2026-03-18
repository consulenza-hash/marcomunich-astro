/**
 * /api/prompt-pack/webhook
 * Riceve gli eventi Stripe (checkout.session.completed).
 * Crea il token di accesso nel KV store e invia l'email con il link.
 *
 * Da configurare su Stripe Dashboard:
 *   Webhook endpoint: https://marcomunich.com/api/prompt-pack/webhook
 *   Evento: checkout.session.completed
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createAccessToken, hasProcessedSession } from '@lib/prompt-pack-auth';
import { randomUUID } from 'crypto';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const siteUrl = import.meta.env.SITE_URL || 'https://marcomunich.com';

  // Leggi il body raw (necessario per verificare la firma Stripe)
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('[webhook] Firma non valida:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Gestisci solo checkout completati
  if (event.type !== 'checkout.session.completed') {
    return new Response('OK (evento ignorato)', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Recupera email e nome dal session
  const email = session.customer_details?.email;
  const name = session.customer_details?.name || '';

  if (!email) {
    console.error('[webhook] Nessuna email nella session:', session.id);
    return new Response('Missing email', { status: 400 });
  }

  // Recupera URL ricevuta (disponibile se invoice_creation enabled)
  let receiptUrl: string | null = null;
  if (session.invoice && typeof session.invoice === 'string') {
    try {
      const invoice = await stripe.invoices.retrieve(session.invoice);
      receiptUrl = invoice.hosted_invoice_url || null;
    } catch {
      // Non bloccante
    }
  }

  // Idempotency: se il webhook è già stato processato per questa sessione, non ricreare il token
  if (await hasProcessedSession(session.id)) {
    console.log(`[webhook] Sessione già processata (retry Stripe): ${session.id}`);
    return new Response('OK (già processato)', { status: 200 });
  }

  // Genera token univoco
  const token = randomUUID();

  // Salva nel KV store
  await createAccessToken(token, {
    email: email.toLowerCase(),
    name,
    createdAt: new Date().toISOString(),
    stripeSessionId: session.id,
    stripeReceiptUrl: receiptUrl,
  });

  // URL di accesso con token
  const accessUrl = `${siteUrl}/prompt-pack/accesso?token=${token}`;

  // Invia email
  const { error: emailError } = await resend.emails.send({
    from: 'Marco Munich <noreply@marcomunich.com>',
    to: email,
    subject: 'Il tuo Prompt Pack è pronto',
    html: buildEmailHtml(name, accessUrl, session.id, receiptUrl),
  });

  if (emailError) {
    console.error('[webhook] Errore invio email:', emailError);
    // Non ritornare errore — il token è salvato, si può re-inviare manualmente
  }

  console.log(`[webhook] Accesso creato per ${email}, token: ${token.slice(0, 8)}…`);
  return new Response('OK', { status: 200 });
};

function buildEmailHtml(
  name: string,
  accessUrl: string,
  sessionId: string,
  receiptUrl: string | null
): string {
  const firstName = name.split(' ')[0] || 'ciao';

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Il tuo Prompt Pack</title>
</head>
<body style="margin:0;padding:0;background:#0C0B09;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0B09;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);">
              <span style="font-family:Georgia,serif;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;color:#C58A37;">
                Marco Munich
              </span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:32px 0 16px;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:1.9rem;font-weight:700;color:#fff;line-height:1.2;">
                Il tuo Prompt Pack<br>
                <span style="color:#C58A37;">è pronto.</span>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);">
                Ciao ${firstName},
              </p>
              <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;color:rgba(240,235,227,0.75);">
                Grazie per l'acquisto. Clicca il pulsante qui sotto per accedere al pack —
                il link è personale, salvalo nei preferiti oppure aggiungi questa email ai preferiti per ritrovarlo.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 0 32px;">
              <a href="${accessUrl}"
                 style="display:inline-block;background:#C58A37;color:#0A0A0A;padding:16px 32px;
                        border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;
                        font-family:Georgia,serif;letter-spacing:0.02em;">
                Accedi al Prompt Pack →
              </a>
            </td>
          </tr>

          <!-- Receipt -->
          ${receiptUrl ? `
          <tr>
            <td style="padding-bottom:24px;">
              <a href="${receiptUrl}"
                 style="font-size:0.85rem;color:rgba(197,138,55,0.7);text-decoration:underline;">
                Visualizza la ricevuta di acquisto →
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:0.78rem;line-height:1.5;color:rgba(240,235,227,0.35);">
                Ordine: ${sessionId}<br>
                Se hai problemi con l'accesso, rispondi a questa email.<br>
                <a href="https://marcomunich.com" style="color:rgba(197,138,55,0.5);text-decoration:none;">marcomunich.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
