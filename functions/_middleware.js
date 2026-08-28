import { requireSession } from './_shared/auth.js';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const isAuth = await requireSession(context.env, request);
  const isRootPath = path === '/' || path === '/index.html';
  const isAdminStaticPath = path === '/admin' ||
    path === '/admin/' ||
    path === '/admin.html' ||
    path === '/admin/index.html' ||
    (path.startsWith('/admin/') && !path.startsWith('/api/admin'));

  if (!isRootPath && !isAdminStaticPath) {
    return next();
  }

  const loginUrl = new URL('/api/admin', url.origin);
  if (path.startsWith('/admin') && isAuth) {
    return Response.redirect(loginUrl.toString(), 302);
  }

  if (isAuth && isRootPath) {
    return next();
  }

  const nextTarget = url.pathname + url.search;
  loginUrl.searchParams.set('next', nextTarget);
  return Response.redirect(loginUrl.toString(), 302);
}
