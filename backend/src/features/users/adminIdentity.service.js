'use strict';

const fs = require('fs');
const path = require('path');
const { ADMIN_BOOTSTRAP_USERNAME, ADMIN_USER_IDS } = require('../../config/env');

// Legacy file written by the previous backend. Read-only in this service.
// Production deployments should set ADMIN_USER_IDS in the environment instead
// of relying on this file — file-based storage does not scale horizontally.
const ADMIN_IDS_FILE =
  process.env.ADMIN_IDS_FILE || path.join(__dirname, '..', '..', '..', '.admin-users.json');

function normalizeId(id) {
  return id === null || id === undefined ? '' : String(id);
}

function readStoredIds() {
  try {
    const raw = fs.readFileSync(ADMIN_IDS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.adminUserIds)
      ? parsed.adminUserIds.map(normalizeId).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function isAdminUser(user) {
  if (!user) return false;
  const id = normalizeId(user.id);
  if (user.isAdmin === true || user.is_admin === true) return true;
  if (id && ADMIN_USER_IDS.includes(id)) return true;
  if (id && readStoredIds().includes(id)) return true;
  return user.username === ADMIN_BOOTSTRAP_USERNAME;
}

module.exports = { isAdminUser, ADMIN_BOOTSTRAP_USERNAME };
