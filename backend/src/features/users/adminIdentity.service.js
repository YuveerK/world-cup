'use strict';

function isAdminUser(user) {
  return user?.is_admin === true;
}

module.exports = { isAdminUser };
