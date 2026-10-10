#!/usr/bin/env node
'use strict';
// Claude Code hook: forwards the hook JSON (stdin) to the Pixel Office server.
// Always exits 0 quickly so it can never block or break Claude Code.
const http = require('http');

const port = Number(process.env.PIXEL_OFFICE_PORT || 4317);
const host = process.env.PIXEL_OFFICE_HOST || '127.0.0.1';
let body = '';
const done = () => process.exit(0);
setTimeout(done, 1500).unref();

process.stdin.on('data', (c) => { body += c; });
process.stdin.on('end', () => {
  const req = http.request({ host, port, path: '/hook', method: 'POST', timeout: 1000,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
    res.resume();
    res.on('end', done);
  });
  req.on('error', done);
  req.on('timeout', () => { req.destroy(); done(); });
  req.end(body);
});
