import type { APIRoute } from 'astro';
import { ADMIN_PASSWORD } from 'astro:env/server';
import { hashPassword, COOKIE_NAME, COOKIE_MAX_AGE } from '../../middleware';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString() ?? '';
  const next = formData.get('next')?.toString() ?? '/admin';

  const adminPassword = ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`, 302);
  }

  const token = await hashPassword(password);

  cookies.set(COOKIE_NAME, token, {
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
