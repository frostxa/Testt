import test from 'node:test';
import assert from 'node:assert/strict';
import { validateItem, validateUser } from '../server/validation.js';

test('validasi login menerima email dan password demo', () => {
  const result = validateUser({ email: 'admin@frostxa.local', password: 'admin123' }, 'login');
  assert.equal(result.valid, true);
  assert.equal(result.value.email, 'admin@frostxa.local');
});

test('validasi register menolak password pendek', () => {
  const result = validateUser({ name: 'Admin', email: 'admin@frostxa.local', password: '123' }, 'register');
  assert.equal(result.valid, false);
});

test('validasi item mengubah nilai string menjadi number', () => {
  const result = validateItem({ name: 'Dashboard', category: 'Aplikasi', status: 'Aktif', value: '1500000', description: 'Data contoh' });
  assert.equal(result.valid, true);
  assert.equal(result.value.value, 1500000);
});
