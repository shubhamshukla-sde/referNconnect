/**
 * Development server with CORS proxy for Perplexity AI
 * Serves static files and proxies /api/perplexity requests
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PERPLEXITY_API = 'https://api.perplexity.ai';

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
    // ─── CORS Proxy for Perplexity ────────────────────────────
    if (req.url === '/api/perplexity' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const options = {
                hostname: 'api.perplexity.ai',
                path: '/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization'] || '',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const proxyReq = https.request(options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('Proxy error:', err.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: { message: 'Proxy error: ' + err.message } }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    // ─── Static File Server ───────────────────────────────────
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = filePath.split('?')[0]; // Remove query params
    const fullPath = path.join(__dirname, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 referNconnect dev server running at http://localhost:${PORT}`);
    console.log(`📡 Perplexity API proxy at http://localhost:${PORT}/api/perplexity`);
    console.log(`\n📝 Press Ctrl+C to stop\n`);
});
