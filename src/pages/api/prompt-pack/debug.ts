import type { APIRoute } from 'astro';
import Stripe from 'stripe';
export const prerender = false;
export const GET: APIRoute = async () => {
  let stripeError = null;
  let priceOk = false;
  try {
    const key = (process.env.STRIPE_SECRET_KEY || '').trim();
    const priceId = (process.env.STRIPE_PRICE_ID || '').trim();
    const stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' });
    await stripe.prices.retrieve(priceId);
    priceOk = true;
  } catch(e: any) {
    stripeError = e.message;
  }
  return new Response(JSON.stringify({
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    stripeLen: (process.env.STRIPE_SECRET_KEY || '').length,
    stripeStart: (process.env.STRIPE_SECRET_KEY || '').slice(0,7),
    hasPrice: !!process.env.STRIPE_PRICE_ID,
    priceId: process.env.STRIPE_PRICE_ID || 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    stripeError,
    priceOk,
  }), { headers: { 'Content-Type': 'application/json' } });
};
