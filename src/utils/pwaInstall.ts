/**
 * PWA Installation Utilities
 * Handles "Add to Home Screen" prompts and installation
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('[PWA] Install prompt available');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is running in standalone mode');
    }
  }

  /**
   * Check if PWA can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  /**
   * Check if PWA is already installed
   */
  isAppInstalled(): boolean {
    return this.isInstalled || window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);

      // Clear the deferred prompt
      this.deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Get installation instructions for iOS
   */
  getIOSInstructions(): string[] {
    return [
      'Tap the Share button',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right corner',
      'AthleteX will appear on your home screen',
    ];
  }

  /**
   * Detect if running on iOS
   */
  isIOS(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  /**
   * Detect if running on Android
   */
  isAndroid(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
  }

  /**
   * Get platform-specific instructions
   */
  getPlatformInstructions(): { platform: string; instructions: string[] } {
    if (this.isIOS()) {
      return {
        platform: 'iOS',
        instructions: this.getIOSInstructions(),
      };
    }

    if (this.isAndroid()) {
      return {
        platform: 'Android',
        instructions: [
          'Tap the menu button (three dots)',
          'Tap "Add to Home screen" or "Install app"',
          'Tap "Add" or "Install"',
          'AthleteX will appear on your home screen',
        ],
      };
    }

    return {
      platform: 'Desktop',
      instructions: [
        'Click the install icon in the address bar',
        'Or use the browser menu to install',
        'AthleteX will open in its own window',
      ],
    };
  }
}

// Export singleton instance
export const pwaInstaller = new PWAInstaller();

// Export utility functions
export const canInstallPWA = () => pwaInstaller.canInstall();
export const isPWAInstalled = () => pwaInstaller.isAppInstalled();
export const showPWAInstallPrompt = () => pwaInstaller.showInstallPrompt();
export const getPWAInstructions = () => pwaInstaller.getPlatformInstructions();
export const isIOSDevice = () => pwaInstaller.isIOS();
export const isAndroidDevice = () => pwaInstaller.isAndroid();
