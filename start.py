"""
start.py — Production entrypoint for Sample Drop Optimization.
Verifies frontend build assets and launches the production WSGI server.
"""
import os, sys, subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

def ensure_frontend_build():
    if not FRONTEND_DIST.exists() or not (FRONTEND_DIST / "index.html").exists():
        print("[Start] Building frontend production bundle (npm run build)...")
        frontend_dir = BASE_DIR / "frontend"
        res = subprocess.run("npx --no-install vite build", shell=True, cwd=str(frontend_dir))
        if res.returncode != 0:
            print("[Start] ERROR: Frontend build failed!")
            sys.exit(1)
        print("[Start] Frontend build completed successfully.")

def main():
    ensure_frontend_build()
    
    port = int(os.environ.get("PORT", 5000))
    print(f"[Start] Launching Production WSGI Server on port {port}...")
    
    # Use Waitress for Windows/Cross-platform or Gunicorn for Unix
    if os.name == "nt":
        try:
            from waitress import serve
            from api.app import app
            print(f"[Start] Waitress server listening at http://0.0.0.0:{port}")
            serve(app, host="0.0.0.0", port=port, threads=4)
        except ImportError:
            print("[Start] Waitress not installed, falling back to Flask development server...")
            from api.app import app
            app.run(host="0.0.0.0", port=port, debug=False)
    else:
        # Unix/Linux Gunicorn
        cmd = ["gunicorn", "api.app:app", "--bind", f"0.0.0.0:{port}", "--workers", "2", "--timeout", "300"]
        os.execvp("gunicorn", cmd)

if __name__ == "__main__":
    main()
