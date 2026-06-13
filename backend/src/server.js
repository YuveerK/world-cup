'use strict';

const { PORT } = require('./config/env');
const logger = require('./shared/logging/logger');
const app = require('./app');
const poller = require('./jobs/scoringPoller');

const server = app.listen(PORT, () => {
  logger.info(`World Cup 2026 API → http://localhost:${PORT}`);
  logger.info('  GET  /health                          health check');
  logger.info('  GET  /fixtures                         all fixtures');
  logger.info('  GET  /fixtures/:id/stats               match lineup + events');
  logger.info('  POST /auth/signup                      register');
  logger.info('  POST /auth/login                       login');
  logger.info('  GET  /auth/me                          current user');
  logger.info('  POST /predictions/:matchId             submit prediction');
  logger.info('  GET  /predictions/my                   my predictions');
  logger.info('  GET  /predictions/my/points            my points breakdown');
  logger.info('  GET  /leaderboard                      ranked leaderboard');
  logger.info('  POST /scoring/trigger                  manually trigger scoring');
});

poller.start();

function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  poller.stop();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
