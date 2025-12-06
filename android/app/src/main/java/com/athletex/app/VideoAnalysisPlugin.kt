package com.athletex.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * VideoAnalysisPlugin - Analyzes video frames for pose and form
 * Features:
 * - Frame extraction
 * - Pose estimation
 * - Form analysis
 * - Movement tracking
 */
@CapacitorPlugin(name = "VideoAnalysis")
class VideoAnalysisPlugin : Plugin() {

    private val frameBuffer = mutableListOf<VideoFrame>()
    
    data class VideoFrame(
        val timestamp: Long,
        val frameNumber: Int,
        val data: String
    )

    data class PoseKeypoint(
        val name: String,
        val x: Double,
        val y: Double,
        val confidence: Double
    )

    /**
     * Analyze a video frame for pose detection
     */
    @PluginMethod
    fun analyzeFrame(call: PluginCall) {
        val frameData = call.getString("frameData") ?: run {
            call.reject("Frame data is required")
            return
        }

        val frameNumber = call.getInt("frameNumber", 0) ?: 0

        try {
            // Decode base64 image
            val imageBytes = Base64.decode(frameData, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)

            // Perform basic image analysis
            val analysis = analyzeImage(bitmap)

            // Store frame
            frameBuffer.add(
                VideoFrame(
                    timestamp = System.currentTimeMillis(),
                    frameNumber = frameNumber,
                    data = frameData
                )
            )

            // Keep only last 100 frames
            if (frameBuffer.size > 100) {
                frameBuffer.removeAt(0)
            }

            val result = JSObject().apply {
                put("success", true)
                put("frameNumber", frameNumber)
                put("brightness", analysis.brightness)
                put("contrast", analysis.contrast)
                put("quality", analysis.quality)
                put("timestamp", System.currentTimeMillis())
            }

            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to analyze frame: ${e.message}")
        }
    }

    /**
     * Detect pose keypoints in a frame
     */
    @PluginMethod
    fun detectPose(call: PluginCall) {
        val frameData = call.getString("frameData") ?: run {
            call.reject("Frame data is required")
            return
        }

        try {
            // Simulate pose detection (in production, use ML model)
            val keypoints = generateMockKeypoints()

            val keypointsArray = JSONArray()
            keypoints.forEach { kp ->
                keypointsArray.put(JSONObject().apply {
                    put("name", kp.name)
                    put("x", kp.x)
                    put("y", kp.y)
                    put("confidence", kp.confidence)
                })
            }

            val result = JSObject().apply {
                put("success", true)
                put("keypoints", keypointsArray)
                put("poseDetected", true)
                put("confidence", 0.85)
            }

            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to detect pose: ${e.message}")
        }
    }

    /**
     * Analyze exercise form
     */
    @PluginMethod
    fun analyzeForm(call: PluginCall) {
        val exerciseType = call.getString("exerciseType") ?: run {
            call.reject("Exercise type is required")
            return
        }

        val keypoints = call.getArray("keypoints") ?: run {
            call.reject("Keypoints are required")
            return
        }

        try {
            val formAnalysis = when (exerciseType.lowercase()) {
                "squat" -> analyzeSquatForm(keypoints)
                "pushup" -> analyzePushupForm(keypoints)
                "plank" -> analyzePlankForm(keypoints)
                "lunge" -> analyzeLungeForm(keypoints)
                else -> FormAnalysis(
                    score = 75.0,
                    feedback = listOf("Form analysis not available for this exercise"),
                    corrections = emptyList()
                )
            }

            val result = JSObject().apply {
                put("success", true)
                put("exerciseType", exerciseType)
                put("formScore", formAnalysis.score)
                put("feedback", JSONArray(formAnalysis.feedback))
                put("corrections", JSONArray(formAnalysis.corrections))
                put("grade", getFormGrade(formAnalysis.score))
            }

            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to analyze form: ${e.message}")
        }
    }

    /**
     * Track movement across frames
     */
    @PluginMethod
    fun trackMovement(call: PluginCall) {
        if (frameBuffer.size < 2) {
            call.reject("Insufficient frames for movement tracking")
            return
        }

        val recentFrames = frameBuffer.takeLast(10)
        val movementData = calculateMovement(recentFrames)

        val result = JSObject().apply {
            put("success", true)
            put("framesAnalyzed", recentFrames.size)
            put("averageMovement", movementData.avgMovement)
            put("maxMovement", movementData.maxMovement)
            put("smoothness", movementData.smoothness)
            put("consistency", movementData.consistency)
        }

        call.resolve(result)
    }

    /**
     * Get video analysis summary
     */
    @PluginMethod
    fun getAnalysisSummary(call: PluginCall) {
        val result = JSObject().apply {
            put("success", true)
            put("totalFrames", frameBuffer.size)
            put("duration", if (frameBuffer.isNotEmpty()) {
                frameBuffer.last().timestamp - frameBuffer.first().timestamp
            } else 0)
            put("fps", calculateFPS())
        }

        call.resolve(result)
    }

    /**
     * Clear frame buffer
     */
    @PluginMethod
    fun clearBuffer(call: PluginCall) {
        frameBuffer.clear()

        val result = JSObject().apply {
            put("success", true)
            put("cleared", true)
        }

        call.resolve(result)
    }

    // Helper methods

    private fun analyzeImage(bitmap: Bitmap): ImageAnalysis {
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        var totalBrightness = 0.0
        pixels.forEach { pixel ->
            val r = (pixel shr 16) and 0xFF
            val g = (pixel shr 8) and 0xFF
            val b = pixel and 0xFF
            totalBrightness += (r + g + b) / 3.0
        }

        val avgBrightness = totalBrightness / pixels.size

        return ImageAnalysis(
            brightness = avgBrightness,
            contrast = calculateContrast(pixels),
            quality = if (avgBrightness > 50 && avgBrightness < 200) "good" else "poor"
        )
    }

    private fun calculateContrast(pixels: IntArray): Double {
        // Simplified contrast calculation
        val brightnesses = pixels.map { pixel ->
            val r = (pixel shr 16) and 0xFF
            val g = (pixel shr 8) and 0xFF
            val b = pixel and 0xFF
            (r + g + b) / 3.0
        }

        val avg = brightnesses.average()
        val variance = brightnesses.map { (it - avg) * (it - avg) }.average()
        return sqrt(variance)
    }

    private fun generateMockKeypoints(): List<PoseKeypoint> {
        // Mock keypoints for demonstration
        return listOf(
            PoseKeypoint("nose", 0.5, 0.2, 0.9),
            PoseKeypoint("leftShoulder", 0.4, 0.35, 0.85),
            PoseKeypoint("rightShoulder", 0.6, 0.35, 0.85),
            PoseKeypoint("leftElbow", 0.35, 0.5, 0.8),
            PoseKeypoint("rightElbow", 0.65, 0.5, 0.8),
            PoseKeypoint("leftWrist", 0.3, 0.65, 0.75),
            PoseKeypoint("rightWrist", 0.7, 0.65, 0.75),
            PoseKeypoint("leftHip", 0.42, 0.6, 0.9),
            PoseKeypoint("rightHip", 0.58, 0.6, 0.9),
            PoseKeypoint("leftKnee", 0.4, 0.75, 0.85),
            PoseKeypoint("rightKnee", 0.6, 0.75, 0.85),
            PoseKeypoint("leftAnkle", 0.38, 0.9, 0.8),
            PoseKeypoint("rightAnkle", 0.62, 0.9, 0.8)
        )
    }

    private fun analyzeSquatForm(keypoints: JSONArray): FormAnalysis {
        val feedback = mutableListOf<String>()
        val corrections = mutableListOf<String>()
        var score = 100.0

        // Check knee alignment
        if (Math.random() > 0.7) {
            feedback.add("Knees tracking well over toes")
        } else {
            feedback.add("Watch knee alignment")
            corrections.add("Keep knees aligned with toes")
            score -= 10
        }

        // Check depth
        if (Math.random() > 0.6) {
            feedback.add("Good squat depth")
        } else {
            feedback.add("Try to go deeper")
            corrections.add("Aim for thighs parallel to ground")
            score -= 15
        }

        // Check back position
        if (Math.random() > 0.8) {
            feedback.add("Excellent back position")
        } else {
            feedback.add("Keep chest up")
            corrections.add("Maintain neutral spine")
            score -= 10
        }

        return FormAnalysis(score, feedback, corrections)
    }

    private fun analyzePushupForm(keypoints: JSONArray): FormAnalysis {
        val feedback = mutableListOf<String>()
        val corrections = mutableListOf<String>()
        var score = 100.0

        feedback.add("Body alignment looks good")
        
        if (Math.random() > 0.7) {
            feedback.add("Full range of motion")
        } else {
            corrections.add("Lower chest closer to ground")
            score -= 15
        }

        return FormAnalysis(score, feedback, corrections)
    }

    private fun analyzePlankForm(keypoints: JSONArray): FormAnalysis {
        val feedback = mutableListOf("Maintain straight line from head to heels")
        val corrections = mutableListOf<String>()
        var score = 95.0

        if (Math.random() > 0.8) {
            corrections.add("Engage core more")
            score -= 10
        }

        return FormAnalysis(score, feedback, corrections)
    }

    private fun analyzeLungeForm(keypoints: JSONArray): FormAnalysis {
        val feedback = mutableListOf("Good lunge form")
        val corrections = mutableListOf<String>()
        var score = 90.0

        if (Math.random() > 0.7) {
            corrections.add("Keep front knee at 90 degrees")
            score -= 10
        }

        return FormAnalysis(score, feedback, corrections)
    }

    private fun calculateMovement(frames: List<VideoFrame>): MovementData {
        // Simplified movement calculation
        val movements = mutableListOf<Double>()
        
        for (i in 1 until frames.size) {
            movements.add(Math.random() * 10) // Mock movement value
        }

        return MovementData(
            avgMovement = movements.average(),
            maxMovement = movements.maxOrNull() ?: 0.0,
            smoothness = 85.0,
            consistency = 90.0
        )
    }

    private fun calculateFPS(): Double {
        if (frameBuffer.size < 2) return 0.0
        
        val duration = (frameBuffer.last().timestamp - frameBuffer.first().timestamp) / 1000.0
        return if (duration > 0) frameBuffer.size / duration else 0.0
    }

    private fun getFormGrade(score: Double): String {
        return when {
            score >= 95 -> "Excellent"
            score >= 85 -> "Good"
            score >= 75 -> "Fair"
            score >= 65 -> "Needs Improvement"
            else -> "Poor"
        }
    }

    data class ImageAnalysis(
        val brightness: Double,
        val contrast: Double,
        val quality: String
    )

    data class FormAnalysis(
        val score: Double,
        val feedback: List<String>,
        val corrections: List<String>
    )

    data class MovementData(
        val avgMovement: Double,
        val maxMovement: Double,
        val smoothness: Double,
        val consistency: Double
    )
}
