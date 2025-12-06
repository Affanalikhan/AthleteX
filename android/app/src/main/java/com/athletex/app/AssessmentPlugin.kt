package com.athletex.app

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import org.json.JSONArray
import org.json.JSONObject
import java.util.*

/**
 * AssessmentPlugin - Handles fitness assessment functionality
 * Provides native methods for:
 * - Starting/stopping assessments
 * - Recording performance metrics
 * - Calculating scores
 * - Detecting cheating attempts
 */
@CapacitorPlugin(
    name = "Assessment",
    permissions = [
        Permission(strings = [Manifest.permission.CAMERA], alias = "camera"),
        Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "audio")
    ]
)
class AssessmentPlugin : Plugin() {

    private var assessmentStartTime: Long = 0
    private var isAssessmentActive = false
    private val performanceData = mutableListOf<PerformanceDataPoint>()

    data class PerformanceDataPoint(
        val timestamp: Long,
        val metric: String,
        val value: Double
    )

    /**
     * Start a new assessment session
     */
    @PluginMethod
    fun startAssessment(call: PluginCall) {
        val assessmentType = call.getString("type") ?: run {
            call.reject("Assessment type is required")
            return
        }

        if (isAssessmentActive) {
            call.reject("Assessment already in progress")
            return
        }

        // Check camera permission
        if (!hasPermission(Manifest.permission.CAMERA)) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback")
            return
        }

        assessmentStartTime = System.currentTimeMillis()
        isAssessmentActive = true
        performanceData.clear()

        val result = JSObject().apply {
            put("success", true)
            put("assessmentId", UUID.randomUUID().toString())
            put("startTime", assessmentStartTime)
            put("type", assessmentType)
        }

        call.resolve(result)
    }

    /**
     * Stop the current assessment
     */
    @PluginMethod
    fun stopAssessment(call: PluginCall) {
        if (!isAssessmentActive) {
            call.reject("No active assessment")
            return
        }

        val endTime = System.currentTimeMillis()
        val duration = endTime - assessmentStartTime
        isAssessmentActive = false

        val result = JSObject().apply {
            put("success", true)
            put("duration", duration)
            put("dataPoints", performanceData.size)
            put("endTime", endTime)
        }

        call.resolve(result)
    }

    /**
     * Record a performance metric during assessment
     */
    @PluginMethod
    fun recordMetric(call: PluginCall) {
        if (!isAssessmentActive) {
            call.reject("No active assessment")
            return
        }

        val metric = call.getString("metric") ?: run {
            call.reject("Metric name is required")
            return
        }

        val value = call.getDouble("value") ?: run {
            call.reject("Metric value is required")
            return
        }

        val dataPoint = PerformanceDataPoint(
            timestamp = System.currentTimeMillis(),
            metric = metric,
            value = value
        )

        performanceData.add(dataPoint)

        val result = JSObject().apply {
            put("success", true)
            put("recorded", true)
            put("totalDataPoints", performanceData.size)
        }

        call.resolve(result)
    }

    /**
     * Calculate assessment score based on performance data
     */
    @PluginMethod
    fun calculateScore(call: PluginCall) {
        val assessmentType = call.getString("type") ?: run {
            call.reject("Assessment type is required")
            return
        }

        val metrics = call.getObject("metrics") ?: run {
            call.reject("Metrics are required")
            return
        }

        val score = when (assessmentType) {
            "sprint" -> calculateSprintScore(metrics)
            "endurance" -> calculateEnduranceScore(metrics)
            "strength" -> calculateStrengthScore(metrics)
            "agility" -> calculateAgilityScore(metrics)
            "flexibility" -> calculateFlexibilityScore(metrics)
            else -> 0.0
        }

        val grade = getGrade(score)
        val percentile = calculatePercentile(score, assessmentType)

        val result = JSObject().apply {
            put("success", true)
            put("score", score)
            put("grade", grade)
            put("percentile", percentile)
            put("assessmentType", assessmentType)
        }

        call.resolve(result)
    }

    /**
     * Detect potential cheating during assessment
     */
    @PluginMethod
    fun detectCheating(call: PluginCall) {
        val videoFrames = call.getArray("frames") ?: run {
            call.reject("Video frames are required")
            return
        }

        val suspiciousActivities = mutableListOf<String>()
        var confidenceScore = 100.0

        // Analyze frame consistency
        if (videoFrames.length() < 10) {
            suspiciousActivities.add("Insufficient video data")
            confidenceScore -= 20
        }

        // Check for unusual patterns
        val metrics = call.getObject("metrics")
        if (metrics != null) {
            val speed = metrics.optDouble("speed", 0.0)
            val consistency = metrics.optDouble("consistency", 0.0)

            if (speed > 15.0) { // Unrealistic speed
                suspiciousActivities.add("Unrealistic speed detected")
                confidenceScore -= 30
            }

            if (consistency < 0.3) { // Low consistency
                suspiciousActivities.add("Inconsistent performance pattern")
                confidenceScore -= 15
            }
        }

        val isCheating = confidenceScore < 70.0

        val result = JSObject().apply {
            put("success", true)
            put("isCheating", isCheating)
            put("confidenceScore", confidenceScore)
            put("suspiciousActivities", JSONArray(suspiciousActivities))
            put("timestamp", System.currentTimeMillis())
        }

        call.resolve(result)
    }

    /**
     * Get assessment statistics
     */
    @PluginMethod
    fun getStatistics(call: PluginCall) {
        val result = JSObject().apply {
            put("success", true)
            put("isActive", isAssessmentActive)
            put("dataPointsCollected", performanceData.size)
            if (isAssessmentActive) {
                put("duration", System.currentTimeMillis() - assessmentStartTime)
            }
        }

        call.resolve(result)
    }

    // Helper methods for score calculation

    private fun calculateSprintScore(metrics: JSObject): Double {
        val time = metrics.optDouble("time", 0.0)
        val distance = metrics.optDouble("distance", 100.0)
        
        if (time <= 0) return 0.0
        
        val speed = distance / time // meters per second
        return minOf(100.0, (speed / 0.12) * 10) // Normalize to 100
    }

    private fun calculateEnduranceScore(metrics: JSObject): Double {
        val duration = metrics.optDouble("duration", 0.0)
        val distance = metrics.optDouble("distance", 0.0)
        val heartRate = metrics.optDouble("heartRate", 0.0)
        
        val baseScore = (distance / duration) * 10
        val hrFactor = if (heartRate > 0) (180 - heartRate) / 180 else 1.0
        
        return minOf(100.0, baseScore * hrFactor)
    }

    private fun calculateStrengthScore(metrics: JSObject): Double {
        val reps = metrics.optDouble("reps", 0.0)
        val weight = metrics.optDouble("weight", 0.0)
        val bodyWeight = metrics.optDouble("bodyWeight", 70.0)
        
        val relativeStrength = weight / bodyWeight
        return minOf(100.0, (reps * relativeStrength) * 5)
    }

    private fun calculateAgilityScore(metrics: JSObject): Double {
        val time = metrics.optDouble("time", 0.0)
        val accuracy = metrics.optDouble("accuracy", 0.0)
        
        if (time <= 0) return 0.0
        
        val speedScore = 100 / time
        return minOf(100.0, (speedScore * 0.6 + accuracy * 0.4))
    }

    private fun calculateFlexibilityScore(metrics: JSObject): Double {
        val range = metrics.optDouble("range", 0.0)
        val maxRange = metrics.optDouble("maxRange", 180.0)
        
        return minOf(100.0, (range / maxRange) * 100)
    }

    private fun getGrade(score: Double): String {
        return when {
            score >= 90 -> "A+"
            score >= 85 -> "A"
            score >= 80 -> "A-"
            score >= 75 -> "B+"
            score >= 70 -> "B"
            score >= 65 -> "B-"
            score >= 60 -> "C+"
            score >= 55 -> "C"
            score >= 50 -> "C-"
            else -> "D"
        }
    }

    private fun calculatePercentile(score: Double, type: String): Int {
        // Simplified percentile calculation
        return when {
            score >= 95 -> 99
            score >= 90 -> 95
            score >= 85 -> 90
            score >= 80 -> 85
            score >= 75 -> 75
            score >= 70 -> 65
            score >= 60 -> 50
            score >= 50 -> 35
            else -> 20
        }
    }

    private fun hasPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            permission
        ) == PackageManager.PERMISSION_GRANTED
    }
}
