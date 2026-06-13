const fs = require('fs');
const path = require('path');

const BOOTSTRAP_ADMIN_USERNAME = process.env.ADMIN_BOOTSTRAP_USERNAME || 'UvKal_zA';
const ADMIN_IDS_FILE = process.env.ADMIN_IDS_FILE || path.join(__dirname, '..', '.admin-users.json');

function normalizeId(id) {
  return id === null || id === undefined ? '' : String(id);
}

function idsFromEnv() {
  return (process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function readStoredIds() {
  try {
    const raw = fs.readFileSync(ADMIN_IDS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.adminUserIds) ? parsed.adminUserIds.map(normalizeId).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids) {
  const uniqueIds = [...new Set(ids.map(normalizeId).filter(Boolean))];
  fs.writeFileSync(ADMIN_IDS_FILE, `${JSON.stringify({ adminUserIds: uniqueIds }, null, 2)}\n`);
}

function rememberAdminUser(user) {
  const id = normalizeId(user?.id);
  if (!id) return;

  const ids = readStoredIds();
  if (ids.includes(id)) return;

  try {
    writeStoredIds([...ids, id]);
  } catch (err) {
    console.warn('Could not persist admin user id:', err.message);
  }
}

function isAdminUser(user) {
  if (!user) return false;
  const id = normalizeId(user.id);
  if (user.isAdmin === true || user.is_admin === true) return true;
  if (id && idsFromEnv().includes(id)) return true;
  if (id && readStoredIds().includes(id)) return true;
  return user.username === BOOTSTRAP_ADMIN_USERNAME;
}

function hydrateAdminUser(user) {
  const isAdmin = isAdminUser(user);
  if (isAdmin) rememberAdminUser(user);
  return isAdmin;
}

module.exports = {
  BOOTSTRAP_ADMIN_USERNAME,
  hydrateAdminUser,
  isAdminUser,
  rememberAdminUser,
};
