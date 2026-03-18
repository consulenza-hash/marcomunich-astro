/**
 * /api/prompt-pack/checkout
 * Crea una Stripe Checkout Session e redirige l'utente alla pagina di pagamento.
 * La landing chiama questo endpoint con il pulsante "Acquista".
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const GET: APIRoute = async ({ redirect, request }) => {
  const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });

  const siteUrl = import.meta.env.SITE_URL || 'https://marcomunich.com';
  const newsletter = new URL(request.url).searchParams.get('newsletter') === '1' ? 'true' : 'false';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: import.meta.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/prompt-pack/grazie?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/prompt-pack?cancelled=1`,
      billing_address_collection: 'auto',
      customer_creation: 'always',
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: 'Prompt Pack per Coach, Counselor e Operatori Olistici',
        },
      },
      locale: 'it',
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            'Accetto i [Termini e Condizioni](https://marcomunich.com/termini) e la [Privacy Policy](https://marcomunich.com/privacy-policy). Confermo di voler ricevere immediatamente il prodotto digitale e rinuncio al diritto di recesso ai sensi dell\'art. 59 D.Lgs. 206/2005.',
        },
      },
      metadata: {
        product: 'prompt-pack',
        newsletterConsent: newsletter,
      },
    });

    if (!session.url) {
      return new Response('Errore creazione sessione Stripe', { status: 500 });
    }

    return redirect(session.url, 303);
  } catch (err) {
    console.error('[checkout] Stripe error:', err);
    return new Response('Errore interno', { status: 500 });
  }
};
