export const statuses = ['Aktif', 'Proses', 'Selesai', 'Arsip'];

export function validateUser(payload, mode = 'register') {
  const errors = [];
  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (mode === 'register' && name.length < 2) errors.push('Nama minimal 2 karakter.');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Email tidak valid.');
  if (password.length < (mode === 'register' ? 6 : 1)) errors.push('Password wajib diisi minimal 6 karakter.');

  return { valid: errors.length === 0, errors, value: { name, email, password } };
}

export function validateItem(payload) {
  const name = String(payload.name ?? '').trim();
  const category = String(payload.category ?? '').trim();
  const status = String(payload.status ?? 'Aktif');
  const value = Number(payload.value ?? 0);
  const description = String(payload.description ?? '').trim();
  const errors = [];

  if (name.length < 2) errors.push('Nama data minimal 2 karakter.');
  if (category.length < 2) errors.push('Kategori minimal 2 karakter.');
  if (!statuses.includes(status)) errors.push('Status tidak valid.');
  if (!Number.isInteger(value) || value < 0) errors.push('Nilai harus angka bulat dan tidak boleh negatif.');
  if (description.length > 500) errors.push('Deskripsi maksimal 500 karakter.');

  return { valid: errors.length === 0, errors, value: { name, category, status, value, description } };
}
