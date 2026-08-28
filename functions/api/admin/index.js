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

function getAdminStyles() {
  return `
      .container{max-width:1240px;margin:40px auto;padding:24px 20px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);}
      .toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-top:14px}
      .toolbar .group{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
      .toolbar input,.toolbar select{padding:8px 10px;border:1px solid #dbe0e7;border-radius:8px;min-width:180px;background:#f8fafc;outline:none}
      .toolbar input:focus,.toolbar select:focus{border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,0.12)}
      .toolbar button{padding:8px 12px;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:10px;cursor:pointer;transition:transform .15s ease, filter .15s ease}
      .toolbar button:hover{filter:brightness(1.04)}
      .toolbar button:disabled{opacity:.5;cursor:not-allowed}
      .stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;padding:10px;border:1px solid #eef2ff;border-radius:10px;background:#f8f9ff;color:#334155}
      .stats b{color:#111827}
      .msg{min-height:22px;color:#e53e3e;margin-top:10px;font-size:.94em;}
      .sub-msg{margin-top:8px;font-size:.9em;color:#64748b;}
      .table-wrap{overflow-x:auto;margin-top:12px;border:1px solid #ecf0ff;border-radius:12px}
      table{width:100%;border-collapse:collapse;min-width:860px;background:#fff}
      th,td{padding:12px 10px;border-bottom:1px solid #eef2f7;text-align:left;vertical-align:middle;word-break:break-all;}
      th{background:#f8f9ff;cursor:pointer;white-space:nowrap;}
      th.sortable::after{content:'↕';font-size:12px;color:#94a3b8;margin-left:6px;}
      th.sort-active-asc::after{content:'↑';color:#334155;}
      th.sort-active-desc::after{content:'↓';color:#334155;}
      tbody tr:hover{background:#f8f9ff;}
      tbody tr{transition:background .15s ease}
      a{color:#667eea;text-decoration:none}
      a:hover{text-decoration:underline}
      .logout{float:right;color:#e53e3e;cursor:pointer;font-size:.95em;}
      .mono{font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:.86em;color:#334155;}
      .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .btn{display:inline-flex;align-items:center;justify-content:center;height:34px;padding:0 12px;border-radius:10px;box-sizing:border-box;border:1px solid #c7d2fe;background:#fff;color:#1e293b;line-height:1.2;font-size:13px;cursor:pointer;white-space:nowrap;transition:transform .15s ease, filter .15s ease, background .15s ease}
      .btn:hover{filter:brightness(1.04)}
      .btn:disabled,.btn[disabled]{opacity:.5;cursor:not-allowed}
      .btn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(102,126,234,0.15)}
      .btn.btn-primary{background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border-color:transparent}
      .btn.btn-primary:hover{filter:brightness(1.05)}
      .btn.btn-muted{opacity:.45;cursor:not-allowed}
      .status-pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px}
      .pagination{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:8px;flex-wrap:wrap;}
      .pagination .pager{display:flex;gap:8px;}
      .pager button.active{background:#334155;}
      .toast{position:fixed;right:16px;top:16px;background:#1f2937;color:#fff;border-radius:8px;padding:8px 12px;font-size:13px;display:none;z-index:1000}
      .loading{color:#64748b;margin-top:16px;}
    `.trim();
}

function getAdminHeader() {
  return `
      <h2>管理后台 <span class="logout" onclick="logout()">退出</span></h2>
      ${getAdminToolbar()}
      ${getAdminStats()}
    `.trim();
}

function getAdminToolbar() {
  return `
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
          <button id="refreshBtn" class="btn">刷新</button>
        </div>
      </div>
    `.trim();
}

function getAdminStats() {
  return `
      <div class="stats" id="stats">
        <span>文件总数：<b id="totalCount">0</b></span>
        <span>筛选后：<b id="filteredCount">0</b></span>
        <span>筛选后体积：<b id="filteredSize">0 B</b></span>
        <span>当前页：<b id="currentPageText">1 / 1</b></span>
      </div>
      <div class="sub-msg" id="subInfo"></div>
      ${getAdminTable()}
      <div class="loading" id="loadingText">正在加载文件列表...</div>
      <div id="msg" class="msg"></div>
      ${getAdminPagination()}
    `.trim();
}

function getAdminTable() {
  return `
      <div class="table-wrap">
        <table id="fileTable">
          <thead>
            <tr>
              <th class="sortable" data-sort="name">文件名</th>
              <th class="sortable" data-sort="size">大小</th>
              <th class="sortable" data-sort="type">类型</th>
              <th class="sortable" data-sort="uploadTime">上传时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="fileTableBody"></tbody>
        </table>
      </div>
    `.trim();
}

function getAdminPagination() {
  return `
      <div class="pagination">
        <span id="pageInfo" class="sub-msg"></span>
        <div class="pager">
          <button id="firstPageBtn" class="btn">首页</button>
          <button id="prevBtn" class="btn">上一页</button>
          <button id="nextBtn" class="btn">下一页</button>
          <button id="lastPageBtn" class="btn">末页</button>
        </div>
      </div>
    `.trim();
}

function getAdminShell() {
  return `
    <div class="container">
      ${getAdminHeader()}
    </div>
    <div class="toast" id="toast"></div>
  `.trim();
}

function getAdminScript() {
  return `
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

      function setText(node, text) {
        if (!node) return;
        node.innerText = String(text || '');
      }

      function setHtml(node, html) {
        if (!node) return;
        node.innerHTML = String(html || '');
      }

      function setDisplay(node, value) {
        if (!node) return;
        node.style.display = value;
      }

      function setDisabled(node, value) {
        if (!node) return;
        node.disabled = !!value;
      }

      function getValue(node, fallback = '') {
        return node && typeof node.value === 'string' ? node.value : fallback;
      }

      function escapeHtml(input) {
        return String(input || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\"/g, '&quot;')
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
        setText(el.controls.toast, msg);
        setDisplay(el.controls.toast, 'block');
        clearTimeout(window.__adminToastTimer);
        window.__adminToastTimer = setTimeout(() => {
          setDisplay(el.controls.toast, 'none');
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

      function getStatus(file) {
        if (!file || !file.url) return '链接缺失';
        return isValidProxyTarget(file.url) ? '正常' : '非预期链接';
      }

      function getFilteredFiles() {
        const keyword = (getValue(el.controls.search).trim() || '').toLowerCase();
        const typeFilter = getValue(el.controls.typeFilter, 'all') || 'all';
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
        setText(el.stats.totalCount, String(allFiles.length));
        setText(el.stats.filteredCount, String(filteredFiles.length));
        setText(el.stats.filteredSize, formatSize(filteredSize));
        setText(el.stats.currentPageText, currentPage + ' / ' + totalPages);
        setText(
          el.controls.pageInfo,
          filteredFiles.length
            ? '共 ' + filteredFiles.length + ' 条，当前显示 ' + startIndex() + '-' + endIndex() + ' 条'
            : '共 0 条'
        );
        setText(
          el.controls.subInfo,
          sortBy === 'uploadTime'
            ? '当前排序：上传时间 ' + (sortDirection === 'asc' ? '升序' : '降序')
            : '当前排序：' + sortBy + ' ' + (sortDirection === 'asc' ? '升序' : '降序')
        );
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
        setDisabled(el.controls.firstPageBtn, currentPage <= 1);
        setDisabled(el.controls.prevBtn, currentPage <= 1);
        setDisabled(el.controls.nextBtn, currentPage >= totalPages);
        setDisabled(el.controls.lastPageBtn, currentPage >= totalPages);
      }

      const AdminComponents = {
        statusPill(status) {
          return '<span class=\"status-pill\">' + escapeHtml(status) + '</span>';
        },
        fileName(file) {
          const safeName = escapeHtml(file.name || '未命名');
          return '<td><span title=\"' + safeName + '\">' + safeName + '</span></td>';
        },
        fileType(file) {
          return '<td>' + escapeHtml(file.type || 'unknown') + '</td>';
        },
        fileSize(file) {
          return '<td>' + formatSize(Number(file.size) || 0) + '</td>';
        },
        uploadTime(file) {
          return '<td>' + formatTime(file.uploadTime) + '</td>';
        },
        action(file, idx, proxyLink) {
          const canDownload = Boolean(proxyLink);
          const canCopy = Boolean(file.url);
          const downloadBtn = canDownload
            ? '<a class=\"btn btn-primary\" href=\"' + proxyLink + '\" target=\"_blank\">下载</a>'
            : '<button class=\"btn btn-muted\" type=\"button\" disabled>不可下载</button>';
          const copyBtn = '<button type=\"button\" class=\"btn\" data-copy-idx=\"' + idx + '\" ' + (canCopy ? '' : 'disabled') + '>' + (canCopy ? '复制链接' : '无链接') + '</button>';
          return '<td class=\"actions\">' + downloadBtn + copyBtn + '</td>';
        },
        emptyRow() {
          return '<tr><td colspan=\"6\">暂无数据，先检查筛选条件或稍后重试。</td></tr>';
        },
        fileRow(file, index) {
          const proxyLink = buildProxyUrl(file);
          return '<tr>' +
            this.fileName(file) +
            this.fileSize(file) +
            this.fileType(file) +
            this.uploadTime(file) +
            '<td>' + this.statusPill(getStatus(file)) + '</td>' +
            this.action(file, index, proxyLink) +
            '</tr>';
        }
      };

      function render() {
        setDisplay(el.loadingText, 'none');
        setText(el.msg, state.error || '');
        filteredFiles = getFilteredFiles();
        if (!el.tbody) return;
        if (!filteredFiles.length) {
          setHtml(el.tbody, AdminComponents.emptyRow());
        } else {
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          const pageRows = filteredFiles.slice(start, end);
          const rows = pageRows.map((file, index) => AdminComponents.fileRow(file, start + index)).join('');
          setHtml(el.tbody, rows);
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
        setText(el.msg, state.error);
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
        setDisplay(el.loadingText, 'block');
        setText(el.loadingText, '正在加载文件列表...');
        try {
          const res = await fetch('/api/admin/files');
          if (!res.ok) {
            setStateError('无法获取文件列表（状态 ' + res.status + '）');
            state.loading = false;
            setDisplay(el.loadingText, 'none');
            render();
            return;
          }
          const data = await res.json();
          allFiles = Array.isArray(data.files) ? data.files : [];
          state.loading = false;
          setDisplay(el.loadingText, 'none');
          filteredFiles = getFilteredFiles();
          currentPage = 1;
          render();
        } catch (e) {
          setStateError('加载失败：' + (e && e.message ? e.message : '网络错误'));
          state.loading = false;
          setDisplay(el.loadingText, 'none');
          allFiles = [];
          filteredFiles = [];
          render();
        }
      }

      function bindEvents() {
        if (el.controls.search) {
          el.controls.search.addEventListener('input', () => {
            currentPage = 1;
            render();
          });
        }
        if (el.controls.typeFilter) {
          el.controls.typeFilter.addEventListener('change', () => {
            currentPage = 1;
            render();
          });
        }
        if (el.controls.pageSize) {
          el.controls.pageSize.addEventListener('change', (e) => {
            pageSize = Number(e.target.value) || 20;
            currentPage = 1;
            render();
          });
        }
        if (el.controls.refresh) {
          el.controls.refresh.addEventListener('click', loadFiles);
        }
        if (el.controls.firstPageBtn) {
          el.controls.firstPageBtn.onclick = () => {
            currentPage = 1;
            render();
          };
        }
        if (el.controls.prevBtn) {
          el.controls.prevBtn.onclick = () => {
            if (currentPage > 1) {
              currentPage -= 1;
              render();
            }
          };
        }
        if (el.controls.nextBtn) {
          el.controls.nextBtn.onclick = () => {
            const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
            if (currentPage < totalPages) {
              currentPage += 1;
              render();
            }
          };
        }
        if (el.controls.lastPageBtn) {
          el.controls.lastPageBtn.onclick = () => {
            currentPage = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
            render();
          };
        }
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
        if (el.tbody) {
          el.tbody.addEventListener('click', (event) => {
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
  `;
}

function getAdminHTML() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台</title>
    <link rel="stylesheet" href="/style.css">
    <style>${getAdminStyles()}</style>
  </head>
  <body>
    ${getAdminShell()}
    <script>
      ${getAdminScript()}
    </script>
  </body>
  </html>`;
}
