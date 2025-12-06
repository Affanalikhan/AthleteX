/**
 * AI Voice Trainer Service
 * 
 * Provides voice guidance during training sessions using Web Speech API
 */

interface VoiceSettings {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.5-2
  pitch: number; // 0-2
  voice?: SpeechSynthesisVoice;
}

interface TrainingPhase {
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown' | 'complete';
  exerciseName?: string;
  duration?: number;
  reps?: number;
  setNumber?: number;
}

class VoiceTrainerService {
  private synthesis: SpeechSynthesis;
  private settings: VoiceSettings;
  private isSpeaking: boolean = false;
  private messageQueue: string[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = {
      enabled: true,
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0
    };
    
    // Load saved settings
    this.loadSettings();
  }

  /**
   * Check if voice synthesis is supported
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Set voice settings
   */
  updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Enable/disable voice trainer
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  /**
   * Speak a message
   */
  speak(message: string, priority: 'high' | 'normal' = 'normal'): void {
    if (!this.settings.enabled || !this.isSupported()) {
      return;
    }

    // High priority messages interrupt current speech
    if (priority === 'high' && this.isSpeaking) {
      this.stopSpeaking();
    }

    // Add to queue
    if (priority === 'high') {
      this.messageQueue.unshift(message);
    } else {
      this.messageQueue.push(message);
    }

    // Process queue if not already speaking
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  /**
   * Process message queue
   */
  private processQueue(): void {
    if (this.messageQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    const message = this.messageQueue.shift()!;
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = this.settings.volume;
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;

    if (this.settings.voice) {
      utterance.voice = this.settings.voice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      this.processQueue();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      this.currentUtterance = null;
      this.processQueue();
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    this.synthesis.cancel();
    this.messageQueue = [];
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  // ===== Training-Specific Voice Commands =====

  /**
   * Welcome message at start of training
   */
  welcomeMessage(athleteName?: string): void {
    const greeting = athleteName 
      ? `Welcome ${athleteName}! Let's get started with your training session.`
      : 'Welcome! Let\'s get started with your training session.';
    
    this.speak(greeting, 'high');
  }

  /**
   * Announce training phase
   */
  announcePhase(phase: TrainingPhase): void {
    let message = '';

    switch (phase.type) {
      case 'warmup':
        message = 'Starting warm-up. Take it easy and prepare your body for the workout ahead.';
        break;
      
      case 'exercise':
        if (phase.exerciseName) {
          message = `Next exercise: ${phase.exerciseName}.`;
          if (phase.setNumber) {
            message += ` Set ${phase.setNumber}.`;
          }
          if (phase.reps) {
            message += ` ${phase.reps} repetitions.`;
          }
          if (phase.duration) {
            message += ` ${phase.duration} seconds.`;
          }
          message += ' Get ready!';
        }
        break;
      
      case 'rest':
        message = `Rest time. ${phase.duration} seconds to recover. Stay hydrated!`;
        break;
      
      case 'cooldown':
        message = 'Great work! Starting cool-down. Stretch and bring your heart rate down.';
        break;
      
      case 'complete':
        message = 'Workout complete! Excellent job today. Remember to hydrate and stretch.';
        break;
    }

    if (message) {
      this.speak(message, 'high');
    }
  }

  /**
   * Countdown timer announcements
   */
  announceCountdown(seconds: number): void {
    if (seconds === 10) {
      this.speak('10 seconds remaining', 'normal');
    } else if (seconds === 5) {
      this.speak('5', 'normal');
    } else if (seconds === 4) {
      this.speak('4', 'normal');
    } else if (seconds === 3) {
      this.speak('3', 'normal');
    } else if (seconds === 2) {
      this.speak('2', 'normal');
    } else if (seconds === 1) {
      this.speak('1', 'normal');
    } else if (seconds === 0) {
      this.speak('Go!', 'high');
    }
  }

  /**
   * Motivational messages during exercise
   */
  motivate(intensity: 'low' | 'medium' | 'high' = 'medium'): void {
    const motivations = {
      low: [
        'Keep going, you\'re doing great!',
        'Nice and steady, maintain your form.',
        'You\'ve got this!',
        'Stay focused on your technique.'
      ],
      medium: [
        'Push through, you\'re stronger than you think!',
        'Great effort! Keep that intensity up!',
        'You\'re halfway there, don\'t give up!',
        'Excellent form! Keep it going!'
      ],
      high: [
        'Give it everything you\'ve got!',
        'This is where champions are made!',
        'Push harder! You can do this!',
        'Final push! Leave nothing behind!',
        'Beast mode activated! Let\'s go!'
      ]
    };

    const messages = motivations[intensity];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.speak(message, 'normal');
  }

  /**
   * Form correction cues
   */
  correctForm(issue: string): void {
    const corrections: Record<string, string> = {
      'back_straight': 'Keep your back straight.',
      'knees_aligned': 'Align your knees with your toes.',
      'core_engaged': 'Engage your core.',
      'shoulders_back': 'Pull your shoulders back.',
      'full_range': 'Use full range of motion.',
      'controlled_movement': 'Control the movement, don\'t rush.',
      'breathing': 'Remember to breathe steadily.',
      'posture': 'Check your posture.'
    };

    const message = corrections[issue] || 'Focus on your form.';
    this.speak(message, 'high');
  }

  /**
   * Rep counting
   */
  countRep(repNumber: number, totalReps: number): void {
    if (repNumber === Math.floor(totalReps / 2)) {
      this.speak(`Halfway there! ${repNumber} down, ${totalReps - repNumber} to go!`, 'normal');
    } else if (repNumber === totalReps - 3) {
      this.speak('Last 3 reps! Finish strong!', 'normal');
    } else if (repNumber === totalReps) {
      this.speak('Set complete! Well done!', 'normal');
    }
  }

  /**
   * Rest period guidance
   */
  restGuidance(secondsRemaining: number): void {
    if (secondsRemaining === 30) {
      this.speak('30 seconds of rest remaining. Prepare for the next set.', 'normal');
    } else if (secondsRemaining === 10) {
      this.speak('10 seconds. Get ready!', 'normal');
    } else if (secondsRemaining === 3) {
      this.speak('3, 2, 1', 'normal');
    }
  }

  /**
   * Achievement celebration
   */
  celebrate(achievement: string): void {
    const celebrations = [
      `Amazing! ${achievement}`,
      `Incredible work! ${achievement}`,
      `Outstanding! ${achievement}`,
      `You crushed it! ${achievement}`
    ];

    const message = celebrations[Math.floor(Math.random() * celebrations.length)];
    this.speak(message, 'high');
  }

  /**
   * Safety warnings
   */
  warn(warning: string): void {
    this.speak(`Attention! ${warning}`, 'high');
  }

  /**
   * Progress update
   */
  announceProgress(completed: number, total: number): void {
    const percentage = Math.round((completed / total) * 100);
    this.speak(`${percentage}% complete. ${total - completed} exercises remaining.`, 'normal');
  }

  // ===== Settings Management =====

  private saveSettings(): void {
    try {
      localStorage.setItem('voiceTrainerSettings', JSON.stringify({
        enabled: this.settings.enabled,
        volume: this.settings.volume,
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        voiceName: this.settings.voice?.name
      }));
    } catch (error) {
      console.error('Failed to save voice trainer settings:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('voiceTrainerSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings.enabled = settings.enabled ?? true;
        this.settings.volume = settings.volume ?? 0.8;
        this.settings.rate = settings.rate ?? 1.0;
        this.settings.pitch = settings.pitch ?? 1.0;

        // Load voice by name
        if (settings.voiceName) {
          const voices = this.getAvailableVoices();
          const voice = voices.find(v => v.name === settings.voiceName);
          if (voice) {
            this.settings.voice = voice;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voice trainer settings:', error);
    }
  }
}

// Create singleton instance
const voiceTrainerService = new VoiceTrainerService();

// Load voices when available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices are now loaded
    console.log('Voice trainer: Voices loaded');
  };
}

export default voiceTrainerService;
export type { VoiceSettings, TrainingPhase };
