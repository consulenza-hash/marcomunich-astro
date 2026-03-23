/**
 * /api/prompt-pack/logout
 * Cancella il cookie di accesso e redirige alla landing.
 */

import type { APIRoute } from 'astro';
import { clearAccessCookie } from '@lib/prompt-pack-auth';


export const GET: APIRoute = ({ redirect }) => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/prompt-pack',
      'Set-Cookie': clearAccessCookie(),
    },
  });
};
