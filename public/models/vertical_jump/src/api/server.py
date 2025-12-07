"""
FastAPI server for jump analysis
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
from typing import Optional
from pydantic import BaseModel

from ..analysis.ml_jump_analyzer import MLJumpAnalyzer
from ..models.types import UserProfile, TrainingGoal, SafetyMode


app = FastAPI(title="Vertical Jump Coach API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML-powered analyzer
analyzer = MLJumpAnalyzer()


class UserProfileRequest(BaseModel):
    user_id: str = "default_user"
    age: int = 25
    gender: str = "male"
    height_cm: float = 175.0
    weight_kg: float = 75.0
    skill_level: str = "intermediate"
    training_goal: str = "increase_height"
    safety_mode: str = "standard"


@app.get("/")
async def root():
    return {
        "message": "Vertical Jump Coach API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "POST - Upload video for analysis",
            "/health": "GET - Health check"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/analyze")
async def analyze_jump(
    video: UploadFile = File(...),
    user_age: Optional[int] = 25,
    user_skill: Optional[str] = "intermediate",
    training_goal: Optional[str] = "increase_height",
    safety_mode: Optional[str] = "standard"
):
    """
    Analyze a vertical jump video
    
    Args:
        video: Video file (MP4, MOV, AVI)
        user_age: User's age
        user_skill: Skill level (beginner, intermediate, advanced, elite)
        training_goal: Training goal (increase_height, landing_safety, speed_reactivity)
        safety_mode: Safety mode (standard, knee_safe, rehab)
    
    Returns:
        JSON with jump analysis results, scores, and coaching feedback
    """
    
    # Validate file type
    if not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            content = await video.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Create user profile
        user_profile = UserProfile(
            user_id="api_user",
            age=user_age,
            gender="unknown",
            height_cm=175.0,
            weight_kg=75.0,
            skill_level=user_skill,
            training_goal=TrainingGoal(training_goal),
            safety_mode=SafetyMode(safety_mode)
        )
        
        # Analyze video
        result = analyzer.analyze_video(tmp_path, user_profile)
        
        # Format response
        response = {
            "success": True,
            "jump_metrics": {
                "height_cm": round(result.jump_height_cm, 1),
                "height_inches": round(result.jump_height_inches, 1),
                "power_score": round(result.power_score, 1),
                "explosiveness_rating": round(result.explosiveness_rating, 1),
                "takeoff_efficiency": round(result.takeoff_efficiency, 1),
                "landing_control_score": round(result.landing_control_score, 1),
                "quality_score": round(result.predictions.quality_score, 1)
            },
            "feedback": {
                "summary": result.feedback.summary,
                "positives": result.feedback.positives,
                "improvements": result.feedback.improvements,
                "detailed_explanation": result.feedback.detailed_explanation
            },
            "exercise_recommendations": [
                {
                    "name": ex.name,
                    "description": ex.description,
                    "target_area": ex.target_area,
                    "difficulty": ex.difficulty
                }
                for ex in result.feedback.exercise_recommendations
            ],
            "technique_errors": [
                {
                    "type": error.error_type.value,
                    "severity": error.severity.value,
                    "description": error.description,
                    "confidence": round(error.confidence * 100, 0)
                }
                for error in result.predictions.errors
            ],
            "confidence": {
                "percentage": result.confidence_percentage,
                "explanation": result.confidence_explanation,
                "camera_tips": result.camera_tips
            },
            "phase_timing": {
                phase: round(duration, 0)
                for phase, duration in result.predictions.phase_timing.items()
            }
        }
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
