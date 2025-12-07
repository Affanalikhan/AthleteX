from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import tempfile
import os
from pathlib import Path
from gait_analyzer_enhanced import EnhancedGaitAnalyzer

app = FastAPI(title="Endurance Run Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use enhanced analyzer with GPU support
# Set model_path to trained model checkpoint if available
model_path = "checkpoints/best_model.pth" if Path("checkpoints/best_model.pth").exists() else None
analyzer = EnhancedGaitAnalyzer(model_path=model_path, use_gpu=True)

@app.post("/api/analyze")
async def analyze_run(video: UploadFile = File(...)):
    if not video.filename.lower().endswith(('.mp4', '.mov', '.avi')):
        raise HTTPException(400, "Invalid format. Use MP4, MOV, or AVI")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(video.filename).suffix) as tmp:
        content = await video.read()
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(400, "File too large. Max 50MB")
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        results = analyzer.analyze_video(tmp_path)
        return JSONResponse(results)
    finally:
        os.unlink(tmp_path)

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
