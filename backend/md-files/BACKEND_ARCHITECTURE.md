You are refactoring the backend of a World Cup 2026 prediction app.

Current backend:

- Node.js + Express CommonJS API.
- Supabase is the database client.
- JWT auth is custom, with bcrypt password hashing.
- FIFA API proxy/fixture transformation lives inside backend/index.js.
- Game features live in route files: auth, predictions, scoring, leaderboard, admin.
- Scoring includes both HTTP routes and reusable scoring functions.
- A scoring poller currently starts from the main entrypoint.
- Do not leave any dev server or background process running when finished.

Goal:
Restructure the backend into a maintainable modular monolith. Do not introduce microservices. Keep behavior compatible with the current API unless a change is explicitly requested. Prefer incremental refactoring over rewrites.

Use these architecture patterns:

1. Feature-first modular monolith.
2. Thin routes and controllers.
3. Services for business rules.
4. Repositories for Supabase reads/writes.
5. External API clients for FIFA/Supabase setup.
6. Mappers/DTOs for response shaping.
7. Central validation, auth, error handling, logging, and config.
8. Background jobs separated from HTTP startup.
9. Pure functions for scoring calculations where possible.
10. Tests around scoring, prediction lockout, admin authorization, auth, and fixture transformation.

Target file structure:
backend/
package.json
index.js # temporary compatibility entry, imports src/server.js
src/
server.js # starts HTTP server only
app.js # creates Express app, mounts middleware/routes, exports app
config/
env.js # validates env vars once at startup
cors.js # origin allowlist logic
constants.js # COMPETITION, SEASON, FIFA base URLs
clients/
supabaseClient.js # create Supabase client, never expose secret/service keys
fifaClient.js # HTTP client with headers, timeout, typed helpers
shared/
http/
asyncHandler.js # needed while on Express 4
errors.js # AppError, UnauthorizedError, ForbiddenError, ValidationError
responses.js # optional success/error response helpers
middleware/
requireAuth.js
requireAdmin.js
notFound.js
errorHandler.js
validation/
validate.js
logging/
logger.js
features/
fixtures/
fixtures.routes.js
fixtures.controller.js
fixtures.service.js
fifaFixtures.mapper.js
fixtures.cache.js
matchStats/
matchStats.routes.js
matchStats.controller.js
matchStats.service.js
fifaMatchStats.mapper.js
auth/
auth.routes.js
auth.controller.js
auth.service.js
auth.repository.js
auth.schemas.js
auth.dto.js
users/
users.repository.js
deleteUser.service.js
adminIdentity.service.js
predictions/
predictions.routes.js
predictions.controller.js
predictions.service.js
predictions.repository.js
predictions.schemas.js
scoring/
scoring.routes.js
scoring.controller.js
scoring.service.js
scoring.repository.js
scoring.rules.js # pure scoring math
fifaScoring.service.js
leaderboard/
leaderboard.routes.js
leaderboard.controller.js
leaderboard.service.js
leaderboard.repository.js
admin/
admin.routes.js
admin.controller.js
admin.service.js
admin.schemas.js
jobs/
scoringPoller.js # start/stop functions, no side effects on import
tests/
unit/
integration/
fixtures/

Implementation rules:

- Keep CommonJS unless the project is deliberately migrated.
- Do not make route modules export business functions. Move reusable logic into services.
- Do not let importing app.js start the server or the scoring poller.
- server.js should start app.listen(), start jobs, and handle SIGTERM/SIGINT cleanup.
- app.js should be importable by tests without side effects.
- Add a /health endpoint.
- Add final 404 and centralized error middleware.
- Validate all request bodies, params, and query strings before services run.
- Keep JWT parsing in requireAuth; keep admin checks in requireAdmin.
- Keep Supabase secret/service keys server-only. For new Supabase setup, prefer secret keys over legacy service_role keys because Supabase docs say service_role is legacy and due for deprecation by end of 2026.
- Move FIFA-specific normalization into mappers so services work with app-shaped objects.
- Put cache TTLs and external API constants in config.
- Use timeouts for FIFA/FDH HTTP calls.
- Do not trust client-supplied IDs without ownership or role checks.
- Do not expose password hashes or secret config in responses/logs.
- Avoid synchronous filesystem writes for admin identity in production; prefer env/database-backed admin role storage.

Migration order:

1. Split index.js into src/app.js and src/server.js without behavior changes.
2. Move CORS/env/constants/Supabase setup into config and clients.
3. Extract FIFA fixture and match-stat logic from index.js into fixtures and matchStats features.
4. Extract scoring logic from routes/scoring.js into scoring service, repository, rules, and job.
5. Extract prediction, auth, leaderboard, admin route logic into controllers/services/repositories.
6. Add validation schemas and central error handling.
7. Add focused tests for scoring rules, prediction lockout, auth/admin checks, and fixture mapping.
8. Leave old files as thin compatibility wrappers only if needed, then remove once imports are updated.

Acceptance criteria:

- Existing endpoints keep working.
- Tests can import app without starting a listener or poller.
- Scoring poller can be started/stopped explicitly.
- Route files contain only route registration and middleware wiring.
- Controllers translate HTTP to service calls.
- Services contain business rules.
- Repositories contain Supabase queries.
- External API clients contain FIFA/FDH request details.
- No circular dependency such as predictions importing a route module from scoring.
- No background process is left running after work is complete.
