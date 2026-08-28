import { requireSession } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const isAuth = await requireSession(env, request);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!env.UPLOADS_KV) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500 });
  }
  // 列出所有上传文件
  const list = await env.UPLOADS_KV.list({ prefix: 'file:' });
  const files = [];
  for (const item of list.keys) {
    const value = await env.UPLOADS_KV.get(item.name);
    if (value) files.push(JSON.parse(value));
  }
  // 按上传时间倒序
  files.sort((a, b) => b.uploadTime - a.uploadTime);
  return new Response(JSON.stringify({ files }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 
