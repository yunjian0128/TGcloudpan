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
      .table-wrap{margin-top:12px;}
      .tabulator{border:1px solid #ecf0ff;border-radius:12px;overflow:hidden;}
      .tabulator .tabulator-header{background:#f8f9ff;color:#334155;}
      .tabulator .tabulator-col{background:transparent;}
      .tabulator .tabulator-row{min-height:44px;}
      .tabulator .tabulator-row.tabulator-row-even{background:#fcfdff;}
      .tabulator .tabulator-row:hover{background:#f8f9ff;}
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
        <div id="fileTable"></div>
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
      let table;
      const fileMap = new Map();

      const state = {
        loading: true,
        error: ''
      };

      const el = {
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
          prevPageBtn: document.getElementById('prevBtn'),
          nextPageBtn: document.getElementById('nextBtn'),
          lastPageBtn: document.getElementById('lastPageBtn'),
          subInfo: document.getElementById('subInfo'),
          toast: document.getElementById('toast')
        }
      };

      function setText(node, text) {
        if (!node) return;
        node.innerText = String(text || '');
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

      function safeCall(handler, fallback) {
        try {
          return handler();
        } catch (e) {
          return fallback;
        }
      }

      function showToast(msg) {
        setText(el.controls.toast, msg);
        setDisplay(el.controls.toast, 'block');
        clearTimeout(window.__adminToastTimer);
        window.__adminToastTimer = setTimeout(() => {
          setDisplay(el.controls.toast, 'none');
        }, 1700);
      }

      function getPageSizeValue() {
        const pageSize = Number(getValue(el.controls.pageSize, '20'));
        return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
      }

      function hydrateFile(file, index) {
        return {
          uid: String(index),
          name: file && file.name ? file.name : '未命名',
          size: Number(file && file.size) || 0,
          type: file && file.type ? file.type : 'unknown',
          typeLabel: detectType(file && file.type ? file.type : ''),
          uploadTime: Number(file && file.uploadTime) || 0,
          url: file && file.url ? file.url : '',
          proxyUrl: buildProxyUrl(file),
          status: getStatus(file)
        };
      }

      function buildFileMap(rows) {
        fileMap.clear();
        rows.forEach((row) => {
          if (!row || !row.uid) return;
          fileMap.set(row.uid, row);
        });
      }

      function getFilteredFiles() {
        const keyword = (getValue(el.controls.search).trim() || '').toLowerCase();
        const typeFilter = getValue(el.controls.typeFilter, 'all') || 'all';
        return allFiles.filter((file) => {
          const name = (file.name || '').toLowerCase();
          if (keyword && !name.includes(keyword)) return false;
          if (typeFilter !== 'all' && file.typeLabel !== typeFilter) return false;
          return true;
        });
      }

      function getCurrentTablePage() {
        return safeCall(() => table.getPage(), 1) || 1;
      }

      function getMaxTablePage() {
        return Math.max(1, safeCall(() => table.getPageMax(), Math.max(1, Math.ceil(filteredFiles.length / getPageSizeValue()))));
      }

      function getTablePageSize() {
        return safeCall(() => table.getPageSize(), getPageSizeValue());
      }

      function updatePager() {
        const currentPage = getCurrentTablePage();
        const totalPages = getMaxTablePage();
        setDisabled(el.controls.firstPageBtn, currentPage <= 1);
        setDisabled(el.controls.prevPageBtn, currentPage <= 1);
        setDisabled(el.controls.nextPageBtn, currentPage >= totalPages);
        setDisabled(el.controls.lastPageBtn, currentPage >= totalPages);
      }

      function getSortLabel(sorters) {
        if (!Array.isArray(sorters) || !sorters.length) {
          return '上传时间 降序';
        }
        const field = sorters[0].field;
        const dir = sorters[0].dir === 'asc' ? '升序' : '降序';
        const labels = {
          name: '文件名',
          size: '大小',
          typeLabel: '类型',
          uploadTime: '上传时间',
          status: '状态'
        };
        return '当前排序：' + (labels[field] || field || '未定义') + ' ' + dir;
      }

      function updateStats() {
        const pageSize = getTablePageSize();
        const totalPages = getMaxTablePage();
        const currentPage = getCurrentTablePage();
        const sorters = safeCall(() => table.getSorters(), []);

        const filteredSize = filteredFiles.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
        const totalCount = allFiles.length;
        const filteredCount = filteredFiles.length;
        const start = filteredCount ? ((currentPage - 1) * pageSize + 1) : 0;
        const end = Math.min(currentPage * pageSize, filteredCount);

        setText(el.stats.totalCount, String(totalCount));
        setText(el.stats.filteredCount, String(filteredCount));
        setText(el.stats.filteredSize, formatSize(filteredSize));
        setText(el.stats.currentPageText, String(currentPage) + ' / ' + String(totalPages));
        setText(el.pageInfo, filteredCount ? '共 ' + filteredCount + ' 条，当前显示 ' + start + '-' + end + ' 条' : '共 0 条');
        setText(el.controls.subInfo, getSortLabel(sorters));
      }

      function renderActions(cell) {
        const rowData = cell.getData() || {};
        const canDownload = Boolean(rowData.proxyUrl);
        const canCopy = Boolean(rowData.url);
        const downloadBtn = canDownload
          ? '<a class=\"btn btn-primary\" href=\"' + escapeHtml(rowData.proxyUrl) + '\" target=\"_blank\" rel=\"noreferrer\">下载</a>'
          : '<button class=\"btn btn-muted\" type=\"button\" disabled>不可下载</button>';
        const copyBtn = canCopy
          ? '<button class=\"btn admin-copy-btn\" type=\"button\" data-uid=\"' + escapeHtml(rowData.uid) + '\">复制链接</button>'
          : '<button class=\"btn\" type=\"button\" disabled>无链接</button>';
        return '<div class=\"actions\">' + downloadBtn + copyBtn + '</div>';
      }

      function renderStatus(cell) {
        return '<span class=\"status-pill\">' + escapeHtml(cell.getValue() || '') + '</span>';
      }

      function initTable() {
        if (!window.Tabulator) {
          setStateError('Tabulator 加载失败，请检查 CDN 可访问性');
          setDisplay(el.loadingText, 'block');
          setText(el.loadingText, '页面组件加载失败，请稍后重试。');
          return;
        }

        table = new Tabulator('#fileTable', {
          data: [],
          layout: 'fitColumns',
          pagination: 'local',
          paginationSize: getPageSizeValue(),
          placeholder: '暂无数据，先检查筛选条件或稍后重试。',
          columnHeaderVertAlign: 'middle',
          initialSort: [{ column: 'uploadTime', dir: 'desc' }],
          columns: [
            { title: '文件名', field: 'name', sorter: 'string', minWidth: 280, formatter: (cell) => {
                const value = cell.getValue() || '未命名';
                return '<span title=\"' + escapeHtml(value) + '\">' + escapeHtml(value) + '</span>';
              }
            },
            { title: '大小', field: 'size', sorter: 'number', hozAlign: 'right', formatter: (cell) => formatSize(Number(cell.getValue()) || 0), width: 120 },
            { title: '类型', field: 'typeLabel', sorter: 'string', width: 120 },
            { title: '上传时间', field: 'uploadTime', sorter: 'number', minWidth: 180, formatter: (cell) => formatTime(cell.getValue()) },
            { title: '状态', field: 'status', width: 120, formatter: renderStatus },
            { title: '操作', field: 'uid', hozAlign: 'left', headerSort: false, widthGrow: 1, formatter: renderActions }
          ]
        });

        if (typeof table.on === 'function') {
          table.on('sortChanged', () => {
            updateStats();
            updatePager();
          });
          table.on('pageLoaded', () => {
            updateStats();
            updatePager();
          });
        }
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

      function applyFilters() {
        filteredFiles = getFilteredFiles();
        buildFileMap(filteredFiles);
        if (table) {
          table.replaceData(filteredFiles);
          table.setPage(1);
        }
        updateStats();
        updatePager();
      }

      async function loadFiles() {
        setStateError('');
        setDisplay(el.loadingText, 'block');
        setText(el.loadingText, '正在加载文件列表...');
        try {
          const res = await fetch('/api/admin/files');
          if (!res.ok) {
            setStateError('无法获取文件列表（状态 ' + res.status + '）');
            allFiles = [];
            filteredFiles = [];
            applyFilters();
            return;
          }
          const data = await res.json();
          const list = Array.isArray(data.files) ? data.files : [];
          allFiles = list.map((file, index) => hydrateFile(file, index));
          setDisplay(el.loadingText, 'none');
          applyFilters();
        } catch (e) {
          setStateError('加载失败：' + (e && e.message ? e.message : '网络错误'));
          allFiles = [];
          filteredFiles = [];
          applyFilters();
        } finally {
          state.loading = false;
          setDisplay(el.loadingText, 'none');
        }
      }

      function setStateError(msg) {
        state.error = msg || '';
        state.loading = false;
        setText(el.msg, state.error);
      }

      function bindEvents() {
        if (el.controls.search) {
          el.controls.search.addEventListener('input', () => applyFilters());
        }
        if (el.controls.typeFilter) {
          el.controls.typeFilter.addEventListener('change', () => applyFilters());
        }
        if (el.controls.pageSize) {
          el.controls.pageSize.addEventListener('change', (event) => {
            const pageSize = Number(event.target.value) || getPageSizeValue();
            if (table && typeof table.setPageSize === 'function') {
              table.setPageSize(pageSize);
            }
            applyFilters();
          });
        }
        if (el.controls.refresh) {
          el.controls.refresh.addEventListener('click', loadFiles);
        }
        if (el.controls.firstPageBtn) {
          el.controls.firstPageBtn.addEventListener('click', () => {
            if (!table) return;
            table.setPage(1);
            updateStats();
            updatePager();
          });
        }
        if (el.controls.prevPageBtn) {
          el.controls.prevPageBtn.addEventListener('click', () => {
            if (!table) return;
            const current = getCurrentTablePage();
            if (current > 1) {
              table.setPage(current - 1);
              updateStats();
              updatePager();
            }
          });
        }
        if (el.controls.nextPageBtn) {
          el.controls.nextPageBtn.addEventListener('click', () => {
            if (!table) return;
            const current = getCurrentTablePage();
            const total = getMaxTablePage();
            if (current < total) {
              table.setPage(current + 1);
              updateStats();
              updatePager();
            }
          });
        }
        if (el.controls.lastPageBtn) {
          el.controls.lastPageBtn.addEventListener('click', () => {
            if (!table) return;
            table.setPage(getMaxTablePage());
            updateStats();
            updatePager();
          });
        }
        const tableWrap = document.getElementById('fileTable');
        if (tableWrap) {
          tableWrap.addEventListener('click', async (event) => {
            const copyBtn = event.target.closest('.admin-copy-btn');
            if (!copyBtn) return;
            const uid = copyBtn.getAttribute('data-uid');
            const row = fileMap.get(uid);
            if (!row || !row.url) {
              showToast('该记录未存储可复制链接');
              return;
            }
            copyText(row.url);
          });
        }
      }

      function renderInitial() {
        initTable();
        bindEvents();
        loadFiles();
      }

      function logout() {
        document.cookie = 'admin_session=; Path=/; Max-Age=0';
        location.reload();
      }

      window.logout = logout;
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
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.0/dist/css/tabulator.min.css">
    <style>${getAdminStyles()}</style>
  </head>
  <body>
    ${getAdminShell()}
    <script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>
    <script>
      ${getAdminScript()}
    </script>
  </body>
  </html>`;
}
