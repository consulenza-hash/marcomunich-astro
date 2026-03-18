import type { APIRoute } from 'astro';
export const prerender = false;
export const GET: APIRoute = () => {
  return new Response(JSON.stringify({
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    stripeLen: (process.env.STRIPE_SECRET_KEY || '').length,
    stripeStart: (process.env.STRIPE_SECRET_KEY || '').slice(0,7),
    hasPrice: !!process.env.STRIPE_PRICE_ID,
    priceId: process.env.STRIPE_PRICE_ID || 'MISSING',
    nodeEnv: process.env.NODE_ENV,
  }), { headers: { 'Content-Type': 'application/json' } });
};
