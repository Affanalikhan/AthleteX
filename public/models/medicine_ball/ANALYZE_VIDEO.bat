@echo off
echo ======================================================================
echo MEDICINE BALL POWER COACH - VIDEO ANALYZER
echo ======================================================================
echo.
echo Drag and drop your video file here, or type the path:
echo.
set /p VIDEO_PATH="Video file: "
echo.
echo Analyzing video...
echo.
python analyze_video.py "%VIDEO_PATH%"
echo.
echo ======================================================================
pause
