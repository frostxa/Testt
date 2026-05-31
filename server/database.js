import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(__dirname, '..', 'data', 'database.json');

const initialState = {
  users: [],
  items: [],
  counters: {
    users: 1,
    items: 1
  }
};

export async function readDatabase() {
  try {
    const raw = await readFile(databasePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    await writeDatabase(initialState);
    return structuredClone(initialState);
  }
}

export async function writeDatabase(data) {
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function transaction(mutator) {
  const data = await readDatabase();
  const result = await mutator(data);
  await writeDatabase(data);
  return result;
}
