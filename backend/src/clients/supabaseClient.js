'use strict';

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config/env');

module.exports = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
});
