"""
Simple HTTP Server for Broad Jump Test
=======================================
Run this to start the web application
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    print("="*60)
    print("BROAD JUMP TEST - WEB SERVER")
    print("="*60)
    print(f"\nStarting server on port {PORT}...")
    print(f"\nOpen your browser and go to:")
    print(f"  http://localhost:{PORT}/index_main.html")
    print(f"\nAvailable pages:")
    print(f"  - Main Menu: http://localhost:{PORT}/index_main.html")
    print(f"  - Live Test: http://localhost:{PORT}/simple_jump_test.html")
    print(f"  - Video Upload: http://localhost:{PORT}/video_upload_jump.html")
    print(f"\nPress Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Open browser automatically
    webbrowser.open(f'http://localhost:{PORT}/index_main.html')
    
    # Start server
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")

if __name__ == "__main__":
    main()
