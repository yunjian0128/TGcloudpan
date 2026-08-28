import { requireSession } from '../_shared/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!await requireSession(env, request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const fileUrl = url.searchParams.get('url');
  const filename = url.searchParams.get('filename');

  if (!fileUrl) {
    return new Response('Missing url', { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(fileUrl);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  // 仅允许安全代理 Telegram 文件下载地址，避免滥用 SSRF
  if (targetUrl.protocol !== 'https:' || targetUrl.hostname !== 'api.telegram.org') {
    return new Response('Invalid file host', { status: 400 });
  }

  const resp = await fetch(targetUrl.toString());
  const headers = new Headers(resp.headers);
  // 允许跨域
  headers.set('Access-Control-Allow-Origin', '*');

  if (filename) {
    const safeName = sanitizeFileName(filename);
    if (safeName) {
      const encodedName = encodeURIComponent(safeName);
      headers.set(
        'Content-Disposition',
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
      );
    }
  }

  return new Response(resp.body, {
    status: resp.status,
    headers
  });
}

function sanitizeFileName(name) {
  return name
    .replace(/[\\/]/g, '_')
    .replace(/[\r\n"]/g, '')
    .trim()
    .slice(0, 220);
}
