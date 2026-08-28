import { buildSessionCookie, clearLoginFail, createSession, isLoginBlocked, increaseLoginFail, isValidCredentials } from '../_shared/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.UPLOADS_KV) {
    return new Response(JSON.stringify({ success: false, error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (await isLoginBlocked(env, request)) {
    return new Response(JSON.stringify({ success: false, error: 'Too many login attempts. Please retry later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '600'
      }
    });
  }

  const { username, password } = await request.json();
  if (isValidCredentials(username, password, env)) {
    const sessionId = await createSession(env, request, username || '');
    await clearLoginFail(env, request);
    const headers = {
      'Set-Cookie': buildSessionCookie(sessionId, request),
      'Content-Type': 'application/json'
    };
    return new Response(JSON.stringify({ success: true }), { headers });
  }

  await increaseLoginFail(env, request);
  return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
