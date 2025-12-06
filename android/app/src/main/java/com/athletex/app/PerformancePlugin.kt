package com.athletex.app

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.sqrt

/**
 * PerformancePlugin - Tracks athlete performance metrics
 * Features:
 * - Motion tracking using accelerometer
 * - Step counting
 * - Activity detection
 * - Performance analytics
 */
@CapacitorPlugin(name = "Performance")
class PerformancePlugin : Plugin(), SensorEventListener {

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private var stepCounter: Sensor? = null
    
    private var isTracking = false
    private var stepCount = 0
    private var totalDistance = 0.0
    private var caloriesBurned = 0.0
    
    private val activityData = mutableListOf<ActivityDataPoint>()
    
    data class ActivityDataPoint(
        val timestamp: Long,
        val x: Float,
        val y: Float,
        val z: Float,
        val magnitude: Double
    )

    override fun load() {
        super.load()
        sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    }

    /**
     * Start tracking performance metrics
     */
    @PluginMethod
    fun startTracking(call: PluginCall) {
        if (isTracking) {
            call.reject("Tracking already active")
            return
        }

        // Register accelerometer listener
        accelerometer?.let {
            sensorManager.registerListener(
                this,
                it,
                SensorManager.SENSOR_DELAY_NORMAL
            )
        }

        // Register step counter listener
        stepCounter?.let {
            sensorManager.registerListener(
                this,
                it,
                SensorManager.SENSOR_DELAY_NORMAL
            )
        }

        isTracking = true
        stepCount = 0
        totalDistance = 0.0
        caloriesBurned = 0.0
        activityData.clear()

        val result = JSObject().apply {
            put("success", true)
            put("tracking", true)
            put("startTime", System.currentTimeMillis())
        }

        call.resolve(result)
    }

    /**
     * Stop tracking performance metrics
     */
    @PluginMethod
    fun stopTracking(call: PluginCall) {
        if (!isTracking) {
            call.reject("No active tracking")
            return
        }

        sensorManager.unregisterListener(this)
        isTracking = false

        val result = JSObject().apply {
            put("success", true)
            put("tracking", false)
            put("steps", stepCount)
            put("distance", totalDistance)
            put("calories", caloriesBurned)
            put("dataPoints", activityData.size)
        }

        call.resolve(result)
    }

    /**
     * Get current performance metrics
     */
    @PluginMethod
    fun getMetrics(call: PluginCall) {
        val avgSpeed = if (activityData.isNotEmpty()) {
            activityData.map { it.magnitude }.average()
        } else 0.0

        val intensity = calculateIntensity()
        val pace = if (totalDistance > 0) stepCount / totalDistance else 0.0

        val result = JSObject().apply {
            put("success", true)
            put("isTracking", isTracking)
            put("steps", stepCount)
            put("distance", totalDistance)
            put("calories", caloriesBurned)
            put("avgSpeed", avgSpeed)
            put("intensity", intensity)
            put("pace", pace)
            put("timestamp", System.currentTimeMillis())
        }

        call.resolve(result)
    }

    /**
     * Analyze performance data
     */
    @PluginMethod
    fun analyzePerformance(call: PluginCall) {
        if (activityData.isEmpty()) {
            call.reject("No performance data available")
            return
        }

        val analysis = performAnalysis()

        val result = JSObject().apply {
            put("success", true)
            put("totalDataPoints", activityData.size)
            put("averageIntensity", analysis.avgIntensity)
            put("peakIntensity", analysis.peakIntensity)
            put("consistency", analysis.consistency)
            put("performanceScore", analysis.score)
            put("recommendations", JSONArray(analysis.recommendations))
        }

        call.resolve(result)
    }

    /**
     * Calculate calories burned
     */
    @PluginMethod
    fun calculateCalories(call: PluginCall) {
        val weight = call.getDouble("weight", 70.0) ?: 70.0
        val duration = call.getDouble("duration", 0.0) ?: 0.0 // in minutes
        val intensity = call.getString("intensity", "moderate") ?: "moderate"

        val met = when (intensity) {
            "light" -> 3.0
            "moderate" -> 5.0
            "vigorous" -> 8.0
            "intense" -> 10.0
            else -> 5.0
        }

        val calories = (met * weight * duration) / 60.0

        val result = JSObject().apply {
            put("success", true)
            put("calories", calories)
            put("met", met)
            put("intensity", intensity)
        }

        call.resolve(result)
    }

    /**
     * Get activity summary
     */
    @PluginMethod
    fun getActivitySummary(call: PluginCall) {
        val duration = call.getDouble("duration", 0.0) ?: 0.0
        
        val summary = JSObject().apply {
            put("success", true)
            put("steps", stepCount)
            put("distance", totalDistance)
            put("calories", caloriesBurned)
            put("duration", duration)
            put("avgPace", if (duration > 0) totalDistance / duration else 0.0)
            put("avgSpeed", if (duration > 0) totalDistance / (duration / 60.0) else 0.0)
            put("intensity", calculateIntensity())
        }

        call.resolve(summary)
    }

    // SensorEventListener implementation

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            when (it.sensor.type) {
                Sensor.TYPE_ACCELEROMETER -> handleAccelerometer(it)
                Sensor.TYPE_STEP_COUNTER -> handleStepCounter(it)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Handle accuracy changes if needed
    }

    // Helper methods

    private fun handleAccelerometer(event: SensorEvent) {
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]

        val magnitude = sqrt((x * x + y * y + z * z).toDouble())

        val dataPoint = ActivityDataPoint(
            timestamp = System.currentTimeMillis(),
            x = x,
            y = y,
            z = z,
            magnitude = magnitude
        )

        activityData.add(dataPoint)

        // Keep only last 1000 data points to manage memory
        if (activityData.size > 1000) {
            activityData.removeAt(0)
        }

        // Estimate distance (simplified)
        if (magnitude > 12.0) { // Movement threshold
            totalDistance += 0.001 // Rough estimate
        }
    }

    private fun handleStepCounter(event: SensorEvent) {
        stepCount = event.values[0].toInt()
        
        // Estimate distance based on steps (average stride length ~0.75m)
        totalDistance = stepCount * 0.75 / 1000.0 // in km
        
        // Estimate calories (rough calculation)
        caloriesBurned = stepCount * 0.04 // ~0.04 calories per step
    }

    private fun calculateIntensity(): String {
        if (activityData.isEmpty()) return "none"

        val avgMagnitude = activityData.map { it.magnitude }.average()

        return when {
            avgMagnitude < 10.0 -> "light"
            avgMagnitude < 12.0 -> "moderate"
            avgMagnitude < 14.0 -> "vigorous"
            else -> "intense"
        }
    }

    private fun performAnalysis(): PerformanceAnalysis {
        val magnitudes = activityData.map { it.magnitude }
        
        val avgIntensity = magnitudes.average()
        val peakIntensity = magnitudes.maxOrNull() ?: 0.0
        
        // Calculate consistency (lower standard deviation = more consistent)
        val variance = magnitudes.map { (it - avgIntensity) * (it - avgIntensity) }.average()
        val stdDev = sqrt(variance)
        val consistency = maxOf(0.0, 100.0 - (stdDev * 10))
        
        // Calculate performance score
        val score = (avgIntensity * 5 + consistency * 0.5).coerceIn(0.0, 100.0)
        
        // Generate recommendations
        val recommendations = mutableListOf<String>()
        
        when {
            avgIntensity < 10.0 -> recommendations.add("Increase workout intensity")
            avgIntensity > 15.0 -> recommendations.add("Great intensity! Maintain this level")
        }
        
        when {
            consistency < 50.0 -> recommendations.add("Work on maintaining consistent pace")
            consistency > 80.0 -> recommendations.add("Excellent consistency!")
        }
        
        if (stepCount < 5000) {
            recommendations.add("Try to increase daily step count")
        }

        return PerformanceAnalysis(
            avgIntensity = avgIntensity,
            peakIntensity = peakIntensity,
            consistency = consistency,
            score = score,
            recommendations = recommendations
        )
    }

    data class PerformanceAnalysis(
        val avgIntensity: Double,
        val peakIntensity: Double,
        val consistency: Double,
        val score: Double,
        val recommendations: List<String>
    )
}
