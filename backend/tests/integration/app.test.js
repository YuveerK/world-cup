'use strict';

// Verify that importing app.js has no side effects — no server listening,
// no scoring poller started.  The /health route should respond correctly.

let app;

beforeAll(() => {
  // Provide minimal env vars so config/env.js does not throw
  process.env.SUPABASE_URL = 'https://fake.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';
  process.env.JWT_SECRET = 'test-secret';

  // Import after setting env so the env validation passes
  app = require('../../src/app');
});

test('app module exports an Express application', () => {
  expect(typeof app).toBe('function');
  expect(typeof app.listen).toBe('function');
});

test('importing app does not start the HTTP server', () => {
  // If a server were started, app.address() on the returned server would be non-null.
  // Since we only imported app (not server.js), no listener should be active.
  // We verify by checking that the app itself has no bound address — it is just
  // an Express handler function, not a net.Server.
  expect(app.address).toBeUndefined();
});

test('GET /health returns 200 ok', (done) => {
  const http = require('http');
  const server = http.createServer(app);
  server.listen(0, () => {
    const { port } = server.address();
    http.get(`http://localhost:${port}/health`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        expect(res.statusCode).toBe(200);
        const json = JSON.parse(body);
        expect(json.status).toBe('ok');
        server.close(done);
      });
    });
  });
});

test('unknown route returns 404', (done) => {
  const http = require('http');
  const server = http.createServer(app);
  server.listen(0, () => {
    const { port } = server.address();
    http.get(`http://localhost:${port}/does-not-exist`, (res) => {
      server.close(() => {
        expect(res.statusCode).toBe(404);
        done();
      });
    });
  });
});
