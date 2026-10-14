import uvicorn
import sys
import os

# Add current directory to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting GridPulse FastAPI Server on http://localhost:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
