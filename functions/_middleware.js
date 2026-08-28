export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 仅对主页进行登录拦截（含 /index.html）
  if (path !== '/' && path !== '/index.html') {
    return next();
  }

  const cookie = request.headers.get('Cookie') || '';
  if (cookie.includes('admin_session=1')) {
    return next();
  }

  const loginUrl = new URL('/api/admin', url.origin);
  const nextTarget = url.pathname + url.search;
  loginUrl.searchParams.set('next', nextTarget);
  return Response.redirect(loginUrl.toString(), 302);
}
