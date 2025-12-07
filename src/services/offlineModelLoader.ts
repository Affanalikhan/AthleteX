/**
 * Offline Model Loader
 * Handles loading and caching of ML models for offline use
 */

import * as tf from '@tensorflow/tfjs';

export interface OfflineModelStatus {
  isLoaded: boolean;
  isOffline: boolean;
  modelSource: 'cache' | 'network' | 'none';
  error?: string;
  loadTime?: number;
}

export interface ModelMetadata {
  name: string;
  version: string;
  path: string;
  size: number;
  lastUpdated: Date;
}

class OfflineModelLoader {
  private models: Map<string, tf.GraphModel | tf.LayersModel> = new Map();
  private modelStatus: Map<string, OfflineModelStatus> = new Map();
  private initialized = false;

  /**
   * Initialize TensorFlow.js with offline support
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing TensorFlow.js for offline use...');
      
      await tf.ready();
      
      // Try to use WebGL backend, fallback to CPU if needed
      try {
        await tf.setBackend('webgl');
        console.log('✅ WebGL backend initialized');
      } catch (error) {
        console.warn('⚠️ WebGL not available, using CPU backend');
        await tf.setBackend('cpu');
      }

      console.log('✅ TensorFlow.js initialized');
      console.log('Backend:', tf.getBackend());
      console.log('Memory:', tf.memory());

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js:', error);
      throw new Error(`TensorFlow.js initialization failed: ${error}`);
    }
  }

  /**
   * Load a model from local storage or cache
   * Falls back to network if not available offline
   */
  async loadModel(modelName: string, modelPath: string): Promise<OfflineModelStatus> {
    console.log(`📦 Loading model: ${modelName} from ${modelPath}`);
    
    const startTime = performance.now();
    const isOffline = !navigator.onLine;

    try {
      // Check if model is already loaded
      if (this.models.has(modelName)) {
        console.log(`✅ Model ${modelName} already loaded`);
        return {
          isLoaded: true,
          isOffline,
          modelSource: 'cache',
          loadTime: 0
        };
      }

      // Ensure TensorFlow.js is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Try to load from local path first (for offline support)
      let model: tf.GraphModel | tf.LayersModel;
      let modelSource: 'cache' | 'network' = 'cache';

      try {
        // Load from local public folder
        const localPath = `${window.location.origin}${modelPath}`;
        console.log(`Attempting to load from local path: ${localPath}`);
        
        model = await tf.loadGraphModel(localPath);
        modelSource = isOffline ? 'cache' : 'network';
        console.log(`✅ Model loaded from ${modelSource}`);
      } catch (localError) {
        console.warn(`⚠️ Failed to load from local path:`, localError);
        
        // If offline, we can't load from network
        if (isOffline) {
          throw new Error('Model not available offline and no network connection');
        }

        // Try loading from CDN as fallback
        console.log('Attempting to load from network...');
        model = await tf.loadGraphModel(modelPath);
        modelSource = 'network';
        console.log('✅ Model loaded from network');
      }

      // Store the model
      this.models.set(modelName, model);

      const loadTime = performance.now() - startTime;
      const status: OfflineModelStatus = {
        isLoaded: true,
        isOffline,
        modelSource,
        loadTime
      };

      this.modelStatus.set(modelName, status);
      console.log(`✅ Model ${modelName} loaded successfully in ${loadTime.toFixed(2)}ms`);

      return status;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelName}:`, error);
      
      const status: OfflineModelStatus = {
        isLoaded: false,
        isOffline,
        modelSource: 'none',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.modelStatus.set(modelName, status);
      return status;
    }
  }

  /**
   * Get a loaded model
   */
  getModel(modelName: string): tf.GraphModel | tf.LayersModel | null {
    return this.models.get(modelName) || null;
  }

  /**
   * Get model status
   */
  getModelStatus(modelName: string): OfflineModelStatus | null {
    return this.modelStatus.get(modelName) || null;
  }

  /**
   * Check if model is available offline
   */
  async isModelCached(modelPath: string): Promise<boolean> {
    try {
      const cache = await caches.open('athletex-models-v1');
      const response = await cache.match(modelPath);
      return response !== undefined;
    } catch (error) {
      console.error('Error checking model cache:', error);
      return false;
    }
  }

  /**
   * Cache model files for offline use
   */
  async cacheModel(modelPath: string): Promise<boolean> {
    try {
      console.log(`💾 Caching model: ${modelPath}`);
      
      const cache = await caches.open('athletex-models-v1');
      
      // Fetch and cache the model.json file
      const modelJsonResponse = await fetch(`${modelPath}/model.json`);
      if (!modelJsonResponse.ok) {
        throw new Error(`Failed to fetch model.json: ${modelJsonResponse.statusText}`);
      }
      
      await cache.put(`${modelPath}/model.json`, modelJsonResponse.clone());
      
      // Parse model.json to get weight file names
      const modelJson = await modelJsonResponse.json();
      const weightFiles = modelJson.weightsManifest?.[0]?.paths || [];
      
      // Cache each weight file
      for (const weightFile of weightFiles) {
        const weightPath = `${modelPath}/${weightFile}`;
        const weightResponse = await fetch(weightPath);
        
        if (weightResponse.ok) {
          await cache.put(weightPath, weightResponse);
          console.log(`✅ Cached: ${weightFile}`);
        }
      }
      
      console.log(`✅ Model cached successfully: ${modelPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to cache model:`, error);
      return false;
    }
  }

  /**
   * Preload all models for offline use
   */
  async preloadModels(): Promise<void> {
    console.log('📦 Preloading models for offline use...');
    
    const modelPaths = [
      '/models/pose-detection',
      '/models/movement-classifier',
      '/models/form-analyzer'
    ];

    for (const modelPath of modelPaths) {
      try {
        await this.cacheModel(modelPath);
      } catch (error) {
        console.error(`Failed to preload model ${modelPath}:`, error);
      }
    }

    console.log('✅ Model preloading complete');
  }

  /**
   * Unload a model to free memory
   */
  unloadModel(modelName: string): void {
    const model = this.models.get(modelName);
    if (model) {
      model.dispose();
      this.models.delete(modelName);
      this.modelStatus.delete(modelName);
      console.log(`🗑️ Unloaded model: ${modelName}`);
    }
  }

  /**
   * Unload all models
   */
  unloadAllModels(): void {
    this.models.forEach((model, modelName) => {
      model.dispose();
      console.log(`🗑️ Unloaded model: ${modelName}`);
    });
    
    this.models.clear();
    this.modelStatus.clear();
    console.log('🗑️ All models unloaded');
  }

  /**
   * Get memory usage
   */
  getMemoryInfo(): tf.MemoryInfo {
    return tf.memory();
  }

  /**
   * Check if system is offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get all model statuses
   */
  getAllModelStatuses(): Map<string, OfflineModelStatus> {
    return new Map(this.modelStatus);
  }
}

const offlineModelLoader = new OfflineModelLoader();
export default offlineModelLoader;
