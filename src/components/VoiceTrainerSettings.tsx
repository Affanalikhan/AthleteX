import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  VolumeUp,
  Speed,
  GraphicEq,
  RecordVoiceOver,
  PlayArrow
} from '@mui/icons-material';
import voiceTrainerService, { VoiceSettings } from '../services/voiceTrainerService';

const VoiceTrainerSettings: React.FC = () => {
  const [settings, setSettings] = useState<VoiceSettings>(voiceTrainerService.getSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check support
    setIsSupported(voiceTrainerService.isSupported());

    // Load voices
    const loadVoices = () => {
      const availableVoices = voiceTrainerService.getAvailableVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    // Voices might load asynchronously
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleToggle = (enabled: boolean) => {
    voiceTrainerService.setEnabled(enabled);
    setSettings({ ...settings, enabled });
  };

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const volume = (value as number) / 100;
    voiceTrainerService.updateSettings({ volume });
    setSettings({ ...settings, volume });
  };

  const handleRateChange = (_event: Event, value: number | number[]) => {
    const rate = value as number;
    voiceTrainerService.updateSettings({ rate });
    setSettings({ ...settings, rate });
  };

  const handlePitchChange = (_event: Event, value: number | number[]) => {
    const pitch = value as number;
    voiceTrainerService.updateSettings({ pitch });
    setSettings({ ...settings, pitch });
  };

  const handleVoiceChange = (event: any) => {
    const voiceName = event.target.value;
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      voiceTrainerService.updateSettings({ voice });
      setSettings({ ...settings, voice });
    }
  };

  const testVoice = () => {
    voiceTrainerService.speak('Hello! I am your AI voice trainer. Let\'s have a great workout together!', 'high');
  };

  if (!isSupported) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="warning">
          Voice trainer is not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RecordVoiceOver color="primary" />
          <Typography variant="h6">
            AI Voice Trainer
          </Typography>
        </Box>
        <Switch
          checked={settings.enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          color="primary"
        />
      </Box>

      {settings.enabled && (
        <>
          <Divider sx={{ mb: 3 }} />

          {/* Voice Selection */}
          {voices.length > 0 && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Voice</InputLabel>
              <Select
                value={settings.voice?.name || ''}
                label="Voice"
                onChange={handleVoiceChange}
              >
                {voices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Volume Control */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <VolumeUp fontSize="small" />
              <Typography variant="body2">
                Volume: {Math.round(settings.volume * 100)}%
              </Typography>
            </Box>
            <Slider
              value={settings.volume * 100}
              onChange={handleVolumeChange}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
          </Box>

          {/* Speed Control */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Speed fontSize="small" />
              <Typography variant="body2">
                Speed: {settings.rate.toFixed(1)}x
              </Typography>
            </Box>
            <Slider
              value={settings.rate}
              onChange={handleRateChange}
              min={0.5}
              max={2}
              step={0.1}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1, label: '1x' },
                { value: 2, label: '2x' }
              ]}
            />
          </Box>

          {/* Pitch Control */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GraphicEq fontSize="small" />
              <Typography variant="body2">
                Pitch: {settings.pitch.toFixed(1)}
              </Typography>
            </Box>
            <Slider
              value={settings.pitch}
              onChange={handlePitchChange}
              min={0}
              max={2}
              step={0.1}
              marks={[
                { value: 0, label: 'Low' },
                { value: 1, label: 'Normal' },
                { value: 2, label: 'High' }
              ]}
            />
          </Box>

          {/* Test Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={testVoice}
          >
            Test Voice
          </Button>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              The AI voice trainer will guide you through exercises, count reps, provide motivation, and give form corrections during your workout.
            </Typography>
          </Alert>
        </>
      )}
    </Paper>
  );
};

export default VoiceTrainerSettings;
