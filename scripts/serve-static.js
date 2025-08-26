#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateStaticSite, CONFIG } = require('./generate-static.js');

const PORT = process.env.PORT || 3000;

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'text/plain';
}

function serveFile(filePath, res) {
  try {
    const content = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': content.length,
    });
    res.end(content);
  } catch (error) {
    console.error(`Error serving file ${filePath}:`, error.message);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

function handleRequest(req, res) {
  let urlPath = req.url;
  
  // Remove query string
  const queryIndex = urlPath.indexOf('?');
  if (queryIndex !== -1) {
    urlPath = urlPath.substring(0, queryIndex);
  }
  
  // Decode URL
  urlPath = decodeURIComponent(urlPath);
  
  console.log(`📞 ${req.method} ${urlPath}`);
  
  // Handle root path
  if (urlPath === '/') {
    urlPath = '/index.html';
  }
  
  // Handle directory paths (GitHub Pages style)
  if (urlPath.endsWith('/') && urlPath !== '/') {
    urlPath = urlPath + 'index.html';
  }
  
  // Handle paths without extension (assume they need index.html)
  if (!path.extname(urlPath) && urlPath !== '/index.html') {
    urlPath = urlPath + '/index.html';
  }
  
  const filePath = path.join(CONFIG.outputDir, urlPath);
  
  // Security check - make sure we're serving from the static directory
  const resolvedPath = path.resolve(filePath);
  const staticDirResolved = path.resolve(CONFIG.outputDir);
  
  if (!resolvedPath.startsWith(staticDirResolved)) {
    console.warn(`⚠️  Attempted path traversal: ${urlPath}`);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Check if file exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
  } else {
    console.warn(`❌ File not found: ${filePath}`);
    
    // Try to serve index.html for SPA-style routing
    const indexPath = path.join(CONFIG.outputDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`📄 Serving index.html instead`);
      serveFile(indexPath, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
}

function startServer() {
  console.log('🚀 Starting static site development server...');
  
  // Generate static site first
  if (!fs.existsSync(CONFIG.outputDir)) {
    console.log('📦 Generating static site...');
    generateStaticSite();
  } else {
    console.log('📁 Using existing static site directory');
    console.log('💡 Run with --rebuild to regenerate the site');
  }
  
  const server = http.createServer(handleRequest);
  
  server.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`📂 Serving from: ${CONFIG.outputDir}`);
    console.log('📖 Available pages:');
    
    // List available pages
    try {
      const files = fs.readdirSync(CONFIG.outputDir);
      files.forEach(file => {
        const filePath = path.join(CONFIG.outputDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          console.log(`   • http://localhost:${PORT}/${file}/`);
        } else if (file === 'index.html') {
          console.log(`   • http://localhost:${PORT}/`);
        }
      });
    } catch (error) {
      console.error('Error listing pages:', error.message);
    }
    
    console.log('\n🔄 Press Ctrl+C to stop the server');
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });
}

// Handle command line arguments
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Static Site Development Server

Usage:
  node serve-static.js [options]

Options:
  --help, -h          Show this help message
  --rebuild           Rebuild the static site before serving
  --port <port>       Port to serve on (default: 3000)

Environment Variables:
  PORT                Server port (default: 3000)

Examples:
  node serve-static.js
  node serve-static.js --port 8080
  node serve-static.js --rebuild
    `);
    return;
  }
  
  if (args.includes('--rebuild')) {
    console.log('🔄 Rebuilding static site...');
    generateStaticSite();
  }
  
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    process.env.PORT = args[portIndex + 1];
  }
  
  startServer();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { startServer };
