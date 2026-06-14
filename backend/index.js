// Entry point — all logic lives in src/.
// Kept so process managers pointing at index.js work without changes.
require('dotenv').config();
require('./src/server');
