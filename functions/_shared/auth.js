const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_PREFIX = 'admin_session:';
const LOGIN_FAIL_PREFIX = 'admin_login_fail:';
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const LOGIN_FAIL_WINDOW_SECONDS = 10 * 60;
const LOGIN_FAIL_LIMIT = 10;

function getCookieHeader(request) {
  return request.headers.get('Cookie') || '';
}

function parseCookie(cookieHeader, name) {
  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [rawKey, ...rawValue] = p.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('=') || '');
    }
  }
  return '';
}

function randomSessionId() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

function cookieBaseAttributes(request, maxAge) {
  const secure = request.url.startsWith('https://') ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAge}; SameSite=Strict; HttpOnly${secure}`;
}

export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')
    || 'unknown';
}

export function isValidCredentials(username, password, env) {
  const expectedUser = env.USER || '';
  const expectedPass = env.PASSWORD || '';
  return username === expectedUser && password === expectedPass;
}

export async function isLoginBlocked(env, request) {
  if (!env?.UPLOADS_KV) {
    return false;
  }
  const ip = getClientIp(request);
  const key = `${LOGIN_FAIL_PREFIX}${ip}`;
  const fail = Number(await env.UPLOADS_KV.get(key) || '0');
  return Number.isFinite(fail) && fail >= LOGIN_FAIL_LIMIT;
}

export async function increaseLoginFail(env, request) {
  if (!env?.UPLOADS_KV) {
    return;
  }
  const ip = getClientIp(request);
  const key = `${LOGIN_FAIL_PREFIX}${ip}`;
  const fail = Number(await env.UPLOADS_KV.get(key) || '0') + 1;
  await env.UPLOADS_KV.put(key, String(fail), { expirationTtl: LOGIN_FAIL_WINDOW_SECONDS });
}

export async function clearLoginFail(env, request) {
  if (!env?.UPLOADS_KV) {
    return;
  }
  const ip = getClientIp(request);
  const key = `${LOGIN_FAIL_PREFIX}${ip}`;
  await env.UPLOADS_KV.delete(key);
}

export async function createSession(env, request, username) {
  if (!env?.UPLOADS_KV) {
    return null;
  }
  const sessionId = randomSessionId();
  const key = `${SESSION_PREFIX}${sessionId}`;
  const session = {
    user: username,
    createdAt: Date.now(),
    ip: getClientIp(request)
  };
  await env.UPLOADS_KV.put(key, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return sessionId;
}

export async function getSession(env, request) {
  if (!env?.UPLOADS_KV) {
    return null;
  }
  const cookieHeader = getCookieHeader(request);
  const sessionId = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }
  const key = `${SESSION_PREFIX}${sessionId}`;
  const data = await env.UPLOADS_KV.get(key);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function requireSession(env, request) {
  const session = await getSession(env, request);
  if (!session) {
    return false;
  }
  // 简单会话校验：只要 session 在 KV 中且未过期即视为合法
  return true;
}

export function buildSessionCookie(sessionId, request) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; ${cookieBaseAttributes(request, SESSION_TTL_SECONDS)}`;
}

export function buildClearSessionCookie(request) {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; ${cookieBaseAttributes(request, 0)}`;
}
