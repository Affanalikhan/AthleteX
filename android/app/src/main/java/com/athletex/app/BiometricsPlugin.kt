package com.athletex.app

import android.content.Context
import android.hardware.biometrics.BiometricPrompt
import android.os.Build
import android.os.CancellationSignal
import androidx.annotation.RequiresApi
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * BiometricsPlugin - Handles biometric authentication
 * Features:
 * - Fingerprint authentication
 * - Face recognition
 * - Biometric availability check
 */
@CapacitorPlugin(name = "Biometrics")
class BiometricsPlugin : Plugin() {

    private var cancellationSignal: CancellationSignal? = null

    /**
     * Check if biometric authentication is available
     */
    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val result = JSObject().apply {
            put("success", true)
            put("available", isBiometricAvailable())
            put("type", getBiometricType())
        }

        call.resolve(result)
    }

    /**
     * Authenticate using biometrics
     */
    @PluginMethod
    fun authenticate(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            call.reject("Biometric authentication requires Android 9.0 or higher")
            return
        }

        if (!isBiometricAvailable()) {
            call.reject("Biometric authentication not available")
            return
        }

        val title = call.getString("title", "Authenticate")
        val subtitle = call.getString("subtitle", "Use your biometric to authenticate")
        val description = call.getString("description", "")

        activity.runOnUiThread {
            showBiometricPrompt(title, subtitle, description, call)
        }
    }

    /**
     * Cancel ongoing authentication
     */
    @PluginMethod
    fun cancelAuthentication(call: PluginCall) {
        cancellationSignal?.cancel()
        cancellationSignal = null

        val result = JSObject().apply {
            put("success", true)
            put("cancelled", true)
        }

        call.resolve(result)
    }

    // Helper methods

    private fun isBiometricAvailable(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return false
        }

        return try {
            val packageManager = context.packageManager
            packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FINGERPRINT) ||
            (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && 
             packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FACE))
        } catch (e: Exception) {
            false
        }
    }

    private fun getBiometricType(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return "none"
        }

        val packageManager = context.packageManager
        return when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && 
            packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FACE) -> "face"
            packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FINGERPRINT) -> "fingerprint"
            else -> "none"
        }
    }

    @RequiresApi(Build.VERSION_CODES.P)
    private fun showBiometricPrompt(
        title: String,
        subtitle: String,
        description: String,
        call: PluginCall
    ) {
        cancellationSignal = CancellationSignal()

        val authenticationCallback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                super.onAuthenticationSucceeded(result)
                
                val response = JSObject().apply {
                    put("success", true)
                    put("authenticated", true)
                    put("timestamp", System.currentTimeMillis())
                }
                
                call.resolve(response)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                super.onAuthenticationError(errorCode, errString)
                
                call.reject("Authentication error: $errString")
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                
                call.reject("Authentication failed")
            }
        }

        val biometricPrompt = BiometricPrompt.Builder(context)
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButton(
                "Cancel",
                context.mainExecutor
            ) { _, _ ->
                call.reject("Authentication cancelled by user")
            }
            .build()

        biometricPrompt.authenticate(
            cancellationSignal,
            context.mainExecutor,
            authenticationCallback
        )
    }
}
