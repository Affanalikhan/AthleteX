/**
 * Offline Assessment Service
 * Handles assessments when offline, with local storage and sync capabilities
 */

import { AssessmentTest, TestType } from '../models';
import offlineModelLoader, { OfflineModelStatus } from './offlineModelLoader';

export interface OfflineAssessment extends AssessmentTest {
  synced: boolean;
  offlineId: string;
  createdOffline: boolean;
  syncAttempts: number;
  lastSyncAttempt?: Date;
}

export interface DetectionStatus {
  fullBodyDetected: boolean;
  movementDetected: boolean;
  correctTestType: boolean;
  modelLoaded: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
}

class OfflineAssessmentService {
  private readonly OFFLINE_ASSESSMENTS_KEY = 'athletex_offline_assessments';
  private readonly MAX_SYNC_ATTEMPTS = 5;

  /**
   * Check if assessment can be performed offline
   */
  async checkOfflineCapability(): Promise<{
    canWorkOffline: boolean;
    modelsAvailable: boolean;
    cameraAvailable: boolean;
    storageAvailable: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let modelsAvailable = false;
    let cameraAvailable = false;
    let storageAvailable = false;

    // Check TensorFlow.js and models
    try {
      await offlineModelLoader.initialize();
      modelsAvailable = true;
    } catch (error) {
      issues.push('ML models not available offline');
    }

    // Check camera access
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameraAvailable = devices.some(device => device.kind === 'videoinput');
      if (!cameraAvailable) {
        issues.push('Camera not available');
      }
    } catch (error) {
      issues.push('Cannot access camera');
    }

    // Check storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      storageAvailable = true;
    } catch (error) {
      issues.push('Local storage not available');
    }

    const canWorkOffline = modelsAvailable && cameraAvailable && storageAvailable;

    return {
      canWorkOffline,
      modelsAvailable,
      cameraAvailable,
      storageAvailable,
      issues
    };
  }

  /**
   * Save assessment offline
   */
  async saveOfflineAssessment(assessment: AssessmentTest): Promise<OfflineAssessment> {
    const offlineAssessment: OfflineAssessment = {
      ...assessment,
      synced: false,
      offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdOffline: true,
      syncAttempts: 0
    };

    const assessments = this.getOfflineAssessments();
    assessments.push(offlineAssessment);
    this.setOfflineAssessments(assessments);

    console.log('💾 Assessment saved offline:', offlineAssessment.offlineId);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncAssessments().catch(error => {
        console.error('Failed to sync immediately:', error);
      });
    }

    return offlineAssessment;
  }

  /**
   * Get all offline assessments
   */
  getOfflineAssessments(): OfflineAssessment[] {
    try {
      const stored = localStorage.getItem(this.OFFLINE_ASSESSMENTS_KEY);
      if (!stored) return [];

      const assessments = JSON.parse(stored);
      return assessments.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        lastSyncAttempt: a.lastSyncAttempt ? new Date(a.lastSyncAttempt) : undefined
      }));
    } catch (error) {
      console.error('Error loading offline assessments:', error);
      return [];
    }
  }

  /**
   * Get unsynced assessments
   */
  getUnsyncedAssessments(): OfflineAssessment[] {
    return this.getOfflineAssessments().filter(a => !a.synced);
  }

  /**
   * Set offline assessments
   */
  private setOfflineAssessments(assessments: OfflineAssessment[]): void {
    try {
      localStorage.setItem(this.OFFLINE_ASSESSMENTS_KEY, JSON.stringify(assessments));
    } catch (error) {
      console.error('Error saving offline assessments:', error);
      throw new Error('Failed to save assessment offline');
    }
  }

  /**
   * Sync offline assessments to server
   */
  async syncAssessments(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    if (!navigator.onLine) {
      console.log('⚠️ Cannot sync: offline');
      return { synced: 0, failed: 0, errors: ['Device is offline'] };
    }

    const unsynced = this.getUnsyncedAssessments();
    if (unsynced.length === 0) {
      console.log('✅ No assessments to sync');
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`🔄 Syncing ${unsynced.length} offline assessments...`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const assessment of unsynced) {
      try {
        // Skip if max sync attempts reached
        if (assessment.syncAttempts >= this.MAX_SYNC_ATTEMPTS) {
          console.log(`⏭️ Skipping assessment ${assessment.offlineId}: max attempts reached`);
          failed++;
          errors.push(`Assessment ${assessment.offlineId}: max sync attempts reached`);
          continue;
        }

        // Attempt to sync
        await this.syncSingleAssessment(assessment);
        
        // Mark as synced
        assessment.synced = true;
        synced++;
        console.log(`✅ Synced assessment: ${assessment.offlineId}`);
      } catch (error) {
        // Update sync attempts
        assessment.syncAttempts++;
        assessment.lastSyncAttempt = new Date();
        failed++;
        
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Assessment ${assessment.offlineId}: ${errorMsg}`);
        console.error(`❌ Failed to sync assessment ${assessment.offlineId}:`, error);
      }
    }

    // Update storage
    this.setOfflineAssessments(this.getOfflineAssessments());

    console.log(`🔄 Sync complete: ${synced} synced, ${failed} failed`);

    return { synced, failed, errors };
  }

  /**
   * Sync a single assessment to server
   */
  private async syncSingleAssessment(assessment: OfflineAssessment): Promise<void> {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://athletex-api-production.up.railway.app';
    
    const response = await fetch(`${apiUrl}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...assessment,
        offlineId: assessment.offlineId,
        createdOffline: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Assessment synced to server:', result);
  }

  /**
   * Delete synced assessments from offline storage
   */
  cleanupSyncedAssessments(): number {
    const assessments = this.getOfflineAssessments();
    const unsynced = assessments.filter(a => !a.synced);
    const removed = assessments.length - unsynced.length;

    this.setOfflineAssessments(unsynced);
    console.log(`🗑️ Cleaned up ${removed} synced assessments`);

    return removed;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    total: number;
    synced: number;
    unsynced: number;
    failed: number;
  } {
    const assessments = this.getOfflineAssessments();
    const synced = assessments.filter(a => a.synced).length;
    const unsynced = assessments.filter(a => !a.synced && a.syncAttempts < this.MAX_SYNC_ATTEMPTS).length;
    const failed = assessments.filter(a => !a.synced && a.syncAttempts >= this.MAX_SYNC_ATTEMPTS).length;

    return {
      total: assessments.length,
      synced,
      unsynced,
      failed
    };
  }

  /**
   * Register for background sync (if supported)
   */
  async registerBackgroundSync(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.log('⚠️ Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-assessments');
      console.log('✅ Background sync registered');
      return true;
    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Check detection status before allowing assessment
   */
  checkDetectionStatus(
    fullBodyDetected: boolean,
    movementDetected: boolean,
    correctTestType: boolean,
    modelStatus: OfflineModelStatus | null
  ): DetectionStatus {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check model status
    if (!modelStatus || !modelStatus.isLoaded) {
      errors.push('ML model not loaded');
    }

    // Check full body detection
    if (!fullBodyDetected) {
      errors.push('Full body not visible in frame');
    }

    // Check movement detection
    if (!movementDetected) {
      errors.push('Required movement not detected');
    }

    // Check test type match
    if (!correctTestType) {
      errors.push('Incorrect exercise for selected test type');
    }

    // Add warnings
    if (modelStatus?.isOffline) {
      warnings.push('Running in offline mode');
    }

    if (modelStatus?.modelSource === 'cache') {
      warnings.push('Using cached model');
    }

    const canProceed = errors.length === 0;

    return {
      fullBodyDetected,
      movementDetected,
      correctTestType,
      modelLoaded: modelStatus?.isLoaded || false,
      canProceed,
      errors,
      warnings
    };
  }
}

const offlineAssessmentService = new OfflineAssessmentService();
export default offlineAssessmentService;
