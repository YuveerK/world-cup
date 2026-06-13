'use strict';

function toUserDto(user, isAdmin = false) {
  return {
    id: user.id,
    username: user.username,
    isAdmin: Boolean(isAdmin || user.isAdmin),
    winner: user.pick1,
    pick1: user.pick1,
    pick2: user.pick2,
    winner_pts: user.winner_pts,
  };
}

module.exports = { toUserDto };
