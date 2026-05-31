const app = document.querySelector('#app');
const tokenKey = 'frostxa_token';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function h(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);
}

let state = {
  user: null,
  items: [],
  editingId: null,
  message: '',
  authMode: 'login'
};

function token() {
  return localStorage.getItem(tokenKey);
}

function setToken(value) {
  localStorage.setItem(tokenKey, value);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Permintaan gagal.' }));
    throw new Error(error.message ?? 'Permintaan gagal.');
  }

  if (response.status === 204) return null;
  return response.json();
}

async function loadItems() {
  const data = await request('/api/items');
  state.items = data.items;
}

function itemForm(item = {}) {
  return `
    <label>Nama Data<input name="name" value="${h(item.name)}" required /></label>
    <label>Kategori<input name="category" value="${h(item.category)}" required /></label>
    <label>Status
      <select name="status">
        ${['Aktif', 'Proses', 'Selesai', 'Arsip'].map((status) => `<option ${status === (item.status ?? 'Aktif') ? 'selected' : ''}>${status}</option>`).join('')}
      </select>
    </label>
    <label>Nilai<input type="number" name="value" value="${item.value ?? 0}" min="0" /></label>
    <label>Deskripsi<textarea name="description">${h(item.description)}</textarea></label>
  `;
}

function renderAuth() {
  app.className = 'auth-shell';
  app.innerHTML = `
    <section class="hero-card">
      <div class="orb orb-one"></div>
      <div class="orb orb-two"></div>
      <div class="hero-content">
        <span class="eyebrow">✦ Full Stack Modern</span>
        <h1>Aplikasi dashboard 3D untuk mengelola data bisnis.</h1>
        <p>Login aman, CRUD data, database file lokal, dan UI glassmorphism berbahasa Indonesia.</p>
        <div class="credential-box"><strong>Akun demo</strong><span>admin@frostxa.local / admin123</span></div>
      </div>
    </section>
    <form class="auth-card" id="auth-form">
      <div class="auth-icon">🛡️</div>
      <h2>${state.authMode === 'login' ? 'Masuk Dashboard' : 'Daftar Akun'}</h2>
      <p>Kelola data secara cepat dengan pengalaman modern.</p>
      ${state.authMode === 'register' ? '<label>Nama<input name="name" placeholder="Nama lengkap" /></label>' : ''}
      <label>Email<input name="email" type="email" value="admin@frostxa.local" /></label>
      <label>Password<input name="password" type="password" value="admin123" /></label>
      <button>${state.authMode === 'login' ? 'Login' : 'Daftar'}</button>
      <button class="link-button" type="button" id="switch-auth">${state.authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}</button>
      ${state.message ? `<p class="message">${state.message}</p>` : ''}
    </form>
  `;

  document.querySelector('#switch-auth').addEventListener('click', () => {
    state.authMode = state.authMode === 'login' ? 'register' : 'login';
    state.message = '';
    renderAuth();
  });

  document.querySelector('#auth-form').addEventListener('submit', handleAuth);
}

function renderDashboard() {
  const totalValue = state.items.reduce((sum, item) => sum + item.value, 0);
  const active = state.items.filter((item) => item.status === 'Aktif').length;
  const completed = state.items.filter((item) => item.status === 'Selesai').length;
  const editedItem = state.items.find((item) => item.id === state.editingId);

  app.className = 'app-shell';
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">◈ Frostxa</div>
      <nav><a class="active">▣ Dashboard</a><a>▤ Analitik</a><a>▥ Keamanan</a></nav>
      <button class="logout" id="logout">↩ Logout</button>
    </aside>
    <section class="dashboard">
      <header class="topbar"><div><span class="eyebrow">Dashboard Admin</span><h1>Halo, ${h(state.user.name)}</h1></div><div class="profile-pill">${h(state.user.role)}</div></header>
      <section class="stats-grid">
        <article class="stat-card"><span>Total Data</span><strong>${state.items.length}</strong></article>
        <article class="stat-card"><span>Nilai Proyek</span><strong>${currency.format(totalValue)}</strong></article>
        <article class="stat-card"><span>Aktif</span><strong>${active}</strong></article>
        <article class="stat-card"><span>Selesai</span><strong>${completed}</strong></article>
      </section>
      <section class="content-grid">
        <form class="panel form-panel" id="item-form">
          <h2>${state.editingId ? 'Edit Data' : 'Tambah Data'}</h2>
          ${itemForm(editedItem)}
          <div class="form-actions"><button>${state.editingId ? 'Update' : '+ Simpan'}</button>${state.editingId ? '<button type="button" class="secondary" id="cancel-edit">Batal</button>' : ''}</div>
          ${state.message ? `<p class="message">${state.message}</p>` : ''}
        </form>
        <section class="panel table-panel">
          <h2>Data Tersimpan</h2>
          <div class="table-wrap"><table><thead><tr><th>Nama</th><th>Kategori</th><th>Status</th><th>Nilai</th><th>Aksi</th></tr></thead><tbody>
            ${state.items.map((item) => `
              <tr>
                <td><strong>${h(item.name)}</strong><small>${h(item.description)}</small></td>
                <td>${h(item.category)}</td>
                <td><span class="status status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>${currency.format(item.value)}</td>
                <td class="actions"><button class="icon edit" data-id="${item.id}">✎</button><button class="icon danger delete" data-id="${item.id}">⌫</button></td>
              </tr>`).join('')}
          </tbody></table></div>
        </section>
      </section>
    </section>
  `;

  document.querySelector('#logout').addEventListener('click', () => {
    clearToken();
    state = { user: null, items: [], editingId: null, message: 'Anda sudah logout.', authMode: 'login' };
    renderAuth();
  });
  document.querySelector('#item-form').addEventListener('submit', handleItemSubmit);
  document.querySelector('#cancel-edit')?.addEventListener('click', () => { state.editingId = null; renderDashboard(); });
  document.querySelectorAll('.edit').forEach((button) => button.addEventListener('click', () => { state.editingId = Number(button.dataset.id); renderDashboard(); }));
  document.querySelectorAll('.delete').forEach((button) => button.addEventListener('click', () => removeItem(Number(button.dataset.id))));
}

async function handleAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const path = state.authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const response = await request(path, { method: 'POST', body: JSON.stringify(payload) });
    setToken(response.token);
    state.user = response.user;
    state.message = `Selamat datang, ${response.user.name}!`;
    await loadItems();
    renderDashboard();
  } catch (error) {
    state.message = error.message;
    renderAuth();
  }
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.value = Number(payload.value);

  try {
    if (state.editingId) {
      await request(`/api/items/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      state.message = 'Data berhasil diperbarui.';
    } else {
      await request('/api/items', { method: 'POST', body: JSON.stringify(payload) });
      state.message = 'Data baru berhasil ditambahkan.';
    }
    state.editingId = null;
    await loadItems();
  } catch (error) {
    state.message = error.message;
  }
  renderDashboard();
}

async function removeItem(id) {
  try {
    await request(`/api/items/${id}`, { method: 'DELETE' });
    state.message = 'Data berhasil dihapus.';
    await loadItems();
  } catch (error) {
    state.message = error.message;
  }
  renderDashboard();
}

async function bootstrap() {
  if (!token()) {
    renderAuth();
    return;
  }

  try {
    const data = await request('/api/auth/me');
    state.user = data.user;
    await loadItems();
    renderDashboard();
  } catch {
    clearToken();
    renderAuth();
  }
}

bootstrap();
