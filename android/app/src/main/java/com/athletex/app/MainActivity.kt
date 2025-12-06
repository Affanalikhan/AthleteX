package com.athletex.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Register custom plugins
        registerPlugin(AssessmentPlugin::class.java)
        registerPlugin(PerformancePlugin::class.java)
        registerPlugin(VideoAnalysisPlugin::class.java)
        registerPlugin(BiometricsPlugin::class.java)
    }
}
