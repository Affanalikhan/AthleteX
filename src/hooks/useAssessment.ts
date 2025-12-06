import { useState, useEffect } from 'react';
import { AssessmentTest, TestType } from '../models';
import assessmentService from '../services/assessmentService';
import { useAuth } from './useAuth';

interface AssessmentState {
  assessments: AssessmentTest[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
}

export const useAssessment = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AssessmentState>({
    assessments: [],
    loading: true,
    error: null,
    uploading: false
  });

  // Get the latest assessment for each test type
  const latestAssessments = state.assessments.reduce<Record<string, AssessmentTest>>((acc, assessment) => {
    const existing = acc[assessment.testType];
    if (!existing || new Date(assessment.timestamp) > new Date(existing.timestamp)) {
      acc[assessment.testType] = assessment;
    }
    return acc;
  }, {});

  useEffect(() => {
    if (user?.uid) {
      loadAssessments();
    }
  }, [user?.uid]);

  const loadAssessments = async () => {
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const assessments = await assessmentService.getAthleteAssessments(user.uid);
      setState(prev => ({ ...prev, assessments, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load assessments';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const createAssessment = async (
    testType: TestType, 
    videoFile: File, 
    notes: string = '',
    manualMeasurements?: {
      timeTaken?: number;
      distance?: number;
      height?: number;
      weight?: number;
      reps?: number;
    }
  ) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, uploading: true, error: null }));
      
      const assessment = await assessmentService.createAssessment(
        user.uid, 
        testType, 
        videoFile, 
        notes,
        manualMeasurements
      );

      // Add new assessment to the beginning of the list
      setState(prev => ({
        ...prev,
        assessments: [assessment, ...prev.assessments],
        uploading: false
      }));

      return assessment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create assessment';
      setState(prev => ({ ...prev, error: errorMessage, uploading: false }));
      throw error;
    }
  };

  const updateAssessmentNotes = async (assessmentId: string, notes: string) => {
    try {
      await assessmentService.updateAssessmentNotes(assessmentId, notes);
      
      // Update local state
      setState(prev => ({
        ...prev,
        assessments: prev.assessments.map(assessment =>
          assessment.id === assessmentId
            ? { ...assessment, notes }
            : assessment
        )
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notes';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const getScoreDisplay = (testType: TestType, score: number) => {
    return assessmentService.getScoreDisplayText(testType, score);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const getAssessmentsByType = (testType: TestType) => {
    return state.assessments.filter(assessment => assessment.testType === testType);
  };

  const getLatestScore = (testType: TestType) => {
    const assessments = getAssessmentsByType(testType);
    return assessments.length > 0 ? assessments[0].score : null;
  };

  const getBestScore = (testType: TestType) => {
    const assessments = getAssessmentsByType(testType);
    if (assessments.length === 0) return null;

    // For fitness tests, higher scores are always better
    return Math.max(...assessments.map(a => a.score));
  };

  return {
    assessments: state.assessments,
    latestAssessments, // Add the latestAssessments to the returned object
    loading: state.loading,
    error: state.error,
    uploading: state.uploading,
    createAssessment,
    updateAssessmentNotes,
    getScoreDisplay,
    getAssessmentsByType,
    getLatestScore,
    getBestScore,
    clearError,
    refetch: loadAssessments
  };
};
