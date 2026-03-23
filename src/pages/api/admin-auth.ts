import type { APIRoute } from 'astro';
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;

const COOKIE_NAME = 'mm_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;


export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString() ?? '';
  const next = formData.get('next')?.toString() ?? '/admin';

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`, 302);
  }

  cookies.set(COOKIE_NAME, ADMIN_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return redirect(next, 302);
};

export const DELETE: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return redirect('/admin/login', 302);
};
