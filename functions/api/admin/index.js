import { requireSession } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const isAuth = await requireSession(env, request);
  const headers = { 'Content-Type': 'text/html;charset=utf-8' };

  if (!isAuth) {
    return new Response(getLoginHTML(), { headers });
  }

  return new Response(getAdminHTML(), { headers });
}

function getLoginHTML() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="https://bigjackson.top/images/avatar.jpg" />
    <title>后台登录</title>
    <link rel="stylesheet" href="/style.css">
    <style>.container{max-width:400px;margin:80px auto;padding:32px 24px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);text-align:center}input{width:100%;margin:12px 0;padding:12px;border-radius:8px;border:1px solid #ddd;font-size:1em}button{width:100%;padding:12px;border-radius:8px;background:#667eea;color:#fff;font-size:1.1em;border:none;cursor:pointer;margin-top:12px}button:disabled{opacity:.6;cursor:not-allowed}</style>
  </head>
  <body>
    <div class="container">
      <h2>后台登录</h2>
      <input id="username" placeholder="账号" autocomplete="username" />
      <input id="password" type="password" placeholder="密码" autocomplete="current-password" />
      <button id="loginBtn">登录</button>
      <div id="msg" style="color:#e53e3e;margin-top:10px;"></div>
    </div>
    <script>
      document.getElementById('loginBtn').onclick = async function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        this.disabled = true;
        const params = new URLSearchParams(window.location.search);
        const nextTarget = params.get('next') || '/';
        const res = await fetch('/api/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
        if (res.ok) { location.href = nextTarget; } else {
          const data = await res.json();
          document.getElementById('msg').innerText = data.error || '登录失败';
          this.disabled = false;
        }
      }
    </script>
  </body>
  </html>`;
}

function getAdminHTML() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台</title>
    <link rel="stylesheet" href="/style.css">
    <style>
      .container{max-width:1240px;margin:40px auto;padding:24px 20px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);}
      .toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-top:14px;}
      .toolbar .group{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
      .toolbar input,.toolbar select{padding:8px 10px;border:1px solid #ddd;border-radius:8px;min-width:180px;}
      .toolbar button{padding:8px 12px;border:none;background:#667eea;color:#fff;border-radius:8px;cursor:pointer;}
      .toolbar button:disabled{opacity:.5;cursor:not-allowed;}
      .stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;padding:10px;border:1px solid #eef2ff;border-radius:10px;background:#f8f9ff;color:#334155}
      .stats b{color:#111827}
      .msg{min-height:22px;color:#e53e3e;margin-top:10px;font-size:.94em;}
      .sub-msg{margin-top:8px;font-size:.9em;color:#64748b;}
      .table-wrap{overflow-x:auto;margin-top:12px;}
      table{width:100%;border-collapse:collapse;min-width:900px;}
      th,td{padding:10px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top;word-break:break-all;}
      th{background:#f8f9ff;cursor:pointer;white-space:nowrap;}
      th.sortable::after{content:'↕';font-size:12px;color:#94a3b8;margin-left:6px;}
      th.sort-active-asc::after{content:'↑';color:#334155;}
      th.sort-active-desc::after{content:'↓';color:#334155;}
      a{color:#667eea;text-decoration:none}
      a:hover{text-decoration:underline}
      .logout{float:right;color:#e53e3e;cursor:pointer;font-size:.95em;}
      .mono{font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:.86em;color:#334155;}
      .action-btn{margin-left:8px;padding:5px 8px;border:1px solid #c7d2fe;background:#fff;border-radius:6px;cursor:pointer}
      .action-btn:hover{background:#f8f9ff}
      .pagination{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:8px;flex-wrap:wrap;}
      .pagination .pager{display:flex;gap:8px;}
      .pager button{padding:7px 12px;}
      .pager button.active{background:#334155;}
      .toast{position:fixed;right:16px;top:16px;background:#1f2937;color:#fff;border-radius:8px;padding:8px 12px;font-size:13px;display:none;z-index:1000}
      .loading{color:#64748b;margin-top:16px;}
    </style>
  </head>
  <body>
    <div class="container">
      <h2>管理后台 <span class="logout" onclick="logout()">退出</span></h2>
      <div class="toolbar">
        <div class="group">
          <input id="searchInput" placeholder="搜索文件名" />
          <select id="typeFilter">
            <option value="all">全部类型</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="audio">音频</option>
            <option value="document">文档/应用</option>
            <option value="other">其他</option>
          </select>
          <select id="pageSize">
            <option value="10">10 条/页</option>
            <option value="20" selected>20 条/页</option>
            <option value="50">50 条/页</option>
          </select>
          <button id="refreshBtn">刷新</button>
        </div>
      </div>
      <div class="stats" id="stats">
        <span>文件总数：<b id="totalCount">0</b></span>
        <span>筛选后：<b id="filteredCount">0</b></span>
        <span>筛选后体积：<b id="filteredSize">0 B</b></span>
        <span>当前页：<b id="currentPageText">1 / 1</b></span>
      </div>
      <div class="sub-msg" id="subInfo"></div>
      <div class="table-wrap">
        <table id="fileTable">
          <thead>
            <tr>
              <th class="sortable" data-sort="name">文件名</th>
              <th class="sortable" data-sort="size">大小</th>
              <th class="sortable" data-sort="type">类型</th>
              <th class="sortable" data-sort="uploadTime">上传时间</th>
              <th>下载</th>
              <th>原始链接</th>
            </tr>
          </thead>
          <tbody id="fileTableBody"></tbody>
        </table>
      </div>
      <div class="loading" id="loadingText">正在加载文件列表...</div>
      <div id="msg" class="msg"></div>
      <div class="pagination">
        <span id="pageInfo" class="sub-msg"></span>
        <div class="pager">
          <button id="firstPageBtn">首页</button>
          <button id="prevBtn">上一页</button>
          <button id="nextBtn">下一页</button>
          <button id="lastPageBtn">末页</button>
        </div>
      </div>
    </div>
    <div class="toast" id="toast"></div>
    <script>
      let allFiles = [];
      let filteredFiles = [];
      let sortBy = 'uploadTime';
      let sortDirection = 'desc';
      let currentPage = 1;
      let pageSize = 20;

      const state = {
        loading: true,
        error: ''
      };

      const el = {
        tbody: document.querySelector('#fileTableBody'),
        msg: document.getElementById('msg'),
        loadingText: document.getElementById('loadingText'),
        stats: {
          totalCount: document.getElementById('totalCount'),
          filteredCount: document.getElementById('filteredCount'),
          filteredSize: document.getElementById('filteredSize'),
          currentPageText: document.getElementById('currentPageText')
        },
        pageInfo: document.getElementById('pageInfo'),
        controls: {
          search: document.getElementById('searchInput'),
          typeFilter: document.getElementById('typeFilter'),
          pageSize: document.getElementById('pageSize'),
          refresh: document.getElementById('refreshBtn'),
          firstPageBtn: document.getElementById('firstPageBtn'),
          prevBtn: document.getElementById('prevBtn'),
          nextBtn: document.getElementById('nextBtn'),
          lastPageBtn: document.getElementById('lastPageBtn'),
          subInfo: document.getElementById('subInfo'),
          toast: document.getElementById('toast')
        }
      };

      function escapeHtml(input) {
        return String(input || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function detectType(fileType) {
        if (!fileType) return 'other';
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('video/')) return 'video';
        if (fileType.startsWith('audio/')) return 'audio';
        if (fileType === 'application/pdf' || fileType.includes('text/') || fileType.includes('application/vnd') || fileType.includes('application/')) return 'document';
        return 'other';
      }

      function showToast(msg) {
        el.controls.toast.innerText = msg;
        el.controls.toast.style.display = 'block';
        clearTimeout(window.__adminToastTimer);
        window.__adminToastTimer = setTimeout(() => {
          el.controls.toast.style.display = 'none';
        }, 1700);
      }

      function formatSize(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) return '未知';
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
      }

      function formatTime(ts) {
        const d = new Date(ts);
        if (Number.isNaN(d.getTime())) return '无效时间';
        return d.toLocaleString();
      }

      function buildProxyUrl(file) {
        if (!file || !file.url) return '';
        return '/api/proxy?url=' + encodeURIComponent(file.url) + '&filename=' + encodeURIComponent(file.name || '');
      }

      function isValidProxyTarget(fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') return false;
        try {
          const parsed = new URL(fileUrl);
          return parsed.protocol === 'https:' && parsed.hostname === 'api.telegram.org';
        } catch (e) {
          return false;
        }
      }

      function buildShortUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') return '无';
        if (rawUrl.length <= 54) return rawUrl;
        return rawUrl.slice(0, 28) + '...' + rawUrl.slice(-20);
      }

      function getStatus(file) {
        if (!file || !file.url) return '链接缺失';
        return isValidProxyTarget(file.url) ? '正常' : '非预期链接';
      }

      function getFilteredFiles() {
        const keyword = (el.controls.search.value || '').trim().toLowerCase();
        const typeFilter = el.controls.typeFilter.value || 'all';
        const matched = allFiles.filter((f) => {
          const name = (f.name || '').toLowerCase();
          if (keyword && !name.includes(keyword)) return false;
          if (typeFilter !== 'all') {
            return detectType(f.type || '') === typeFilter;
          }
          return true;
        });
        return matched.sort((a, b) => {
          const va = a[sortBy];
          const vb = b[sortBy];
          const direction = sortDirection === 'asc' ? 1 : -1;
          if (sortBy === 'name' || sortBy === 'type') {
            return direction * String(va || '').localeCompare(String(vb || ''));
          }
          if (sortBy === 'uploadTime' || sortBy === 'size') {
            return direction * ((Number(va) || 0) - (Number(vb) || 0));
          }
          return 0;
        });
      }

      function updateStats() {
        const filteredSize = filteredFiles.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
        const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        el.stats.totalCount.innerText = String(allFiles.length);
        el.stats.filteredCount.innerText = String(filteredFiles.length);
        el.stats.filteredSize.innerText = formatSize(filteredSize);
        el.stats.currentPageText.innerText = currentPage + ' / ' + totalPages;
        el.controls.pageInfo.innerText = filteredFiles.length
          ? '共 ' + filteredFiles.length + ' 条，当前显示 ' + startIndex() + '-' + endIndex() + ' 条'
          : '共 0 条';
        el.controls.subInfo.innerText = sortBy === 'uploadTime'
          ? '当前排序：上传时间 ' + (sortDirection === 'asc' ? '升序' : '降序')
          : '当前排序：' + sortBy + ' ' + (sortDirection === 'asc' ? '升序' : '降序');
      }

      function startIndex() {
        if (!filteredFiles.length) return 0;
        return (currentPage - 1) * pageSize + 1;
      }

      function endIndex() {
        if (!filteredFiles.length) return 0;
        return Math.min(currentPage * pageSize, filteredFiles.length);
      }

      function updatePager() {
        const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
        el.controls.firstPageBtn.disabled = currentPage <= 1;
        el.controls.prevBtn.disabled = currentPage <= 1;
        el.controls.nextBtn.disabled = currentPage >= totalPages;
        el.controls.lastPageBtn.disabled = currentPage >= totalPages;
      }

      function render() {
        el.loadingText.style.display = 'none';
        el.msg.innerText = state.error || '';
        filteredFiles = getFilteredFiles();
        if (!filteredFiles.length) {
          el.tbody.innerHTML = '<tr><td colspan="6">暂无数据，先检查筛选条件或稍后重试。</td></tr>';
        } else {
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          const pageRows = filteredFiles.slice(start, end);
          const rows = pageRows.map((file, index) => {
            const realIndex = start + index;
            const safeName = escapeHtml(file.name || '未命名');
            const safeType = escapeHtml(file.type || 'unknown');
            const rawUrl = file.url || '';
            const safeRaw = escapeHtml(rawUrl);
            const status = getStatus(file);
            const proxyLink = buildProxyUrl(file);
            const shortUrl = buildShortUrl(rawUrl);
            const sizeText = formatSize(Number(file.size) || 0);
            const timeText = formatTime(file.uploadTime);
            return '' +
              '<tr>' +
              '<td><span title="' + safeName + '">' + safeName + '</span></td>' +
              '<td>' + sizeText + '</td>' +
              '<td>' + safeType + '</td>' +
              '<td>' + timeText + '</td>' +
              '<td>' +
              (proxyLink ? '<a href="' + proxyLink + '" target="_blank">下载</a>' : '不可下载') +
              ' <span class="mono">[' + status + ']</span>' +
              '</td>' +
              '<td><div class="mono" title="' + safeRaw + '">' + escapeHtml(shortUrl) + '</div>' +
              ' <button type="button" class="action-btn" data-copy-idx="' + realIndex + '">' + (rawUrl ? '复制原始链接' : '无可复制链接') + '</button>' +
              '</td>' +
              '</tr>';
          }).join('');
          el.tbody.innerHTML = rows;
        }
        updateStats();
        updatePager();
        setActiveSortHeader();
      }

      function setActiveSortHeader() {
        document.querySelectorAll('th.sortable').forEach((th) => {
          th.classList.remove('sort-active-asc');
          th.classList.remove('sort-active-desc');
          if (th.getAttribute('data-sort') === sortBy) {
            th.classList.add(sortDirection === 'asc' ? 'sort-active-asc' : 'sort-active-desc');
          }
        });
      }

      function setStateError(msg) {
        state.error = msg || '';
        state.loading = false;
        el.msg.innerText = state.error;
      }

      async function copyText(text) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = 0;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }
          showToast('已复制到剪贴板');
        } catch (e) {
          setStateError('复制失败：' + (e && e.message ? e.message : '未知错误'));
          showToast('复制失败');
        }
      }

      async function loadFiles() {
        setStateError('');
        el.loadingText.style.display = 'block';
        el.loadingText.innerText = '正在加载文件列表...';
        try {
          const res = await fetch('/api/admin/files');
          if (!res.ok) {
            setStateError('无法获取文件列表（状态 ' + res.status + '）');
            state.loading = false;
            el.loadingText.style.display = 'none';
            render();
            return;
          }
          const data = await res.json();
          allFiles = Array.isArray(data.files) ? data.files : [];
          state.loading = false;
          el.loadingText.style.display = 'none';
          filteredFiles = getFilteredFiles();
          currentPage = 1;
          render();
        } catch (e) {
          setStateError('加载失败：' + (e && e.message ? e.message : '网络错误'));
          state.loading = false;
          el.loadingText.style.display = 'none';
          allFiles = [];
          filteredFiles = [];
          render();
        }
      }

      function bindEvents() {
        el.controls.search.addEventListener('input', () => {
          currentPage = 1;
          render();
        });
        el.controls.typeFilter.addEventListener('change', () => {
          currentPage = 1;
          render();
        });
        el.controls.pageSize.addEventListener('change', (e) => {
          pageSize = Number(e.target.value) || 20;
          currentPage = 1;
          render();
        });
        el.controls.refresh.addEventListener('click', loadFiles);
        el.controls.firstPageBtn.onclick = () => {
          currentPage = 1;
          render();
        };
        el.controls.prevBtn.onclick = () => {
          if (currentPage > 1) {
            currentPage -= 1;
            render();
          }
        };
        el.controls.nextBtn.onclick = () => {
          const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
          if (currentPage < totalPages) {
            currentPage += 1;
            render();
          }
        };
        el.controls.lastPageBtn.onclick = () => {
          currentPage = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
          render();
        };
        document.querySelectorAll('th.sortable').forEach((th) => {
          th.onclick = () => {
            const targetSort = th.getAttribute('data-sort');
            if (sortBy === targetSort) {
              sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
              sortBy = targetSort;
              sortDirection = 'desc';
            }
            render();
          };
        });
        document.getElementById('fileTableBody').addEventListener('click', (event) => {
          const btn = event.target.closest('[data-copy-idx]');
          if (!btn) return;
          const idx = Number(btn.getAttribute('data-copy-idx'));
          const file = filteredFiles[idx];
          if (!file || !file.url) {
            showToast('该记录未存储可复制链接');
            return;
          }
          copyText(file.url);
        });
      }

      function renderInitial() {
        bindEvents();
        loadFiles();
        render();
      }

      function logout() {
        document.cookie = 'admin_session=; Path=/; Max-Age=0';
        location.reload();
      }

      renderInitial();
    </script>
  </body>
  </html>`;
}
