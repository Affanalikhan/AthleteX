import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  CheckCircle as CheckIcon,
  PhoneIphone as IOSIcon,
  Android as AndroidIcon,
  Computer as DesktopIcon,
} from '@mui/icons-material';
import {
  canInstallPWA,
  isPWAInstalled,
  showPWAInstallPrompt,
  getPWAInstructions,
  isIOSDevice,
  isAndroidDevice,
} from '../utils/pwaInstall';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check initial state
    setCanInstall(canInstallPWA());
    setIsInstalled(isPWAInstalled());

    // Listen for install availability
    const handleInstallAvailable = () => {
      setCanInstall(true);
      
      // Show prompt after 30 seconds if not dismissed before
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 30000);

      return () => clearTimeout(timer);
    };

    // Listen for app installed
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowPrompt(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await showPWAInstallPrompt();
    
    if (accepted) {
      setShowPrompt(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleShowInstructions = () => {
    setShowPrompt(true);
  };

  const instructions = getPWAInstructions();
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();

  const getPlatformIcon = () => {
    if (isIOS) return <IOSIcon sx={{ fontSize: 48, color: '#00f5ff' }} />;
    if (isAndroid) return <AndroidIcon sx={{ fontSize: 48, color: '#00f5ff' }} />;
    return <DesktopIcon sx={{ fontSize: 48, color: '#00f5ff' }} />;
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button (always visible if can install) */}
      {canInstall && !showPrompt && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            startIcon={<InstallIcon />}
            onClick={isIOS ? handleShowInstructions : handleInstall}
            sx={{
              backgroundColor: '#00f5ff',
              color: '#000',
              fontWeight: 700,
              px: 3,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0, 245, 255, 0.3)',
              '&:hover': {
                backgroundColor: '#00d4dd',
                boxShadow: '0 12px 32px rgba(0, 245, 255, 0.4)',
              },
            }}
          >
            Install App
          </Button>
        </Box>
      )}

      {/* Install Dialog */}
      <Dialog
        open={showPrompt}
        onClose={handleDismiss}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ position: 'relative', pb: 1 }}>
          <IconButton
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#999',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {getPlatformIcon()}
            
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#fff',
                mt: 2,
                mb: 1,
              }}
            >
              Install AthleteX
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: '#999', mb: 3 }}
            >
              Get the full app experience with offline access, push notifications, and faster loading.
            </Typography>
          </Box>

          {/* Benefits */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#00f5ff', mb: 2, fontWeight: 600 }}
            >
              Benefits:
            </Typography>
            <List dense>
              {[
                'Works offline - train anywhere',
                'Faster loading and performance',
                'Push notifications for updates',
                'Full-screen experience',
                'Easy access from home screen',
              ].map((benefit, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={benefit}
                    primaryTypographyProps={{
                      fontSize: 14,
                      color: '#ccc',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Platform-specific instructions */}
          {isIOS && (
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.3)',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ color: '#ff9800', mb: 1, fontWeight: 600 }}
              >
                Installation Steps for {instructions.platform}:
              </Typography>
              <List dense>
                {instructions.instructions.map((step, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography
                        sx={{
                          color: '#ff9800',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={step}
                      primaryTypographyProps={{
                        fontSize: 13,
                        color: '#ffb74d',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleDismiss}
            sx={{ color: '#999' }}
          >
            Maybe Later
          </Button>
          {!isIOS && (
            <Button
              variant="contained"
              onClick={handleInstall}
              startIcon={<InstallIcon />}
              sx={{
                backgroundColor: '#00f5ff',
                color: '#000',
                fontWeight: 700,
                px: 3,
                '&:hover': {
                  backgroundColor: '#00d4dd',
                },
              }}
            >
              Install Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PWAInstallPrompt;
