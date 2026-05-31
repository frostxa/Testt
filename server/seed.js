import { transaction } from './database.js';
import { hashPassword } from './security.js';

await transaction((db) => {
  let admin = db.users.find((user) => user.email === 'admin@frostxa.local');

  if (!admin) {
    admin = {
      id: db.counters.users++,
      name: 'Admin Frostxa',
      email: 'admin@frostxa.local',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(admin);
  }

  const adminItems = db.items.filter((item) => item.ownerId === admin.id);
  if (adminItems.length === 0) {
    db.items.push(
      {
        id: db.counters.items++,
        name: 'Landing Page 3D',
        category: 'Desain',
        status: 'Aktif',
        value: 8500000,
        description: 'Halaman promosi modern dengan elemen glassmorphism dan visual 3D.',
        ownerId: admin.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: db.counters.items++,
        name: 'API Inventori',
        category: 'Backend',
        status: 'Proses',
        value: 12500000,
        description: 'Endpoint CRUD, autentikasi token, dan validasi data.',
        ownerId: admin.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: db.counters.items++,
        name: 'Dashboard Operasional',
        category: 'Dashboard',
        status: 'Selesai',
        value: 16750000,
        description: 'Ringkasan KPI, tabel data, dan manajemen item.',
        ownerId: admin.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
  }
});

console.log('Database demo siap. Login: admin@frostxa.local / admin123');
