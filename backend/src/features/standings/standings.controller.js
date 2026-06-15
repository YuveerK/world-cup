'use strict';

const axios = require('axios');
const asyncHandler = require('../../shared/http/asyncHandler');
const { getGroupStandings } = require('./standings.service');
const { FIFA_BASE, FIFA_TIMEOUT_MS } = require('../../config/constants');

const getStandings = asyncHandler(async (req, res) => {
  const groups = await getGroupStandings();
  res.json({ success: true, total: groups.length, groups });
});

const getFlagImage = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const url = `${FIFA_BASE}/picture/flags-sq-4/${encodeURIComponent(code)}`;

  const upstream = await axios.get(url, {
    responseType: 'stream',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: FIFA_TIMEOUT_MS,
  });

  res.set('Content-Type', upstream.headers['content-type'] || 'image/png');
  res.set('Cache-Control', 'public, max-age=86400');
  upstream.data.pipe(res);
});

module.exports = { getStandings, getFlagImage };
