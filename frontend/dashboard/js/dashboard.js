/* ═══════════════════════════════════════════════════════════════════════════
   ClothCo CRM — Dashboard SPA
   ═══════════════════════════════════════════════════════════════════════════ */

const API = '/api/v1';

/* ─── State ──────────────────────────────────────────────────────────────── */
const state = {
  user: null,
  token: null,
  page: 'dashboard',
  charts: {},
  customers: [],
  users: [],
};

/* ─── API Helper ─────────────────────────────────────────────────────────── */
const api = {
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (state.token) h['Authorization'] = `Bearer ${state.token}`;
    return h;
  },
  async req(method, path, body) {
    const res = await fetch(API + path, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  get: (path) => api.req('GET', path),
  post: (path, body) => api.req('POST', path, body),
  patch: (path, body) => api.req('PATCH', path, body),
  delete: (path) => api.req('DELETE', path),
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function pill(value, extra = '') {
  const cls = `pill pill-${value?.toLowerCase().replace(/\s/g,'-')} ${extra}`.trim();
  return `<span class="${cls}"><span class="pill-dot"></span>${value || '—'}</span>`;
}
function actionBtns(editFn, deleteFn) {
  return `
    <button class="btn btn-ghost btn-sm btn-icon" onclick="${editFn}" title="Edit">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
    </button>
    <button class="btn btn-danger btn-sm btn-icon" onclick="${deleteFn}" title="Delete">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
    </button>`;
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error:   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>',
    info:    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
  };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icons[type] || ''}<span>${msg}</span>`;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function openModal(title, bodyHTML, footerHTML) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal-footer').innerHTML = footerHTML;
  $('#modal-overlay').classList.remove('hidden');
}
function closeModal() {
  $('#modal-overlay').classList.add('hidden');
  $('#modal-body').innerHTML = '';
  $('#modal-footer').innerHTML = '';
}

/* ─── Theme ──────────────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('crm-theme', theme);
  $('#theme-icon-light').classList.toggle('hidden', theme === 'dark');
  $('#theme-icon-dark').classList.toggle('hidden', theme === 'light');
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function toggleSidebar() {
  const s = $('#sidebar');
  s.classList.toggle('collapsed');
  localStorage.setItem('crm-sidebar', s.classList.contains('collapsed') ? '1' : '0');
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',    roles: ['manager','admin'],   icon: svgGrid() },
  { id: 'customers',     label: 'Customers',    roles: ['manager','admin'],   icon: svgPeople() },
  { id: 'leads',         label: 'Leads',        roles: ['manager','admin'],   icon: svgFunnel() },
  { id: 'opportunities', label: 'Opportunities',roles: ['manager','admin'],   icon: svgBriefcase() },
  { id: 'remodules',     label: 'Remodule',     roles: ['manager','admin'],   icon: svgCalCheck() },
  { id: 'inventory',     label: 'Inventory',    roles: ['manager','admin'],   icon: svgBox() },
  { id: 'reports',       label: 'Reports',      roles: ['manager','admin'],   icon: svgChart() },
  { id: 'divider',       label: '',             roles: ['manager'],           divider: true },
  { id: 'users',         label: 'Team',         roles: ['manager'],           icon: svgUsersGroup() },
  { id: 'audit-logs',    label: 'Audit Logs',   roles: ['manager'],           icon: svgShield() },
  { id: 'divider2',      label: '',             roles: ['manager','admin'],   divider: true },
  { id: 'profile',       label: 'Profile',      roles: ['manager','admin'],   icon: svgUser() },
];

function buildNav() {
  const nav = $('#sidebar-nav');
  nav.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    if (!item.roles.includes(state.user.role)) return;
    if (item.divider) {
      const hr = document.createElement('div');
      hr.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);margin:8px 0;';
      nav.appendChild(hr);
      return;
    }
    const el = document.createElement('div');
    el.className = `nav-item${item.id === state.page ? ' active' : ''}`;
    el.setAttribute('data-page', item.id);
    el.setAttribute('data-label', item.label);
    el.innerHTML = `${item.icon}<span class="nav-label">${item.label}</span>`;
    el.addEventListener('click', () => navigate(item.id));
    nav.appendChild(el);
  });
}

/* ─── Navigation ─────────────────────────────────────────────────────────── */
const PAGE_TITLES = {
  dashboard: 'Dashboard', customers: 'Customers', leads: 'Leads',
  opportunities: 'Opportunities', remodules: 'Remodule',
  inventory: 'Inventory', reports: 'Reports', profile: 'Profile',
  users: 'Team Members', 'audit-logs': 'Audit Logs',
};

async function navigate(page) {
  state.page = page;
  // Destroy old charts
  Object.values(state.charts).forEach(c => c?.destroy?.());
  state.charts = {};
  // Update nav active state
  $$('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  $('#topbar-title').textContent = PAGE_TITLES[page] || page;
  $('#content').innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
  try {
    await PAGES[page]?.();
  } catch (e) {
    $('#content').innerHTML = `<div class="empty-state"><p style="color:#dc2626">${e.message}</p></div>`;
  }
}

/* ═══════════════════════════════════════════════════════ PAGE RENDERERS ═══ */
const PAGES = {
  dashboard:     renderDashboard,
  customers:     renderCustomers,
  leads:         renderLeads,
  opportunities: renderOpportunities,
  remodules:     renderRemodules,
  inventory:     renderInventory,
  reports:       renderReports,
  profile:       renderProfile,
  users:         renderUsers,
  'audit-logs':  renderAuditLogs,
};

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
async function renderDashboard() {
  const { data } = await api.get('/reports/summary');
  const isManager = state.user.role === 'manager';
  const content = $('#content');

  if (isManager) {
    content.innerHTML = `
      <div class="kpi-grid">
        ${kpiCard('Total Customers', data.totalCustomers, svgPeople(), '#f59e0b', 'rgba(245,158,11,0.1)', 'up')}
        ${kpiCard('Total Leads', data.totalLeads, svgFunnel(), '#fb923c', 'rgba(251,146,60,0.1)', 'up')}
        ${kpiCard('Total Revenue', fmtCurrency(data.totalRevenue), svgCoin(), '#22c55e', 'rgba(34,197,94,0.1)', 'up')}
        ${kpiCard('Active Team', data.employeePerf?.length || '—', svgUsersGroup(), '#6366f1', 'rgba(99,102,241,0.1)', 'neutral')}
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Customer Growth (6 months)</div>
          <div class="chart-wrap"><canvas id="chart-growth"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Employee Performance</div>
          <div class="chart-wrap"><canvas id="chart-perf"></canvas></div>
        </div>
      </div>`;
    renderGrowthChart(data.customerGrowth || []);
    renderPerfChart(data.employeePerf || []);
  } else {
    content.innerHTML = `
      <div class="kpi-grid">
        ${kpiCard('New Customers (Month)', data.newCustomersThisMonth, svgPeople(), '#f59e0b', 'rgba(245,158,11,0.1)', 'up')}
        ${kpiCard('Active Leads', data.activeLeads, svgFunnel(), '#fb923c', 'rgba(251,146,60,0.1)', 'neutral')}
        ${kpiCard('Follow-up Tasks', data.followUpTasks, svgCalCheck(), '#6366f1', 'rgba(99,102,241,0.1)', data.followUpTasks > 5 ? 'down' : 'up')}
        ${kpiCard('Open Opportunities', data.totalOpportunities, svgBriefcase(), '#22c55e', 'rgba(34,197,94,0.1)', 'neutral')}
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Sales Pipeline</div>
          <div class="chart-wrap"><canvas id="chart-pipeline"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Lead Status Breakdown</div>
          <div class="chart-wrap"><canvas id="chart-leads"></canvas></div>
        </div>
      </div>`;
    renderPipelineChart(data.oppsByStage || []);
    renderLeadsChart(data.leadsByStatus || []);
  }
}

function kpiCard(label, value, icon, color, bg, trend) {
  const trendArrow = trend === 'up'
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/></svg>`
    : trend === 'down'
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>`;
  return `
    <div class="kpi-card">
      <div class="kpi-icon-chip" style="background:${bg};color:${color}">${icon}</div>
      <div class="kpi-number">${value ?? '—'}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-trend ${trend}">${trendArrow} ${trend === 'up' ? 'Growing' : trend === 'down' ? 'Attention' : 'Stable'}</div>
      <div class="kpi-glow" style="background:${color}"></div>
    </div>`;
}

const AMBER_PALETTE = ['#f59e0b','#fb923c','#fde68a','#d97706','#fcd34d','#fbbf24'];

function renderGrowthChart(data) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels = data.map(d => months[d._id.month - 1]);
  const values = data.map(d => d.count);
  const ctx = $('#chart-growth');
  if (!ctx) return;
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(245,158,11,0.35)');
  gradient.addColorStop(1, 'rgba(245,158,11,0)');
  state.charts.growth = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: '#f59e0b', backgroundColor: gradient, tension: 0.4, fill: true, pointBackgroundColor: '#f59e0b', pointRadius: 4 }] },
    options: chartOpts(),
  });
}

function renderPerfChart(data) {
  const ctx = $('#chart-perf');
  if (!ctx) return;
  state.charts.perf = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.name),
      datasets: [{ data: data.map(d => d.customerCount), backgroundColor: AMBER_PALETTE, borderRadius: 8 }],
    },
    options: { ...chartOpts(), plugins: { legend: { display: false } } },
  });
}

function renderPipelineChart(data) {
  const ctx = $('#chart-pipeline');
  if (!ctx) return;
  state.charts.pipeline = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d._id),
      datasets: [{ data: data.map(d => d.total || d.count), backgroundColor: AMBER_PALETTE, borderWidth: 0, hoverOffset: 8 }],
    },
    options: { ...chartOpts(), cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } },
  });
}

function renderLeadsChart(data) {
  const ctx = $('#chart-leads');
  if (!ctx) return;
  state.charts.leads = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d._id),
      datasets: [{ data: data.map(d => d.count), backgroundColor: AMBER_PALETTE, borderRadius: 8 }],
    },
    options: { ...chartOpts(), indexAxis: 'y', plugins: { legend: { display: false } } },
  });
}

function chartOpts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#a8a29e' : '#78716c';
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#f9fafb', bodyColor: '#d1d5db', cornerRadius: 8, padding: 10 },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
    },
  };
}

/* ─── Customers ──────────────────────────────────────────────────────────── */
async function renderCustomers() {
  const [{ data: cData }, { data: uData }] = await Promise.all([
    api.get('/customers'),
    api.get('/users'),
  ]);
  state.customers = cData.customers;
  state.users = uData.users;

  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Customers</h1>
        <p class="section-sub">${cData.customers.length} total customers</p>
      </div>
      <button class="btn btn-primary" onclick="openCustomerModal()">
        ${svgPlus()} Add Customer
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-filter-wrap">
          ${svgSearch()}
          <input class="table-filter" id="cust-search" type="text" placeholder="Search customers..." oninput="filterCustomers()" />
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>Name</th><th>Company</th><th>Email</th><th>Phone</th>
            <th>Status</th><th>Assigned To</th><th>Added</th><th>Actions</th>
          </tr></thead>
          <tbody id="cust-tbody">${buildCustomerRows(cData.customers)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildCustomerRows(list) {
  if (!list.length) return `<tr><td colspan="8"><div class="empty-state">${svgPeople()}<h3>No customers yet</h3><p>Add your first customer to get started.</p></div></td></tr>`;
  return list.map((c, i) => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td class="td-muted">${c.company || '—'}</td>
      <td class="td-muted">${c.email}</td>
      <td class="td-muted">${c.phone || '—'}</td>
      <td>${pill(c.status)}</td>
      <td class="td-muted">${c.assignedTo?.name || '—'}</td>
      <td class="td-muted">${fmtDate(c.createdAt)}</td>
      <td><div class="td-actions">${actionBtns(`openCustomerModal('${c._id}')`, `deleteRecord('customers','${c._id}','Customer','renderCustomers')`)}</div></td>
    </tr>`).join('');
}

function filterCustomers() {
  const q = $('#cust-search').value.toLowerCase();
  const filtered = state.customers.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  );
  $('#cust-tbody').innerHTML = buildCustomerRows(filtered);
}

async function openCustomerModal(id) {
  const c = id ? state.customers.find(x => x._id === id) : null;
  const userOpts = state.users.map(u => `<option value="${u._id}" ${c?.assignedTo?._id === u._id ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('');
  openModal(id ? 'Edit Customer' : 'Add Customer', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-control" id="f-name" value="${c?.name || ''}" placeholder="Jane Smith" />
      </div>
      <div class="form-group">
        <label class="form-label">Company</label>
        <input class="form-control" id="f-company" value="${c?.company || ''}" placeholder="Acme Ltd" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Email *</label>
      <input class="form-control" id="f-email" type="email" value="${c?.email || ''}" placeholder="jane@acme.com" />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="f-phone" value="${c?.phone || ''}" placeholder="+1-555-0100" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="f-status">
          ${['active','inactive','prospect'].map(s => `<option value="${s}" ${c?.status === s ? 'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Assign To</label>
      <select class="form-control" id="f-assignedTo"><option value="">— Unassigned —</option>${userOpts}</select>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveCustomer('${id || ''}')">Save Customer</button>`
  );
}

async function saveCustomer(id) {
  const body = {
    name: $('#f-name').value.trim(),
    company: $('#f-company').value.trim(),
    email: $('#f-email').value.trim(),
    phone: $('#f-phone').value.trim(),
    status: $('#f-status').value,
    assignedTo: $('#f-assignedTo').value || undefined,
  };
  if (!body.name || !body.email) return toast('Name and email are required', 'error');
  try {
    if (id) await api.patch(`/customers/${id}`, body);
    else await api.post('/customers', body);
    toast(id ? 'Customer updated' : 'Customer added');
    closeModal();
    await renderCustomers();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Leads ──────────────────────────────────────────────────────────────── */
async function renderLeads() {
  const { data } = await api.get('/leads');
  state.leads = data.leads;
  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Leads</h1>
        <p class="section-sub">${data.leads.length} total leads</p>
      </div>
      <button class="btn btn-primary" onclick="openLeadModal()">
        ${svgPlus()} Add Lead
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-filter-wrap">${svgSearch()}
          <input class="table-filter" id="lead-search" type="text" placeholder="Search leads..." oninput="filterLeads()" />
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>Name</th><th>Company</th><th>Source</th><th>Status</th>
            <th>Value</th><th>Owner</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody id="lead-tbody">${buildLeadRows(data.leads)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildLeadRows(list) {
  if (!list.length) return `<tr><td colspan="8"><div class="empty-state">${svgFunnel()}<h3>No leads yet</h3></div></td></tr>`;
  return list.map(l => `
    <tr>
      <td><strong>${l.name}</strong></td>
      <td class="td-muted">${l.company || '—'}</td>
      <td class="td-muted">${l.source || '—'}</td>
      <td>${pill(l.status)}</td>
      <td>${fmtCurrency(l.value)}</td>
      <td class="td-muted">${l.owner?.name || '—'}</td>
      <td class="td-muted">${fmtDate(l.createdAt)}</td>
      <td><div class="td-actions">${actionBtns(`openLeadModal('${l._id}')`, `deleteRecord('leads','${l._id}','Lead','renderLeads')`)}</div></td>
    </tr>`).join('');
}

function filterLeads() {
  const q = $('#lead-search').value.toLowerCase();
  const filtered = state.leads.filter(l => l.name.toLowerCase().includes(q) || (l.company||'').toLowerCase().includes(q));
  $('#lead-tbody').innerHTML = buildLeadRows(filtered);
}

async function openLeadModal(id) {
  const l = id ? state.leads.find(x => x._id === id) : null;
  openModal(id ? 'Edit Lead' : 'Add Lead', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Lead Name *</label>
        <input class="form-control" id="f-name" value="${l?.name || ''}" placeholder="Company or Contact" />
      </div>
      <div class="form-group">
        <label class="form-label">Company</label>
        <input class="form-control" id="f-company" value="${l?.company || ''}" placeholder="Acme Ltd" />
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="f-email" type="email" value="${l?.email || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="f-phone" value="${l?.phone || ''}" />
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Source</label>
        <input class="form-control" id="f-source" value="${l?.source || ''}" placeholder="Website, Referral..." />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="f-status">
          ${['new','contacted','qualified','lost'].map(s => `<option value="${s}" ${l?.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Estimated Value ($)</label>
      <input class="form-control" id="f-value" type="number" value="${l?.value || 0}" min="0" />
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${l?.notes || ''}</textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveLead('${id || ''}')">Save Lead</button>`
  );
}

async function saveLead(id) {
  const body = {
    name: $('#f-name').value.trim(),
    company: $('#f-company').value.trim(),
    email: $('#f-email').value.trim(),
    phone: $('#f-phone').value.trim(),
    source: $('#f-source').value.trim(),
    status: $('#f-status').value,
    value: parseFloat($('#f-value').value) || 0,
    notes: $('#f-notes').value.trim(),
  };
  if (!body.name) return toast('Lead name is required', 'error');
  try {
    if (id) await api.patch(`/leads/${id}`, body);
    else await api.post('/leads', body);
    toast(id ? 'Lead updated' : 'Lead added');
    closeModal();
    await renderLeads();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Opportunities ──────────────────────────────────────────────────────── */
async function renderOpportunities() {
  const [{ data: oData }, { data: cData }] = await Promise.all([
    api.get('/opportunities'),
    api.get('/customers'),
  ]);
  state.opportunities = oData.opportunities;
  state.customers = cData.customers;
  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Opportunities</h1>
        <p class="section-sub">${oData.opportunities.length} open opportunities</p>
      </div>
      <button class="btn btn-primary" onclick="openOppModal()">${svgPlus()} Add Opportunity</button>
    </div>
    <div class="table-wrap">
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>Title</th><th>Customer</th><th>Stage</th><th>Amount</th>
            <th>Owner</th><th>Close Date</th><th>Actions</th>
          </tr></thead>
          <tbody>${buildOppRows(oData.opportunities)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildOppRows(list) {
  if (!list.length) return `<tr><td colspan="7"><div class="empty-state">${svgBriefcase()}<h3>No opportunities yet</h3></div></td></tr>`;
  return list.map(o => `
    <tr>
      <td><strong>${o.title}</strong></td>
      <td class="td-muted">${o.customer?.name || '—'}</td>
      <td>${pill(o.stage)}</td>
      <td>${fmtCurrency(o.amount)}</td>
      <td class="td-muted">${o.owner?.name || '—'}</td>
      <td class="td-muted">${fmtDate(o.closeDate)}</td>
      <td><div class="td-actions">${actionBtns(`openOppModal('${o._id}')`, `deleteRecord('opportunities','${o._id}','Opportunity','renderOpportunities')`)}</div></td>
    </tr>`).join('');
}

async function openOppModal(id) {
  const o = id ? state.opportunities.find(x => x._id === id) : null;
  const custOpts = state.customers.map(c => `<option value="${c._id}" ${o?.customer?._id === c._id ? 'selected':''}>${c.name}</option>`).join('');
  openModal(id ? 'Edit Opportunity' : 'Add Opportunity', `
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-control" id="f-title" value="${o?.title || ''}" placeholder="Q3 Bulk Order – Acme" />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Customer *</label>
        <select class="form-control" id="f-customer"><option value="">— Select —</option>${custOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Stage</label>
        <select class="form-control" id="f-stage">
          ${['prospecting','proposal','negotiation','won','lost'].map(s => `<option value="${s}" ${o?.stage===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Amount ($)</label>
        <input class="form-control" id="f-amount" type="number" value="${o?.amount || 0}" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Close Date</label>
        <input class="form-control" id="f-closeDate" type="date" value="${o?.closeDate ? o.closeDate.slice(0,10) : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-control" id="f-notes" rows="2">${o?.notes || ''}</textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveOpp('${id || ''}')">Save</button>`
  );
}

async function saveOpp(id) {
  const body = {
    title: $('#f-title').value.trim(),
    customer: $('#f-customer').value,
    stage: $('#f-stage').value,
    amount: parseFloat($('#f-amount').value) || 0,
    closeDate: $('#f-closeDate').value || undefined,
    notes: $('#f-notes').value.trim(),
  };
  if (!body.title || !body.customer) return toast('Title and customer are required', 'error');
  try {
    if (id) await api.patch(`/opportunities/${id}`, body);
    else await api.post('/opportunities', body);
    toast(id ? 'Opportunity updated' : 'Opportunity added');
    closeModal();
    await renderOpportunities();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Remodule ───────────────────────────────────────────────────────────── */
async function renderRemodules() {
  const { data } = await api.get('/remodules');
  state.remodules = data.remodules;
  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Remodule</h1>
        <p class="section-sub">Calls, emails, meetings & tasks</p>
      </div>
      <button class="btn btn-primary" onclick="openRemoduleModal()">${svgPlus()} Log Remodule</button>
    </div>
    <div class="table-wrap">
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>Type</th><th>Note</th><th>Due Date</th>
            <th>Completed</th><th>Owner</th><th>Actions</th>
          </tr></thead>
          <tbody>${buildRemoduleRows(data.remodules)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildRemoduleRows(list) {
  if (!list.length) return `<tr><td colspan="6"><div class="empty-state">${svgCalCheck()}<h3>No remodules yet</h3></div></td></tr>`;
  return list.map(a => `
    <tr>
      <td>${pill(a.type)}</td>
      <td>${a.note || '—'}</td>
      <td class="td-muted">${fmtDate(a.dueDate)}</td>
      <td>
        <div class="check-toggle ${a.completed ? 'checked' : ''}" onclick="toggleRemodule('${a._id}', ${!a.completed})"></div>
      </td>
      <td class="td-muted">${a.owner?.name || '—'}</td>
      <td><div class="td-actions">${actionBtns(`openRemoduleModal('${a._id}')`, `deleteRecord('remodules','${a._id}','Remodule','renderRemodules')`)}</div></td>
    </tr>`).join('');
}

async function toggleRemodule(id, completed) {
  try {
    await api.patch(`/remodules/${id}`, { completed });
    await renderRemodules();
  } catch(e) { toast(e.message, 'error'); }
}

async function openRemoduleModal(id) {
  const a = id ? state.remodules.find(x => x._id === id) : null;
  openModal(id ? 'Edit Remodule' : 'Log Remodule', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Type *</label>
        <select class="form-control" id="f-type">
          ${['call','email','meeting','task'].map(t => `<option value="${t}" ${a?.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input class="form-control" id="f-dueDate" type="date" value="${a?.dueDate ? a.dueDate.slice(0,10) : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Note</label>
      <textarea class="form-control" id="f-note" rows="3">${a?.note || ''}</textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveRemodule('${id || ''}')">Save</button>`
  );
}

async function saveRemodule(id) {
  const body = {
    type: $('#f-type').value,
    note: $('#f-note').value.trim(),
    dueDate: $('#f-dueDate').value || undefined,
  };
  try {
    if (id) await api.patch(`/remodules/${id}`, body);
    else await api.post('/remodules', body);
    toast(id ? 'Remodule updated' : 'Remodule logged');
    closeModal();
    await renderRemodules();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Inventory ──────────────────────────────────────────────────────────── */
async function renderInventory() {
  const { data } = await api.get('/inventory');
  state.inventory = data.items;
  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Inventory</h1>
        <p class="section-sub">${data.items.length} items in stock</p>
      </div>
      <button class="btn btn-primary" onclick="openInventoryModal()">${svgPlus()} Add Item</button>
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="table-filter-wrap">${svgSearch()}
          <input class="table-filter" id="inv-search" type="text" placeholder="Search inventory..." oninput="filterInventory()" />
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>SKU</th><th>Product Name</th><th>Category</th>
            <th>Qty</th><th>Price</th><th>Added</th><th>Actions</th>
          </tr></thead>
          <tbody id="inv-tbody">${buildInventoryRows(data.items)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildInventoryRows(list) {
  if (!list.length) return `<tr><td colspan="7"><div class="empty-state">${svgBox()}<h3>No inventory items</h3></div></td></tr>`;
  return list.map(item => {
    const lowStock = item.quantity < 20;
    return `
      <tr>
        <td><code style="font-size:12px;background:var(--bg-input);padding:2px 6px;border-radius:4px">${item.sku}</code></td>
        <td><strong>${item.productName}</strong></td>
        <td class="td-muted">${item.category || '—'}</td>
        <td>
          <span style="font-weight:600;color:${lowStock ? '#dc2626' : 'inherit'}">${item.quantity}</span>
          ${lowStock ? `<span class="pill pill-inactive" style="margin-left:6px;font-size:10px">Low</span>` : ''}
        </td>
        <td>${fmtCurrency(item.price)}</td>
        <td class="td-muted">${fmtDate(item.createdAt)}</td>
        <td><div class="td-actions">${actionBtns(`openInventoryModal('${item._id}')`, `deleteRecord('inventory','${item._id}','Item','renderInventory')`)}</div></td>
      </tr>`;
  }).join('');
}

function filterInventory() {
  const q = $('#inv-search').value.toLowerCase();
  const filtered = state.inventory.filter(i =>
    i.sku.toLowerCase().includes(q) ||
    i.productName.toLowerCase().includes(q) ||
    (i.category||'').toLowerCase().includes(q)
  );
  $('#inv-tbody').innerHTML = buildInventoryRows(filtered);
}

async function openInventoryModal(id) {
  const item = id ? state.inventory.find(x => x._id === id) : null;
  openModal(id ? 'Edit Item' : 'Add Inventory Item', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">SKU *</label>
        <input class="form-control" id="f-sku" value="${item?.sku || ''}" placeholder="HOD-BLK-L" ${id ? 'readonly' : ''} />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-control" id="f-category" value="${item?.category || ''}" placeholder="Hoodies, Tees..." />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Product Name *</label>
      <input class="form-control" id="f-productName" value="${item?.productName || ''}" placeholder="Classic Hoodie Black" />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-control" id="f-quantity" type="number" value="${item?.quantity ?? 0}" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Price ($) *</label>
        <input class="form-control" id="f-price" type="number" step="0.01" value="${item?.price ?? 0}" min="0" />
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveInventory('${id || ''}')">Save Item</button>`
  );
}

async function saveInventory(id) {
  const body = {
    sku: $('#f-sku').value.trim().toUpperCase(),
    productName: $('#f-productName').value.trim(),
    category: $('#f-category').value.trim(),
    quantity: parseInt($('#f-quantity').value) || 0,
    price: parseFloat($('#f-price').value) || 0,
  };
  if (!body.sku || !body.productName || body.price == null) return toast('SKU, name and price are required', 'error');
  try {
    if (id) await api.patch(`/inventory/${id}`, body);
    else await api.post('/inventory', body);
    toast(id ? 'Item updated' : 'Item added');
    closeModal();
    await renderInventory();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Reports ────────────────────────────────────────────────────────────── */
async function renderReports() {
  const { data } = await api.get('/reports/summary');
  const isManager = state.user.role === 'manager';
  $('#content').innerHTML = `
    <div class="section-header">
      <div><h1 class="section-title">Reports</h1><p class="section-sub">Business overview & analytics</p></div>
    </div>
    <div class="kpi-grid" style="margin-bottom:28px">
      ${kpiCard('Total Customers', data.totalCustomers, svgPeople(), '#f59e0b', 'rgba(245,158,11,0.1)', 'up')}
      ${kpiCard('Total Leads', data.totalLeads, svgFunnel(), '#fb923c', 'rgba(251,146,60,0.1)', 'neutral')}
      ${kpiCard('Revenue (Won)', fmtCurrency(data.totalRevenue), svgCoin(), '#22c55e', 'rgba(34,197,94,0.1)', 'up')}
      ${kpiCard('Open Remodules', data.followUpTasks, svgCalCheck(), '#6366f1', 'rgba(99,102,241,0.1)', 'neutral')}
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Lead Status Breakdown</div>
        <div class="chart-wrap"><canvas id="chart-leads-rpt"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Opportunity Pipeline</div>
        <div class="chart-wrap"><canvas id="chart-opp-rpt"></canvas></div>
      </div>
      ${isManager ? `<div class="chart-card">
        <div class="chart-title">Customer Growth (6 months)</div>
        <div class="chart-wrap"><canvas id="chart-growth-rpt"></canvas></div>
      </div>` : ''}
      ${isManager && data.employeePerf?.length ? `<div class="chart-card">
        <div class="chart-title">Employee Performance</div>
        <div class="chart-wrap"><canvas id="chart-perf-rpt"></canvas></div>
      </div>` : ''}
    </div>`;

  const leadsCtx = $('#chart-leads-rpt');
  if (leadsCtx) state.charts.leads_rpt = new Chart(leadsCtx, {
    type: 'doughnut',
    data: { labels: data.leadsByStatus.map(d => d._id), datasets: [{ data: data.leadsByStatus.map(d => d.count), backgroundColor: AMBER_PALETTE, borderWidth: 0 }] },
    options: { ...chartOpts(), cutout: '60%', plugins: { legend: { position: 'right' } } },
  });
  const oppCtx = $('#chart-opp-rpt');
  if (oppCtx) state.charts.opp_rpt = new Chart(oppCtx, {
    type: 'bar',
    data: { labels: data.oppsByStage.map(d => d._id), datasets: [{ data: data.oppsByStage.map(d => d.total || d.count), backgroundColor: AMBER_PALETTE, borderRadius: 8 }] },
    options: { ...chartOpts(), plugins: { legend: { display: false } } },
  });
  if (isManager) {
    const growthCtx = $('#chart-growth-rpt');
    if (growthCtx) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const gradient = growthCtx.getContext('2d').createLinearGradient(0,0,0,220);
      gradient.addColorStop(0,'rgba(245,158,11,0.35)');
      gradient.addColorStop(1,'rgba(245,158,11,0)');
      state.charts.growth_rpt = new Chart(growthCtx, {
        type: 'line',
        data: { labels: data.customerGrowth.map(d => months[d._id.month-1]), datasets: [{ data: data.customerGrowth.map(d => d.count), borderColor: '#f59e0b', backgroundColor: gradient, tension: 0.4, fill: true, pointBackgroundColor: '#f59e0b', pointRadius: 4 }] },
        options: { ...chartOpts(), plugins: { legend: { display: false } } },
      });
    }
    const perfCtx = $('#chart-perf-rpt');
    if (perfCtx) state.charts.perf_rpt = new Chart(perfCtx, {
      type: 'bar',
      data: { labels: data.employeePerf.map(d => d.name), datasets: [{ data: data.employeePerf.map(d => d.customerCount), backgroundColor: AMBER_PALETTE, borderRadius: 8 }] },
      options: { ...chartOpts(), plugins: { legend: { display: false } } },
    });
  }
}

/* ─── Profile ────────────────────────────────────────────────────────────── */
async function renderProfile() {
  const u = state.user;
  $('#content').innerHTML = `
    <div class="card" style="max-width:560px">
      <div class="profile-header">
        <div class="profile-avatar-lg">${initials(u.name)}</div>
        <div class="profile-info">
          <h2>${u.name}</h2>
          <p>${u.email}</p>
          <span class="role-badge ${u.role}" style="display:inline-block;margin-top:6px">${u.role}</span>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--border);margin:24px 0" />
      <h3 style="font-family:Sora,sans-serif;font-size:15px;font-weight:700;margin-bottom:16px">Change Password</h3>
      <div class="form-group">
        <label class="form-label">New Password</label>
        <input class="form-control" id="p-new" type="password" placeholder="Min 8 characters" />
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password</label>
        <input class="form-control" id="p-confirm" type="password" placeholder="Repeat password" />
      </div>
      <button class="btn btn-primary" onclick="changePassword()">Update Password</button>
    </div>`;
}

async function changePassword() {
  const np = $('#p-new').value, cp = $('#p-confirm').value;
  if (!np) return toast('Enter a new password', 'error');
  if (np !== cp) return toast('Passwords do not match', 'error');
  if (np.length < 8) return toast('Password must be at least 8 characters', 'error');
  try {
    await api.patch(`/users/${state.user._id}`, { password: np });
    toast('Password updated');
    $('#p-new').value = ''; $('#p-confirm').value = '';
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Users (Manager only) ───────────────────────────────────────────────── */
async function renderUsers() {
  const { data } = await api.get('/users');
  state.users = data.users;
  $('#content').innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Team Members</h1>
        <p class="section-sub">${data.users.length} staff accounts</p>
      </div>
      <button class="btn btn-primary" onclick="openUserModal()">${svgPlus()} Add User</button>
    </div>
    <div class="table-wrap">
      <div class="table-responsive">
        <table>
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>${buildUserRows(data.users)}</tbody>
        </table>
      </div>
    </div>`;
}

function buildUserRows(list) {
  if (!list.length) return `<tr><td colspan="6"><div class="empty-state">${svgUsersGroup()}<h3>No users</h3></div></td></tr>`;
  return list.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="user-avatar" style="width:32px;height:32px;font-size:12px">${initials(u.name)}</div>
          <strong>${u.name}</strong>
        </div>
      </td>
      <td class="td-muted">${u.email}</td>
      <td>${pill(u.role)}</td>
      <td>${pill(u.isActive ? 'active' : 'inactive')}</td>
      <td class="td-muted">${fmtDate(u.createdAt)}</td>
      <td><div class="td-actions">${actionBtns(`openUserModal('${u._id}')`, `deleteRecord('users','${u._id}','User','renderUsers')`)}</div></td>
    </tr>`).join('');
}

async function openUserModal(id) {
  const u = id ? state.users.find(x => x._id === id) : null;
  openModal(id ? 'Edit User' : 'Add Team Member', `
    <div class="form-group">
      <label class="form-label">Full Name *</label>
      <input class="form-control" id="f-name" value="${u?.name || ''}" placeholder="Jane Smith" />
    </div>
    <div class="form-group">
      <label class="form-label">Email *</label>
      <input class="form-control" id="f-email" type="email" value="${u?.email || ''}" placeholder="jane@crm.test" ${id ? 'readonly' : ''} />
    </div>
    ${!id ? `<div class="form-group">
      <label class="form-label">Password *</label>
      <input class="form-control" id="f-password" type="password" placeholder="Min 8 characters" />
    </div>` : ''}
    <div class="form-group">
      <label class="form-label">Role</label>
      <select class="form-control" id="f-role">
        <option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option>
        <option value="manager" ${u?.role==='manager'?'selected':''}>Manager</option>
      </select>
    </div>
    ${id ? `<div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-control" id="f-isActive">
        <option value="true" ${u?.isActive?'selected':''}>Active</option>
        <option value="false" ${!u?.isActive?'selected':''}>Inactive</option>
      </select>
    </div>` : ''}`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveUser('${id || ''}')">Save</button>`
  );
}

async function saveUser(id) {
  const body = {
    name: $('#f-name').value.trim(),
    role: $('#f-role').value,
  };
  if (!id) {
    body.email = $('#f-email').value.trim();
    body.password = $('#f-password')?.value;
    if (!body.name || !body.email || !body.password) return toast('Name, email and password are required', 'error');
  } else {
    const isActiveEl = $('#f-isActive');
    if (isActiveEl) body.isActive = isActiveEl.value === 'true';
  }
  try {
    if (id) await api.patch(`/users/${id}`, body);
    else await api.post('/users', body);
    toast(id ? 'User updated' : 'User created');
    closeModal();
    await renderUsers();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Audit Logs (Manager only) ─────────────────────────────────────────── */
async function renderAuditLogs() {
  const { data } = await api.get('/audit-logs?limit=100');
  $('#content').innerHTML = `
    <div class="section-header">
      <div><h1 class="section-title">Audit Logs</h1><p class="section-sub">${data.total} total events</p></div>
    </div>
    <div class="table-wrap">
      <div class="table-responsive">
        <table>
          <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
          <tbody>
            ${data.logs.length
              ? data.logs.map(l => `
                <tr>
                  <td>${l.user ? `<strong>${l.user.name}</strong><br><span class="td-muted" style="font-size:11px">${l.user.email}</span>` : '—'}</td>
                  <td><code style="font-size:12px;background:var(--bg-input);padding:2px 8px;border-radius:4px">${l.action}</code></td>
                  <td class="td-muted">${l.entity || '—'}</td>
                  <td class="td-muted">${new Date(l.timestamp).toLocaleString()}</td>
                </tr>`).join('')
              : `<tr><td colspan="4"><div class="empty-state"><h3>No audit events yet</h3></div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ─── Generic Delete ─────────────────────────────────────────────────────── */
async function deleteRecord(endpoint, id, label, reloadFn) {
  if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
  try {
    await api.delete(`/${endpoint}/${id}`);
    toast(`${label} deleted`);
    await PAGES[state.page]?.();
  } catch(e) { toast(e.message, 'error'); }
}

/* ─── Auth ───────────────────────────────────────────────────────────────── */
async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('crm-token', data.token);
  showApp();
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('crm-token');
  $('#app').classList.add('hidden');
  $('#login-page').classList.remove('hidden');
  toast('Logged out', 'info');
}

function showApp() {
  $('#login-page').classList.add('hidden');
  $('#app').classList.remove('hidden');
  // Update user chip
  $('#user-avatar-chip').textContent = initials(state.user.name);
  $('#user-name-chip').textContent = state.user.name;
  $('#role-badge-chip').textContent = state.user.role;
  $('#role-badge-chip').className = `role-badge ${state.user.role}`;
  buildNav();
  navigate('dashboard');
}

/* ─── Init ───────────────────────────────────────────────────────────────── */
function init() {
  // Theme
  const savedTheme = localStorage.getItem('crm-theme') || 'light';
  applyTheme(savedTheme);

  // Sidebar
  const collapsed = localStorage.getItem('crm-sidebar') === '1';
  if (collapsed) $('#sidebar').classList.add('collapsed');

  // Sidebar toggle
  $('#sidebar-toggle').addEventListener('click', toggleSidebar);

  // Theme toggle
  $('#theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
    // Re-render charts with new theme colors
    if (state.page === 'dashboard' || state.page === 'reports') navigate(state.page);
  });

  // Logout
  $('#logout-btn').addEventListener('click', logout);

  // Modal close
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', (e) => { if (e.target === $('#modal-overlay')) closeModal(); });

  // Login form
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-btn');
    const err = $('#login-error');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    err.classList.add('hidden');
    try {
      await login($('#login-email').value.trim(), $('#login-password').value);
    } catch (ex) {
      err.textContent = ex.message || 'Invalid credentials';
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });

  // Auto-login from stored token
  const storedToken = localStorage.getItem('crm-token');
  if (storedToken) {
    state.token = storedToken;
    api.get('/auth/me').then(({ data }) => {
      state.user = data.user;
      showApp();
    }).catch(() => {
      localStorage.removeItem('crm-token');
    });
  }
}

/* ═══════════════════════════════════════════════════════════ SVG ICONS ════ */
function svgGrid() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>`; }
function svgPeople() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>`; }
function svgFunnel() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>`; }
function svgBriefcase() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>`; }
function svgCalCheck() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"/></svg>`; }
function svgBox() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>`; }
function svgChart() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`; }
function svgUsersGroup() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>`; }
function svgShield() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`; }
function svgUser() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`; }
function svgPlus() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`; }
function svgSearch() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/></svg>`; }
function svgCoin() { return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`; }

/* ─── Kick off ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
