"""
Fixed startup script for Vertical Jump Coach
Allows server output to be visible
"""
import subprocess
import sys
import webbrowser
import time
from pathlib import Path


def check_dependencies():
    """Check if required packages are installed"""
    print("Checking dependencies...")
    try:
        import cv2
        import mediapipe
        import fastapi
        import uvicorn
        print("✅ All dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\nPlease install dependencies:")
        print("  pip install -r requirements.txt")
        return False


def main():
    print("=" * 60)
    print("🏀 VERTICAL JUMP COACH")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    try:
        print("\n🚀 Starting API server on http://localhost:8000")
        print("   API docs available at http://localhost:8000/docs")
        
        # Start API server without capturing output
        api_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "src.api.server:app", 
             "--host", "0.0.0.0", "--port", "8000"]
        )
        
        time.sleep(3)  # Wait for API server to start
        
        print("🌐 Starting web server on http://localhost:8080")
        
        # Start web server
        web_dir = Path("web")
        if web_dir.exists():
            web_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", "8080"],
                cwd=web_dir
            )
            time.sleep(1)
        else:
            print("❌ Web directory not found")
            web_process = None
        
        # Open browser
        print("\n✅ Servers started successfully!")
        print("\n📱 Opening web interface...")
        webbrowser.open("http://localhost:8080")
        
        print("\n" + "=" * 60)
        print("READY TO ANALYZE JUMPS!")
        print("=" * 60)
        print("\nWeb Interface: http://localhost:8080")
        print("API Server:    http://localhost:8000")
        print("API Docs:      http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop servers")
        print("=" * 60)
        
        # Keep running
        api_process.wait()
        
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down servers...")
        if 'api_process' in locals():
            api_process.terminate()
        if 'web_process' in locals() and web_process:
            web_process.terminate()
        print("✅ Servers stopped")
        return 0
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
