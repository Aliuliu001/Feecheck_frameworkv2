#!/usr/bin/env python3
"""Simple HTTP server to avoid CORS errors when running locally."""
import http.server
import socketserver
import os

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
})

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Joy Fee Check server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
