import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  FitnessCenter as FitnessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const MobileLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
      }}
    >
      {/* Logo */}
      <Box sx={{ textAlign: 'center', mt: 8, mb: 6 }}>
        <FitnessIcon sx={{ fontSize: 80, color: '#00f5ff', mb: 2 }} />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          AthleteX
        </Typography>
        <Typography variant="body1" sx={{ color: '#999' }}>
          Your AI Training Partner
        </Typography>
      </Box>

      {/* Login Card */}
      <Card
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#fff', mb: 3, textAlign: 'center' }}
          >
            Welcome Back
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#00f5ff' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#00f5ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00f5ff',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#fff',
                fontSize: '1.1rem',
                padding: '16px 14px',
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#00f5ff' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#999' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#00f5ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00f5ff',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#fff',
                fontSize: '1.1rem',
                padding: '16px 14px',
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              backgroundColor: '#00f5ff',
              color: '#000',
              fontWeight: 700,
              fontSize: '1.1rem',
              py: 2,
              borderRadius: 3,
              mb: 2,
              '&:hover': {
                backgroundColor: '#00d4dd',
              },
              '&:disabled': {
                backgroundColor: 'rgba(0, 245, 255, 0.3)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Login'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/signup')}
            sx={{
              color: '#00f5ff',
              fontWeight: 600,
              fontSize: '1rem',
              py: 1.5,
            }}
          >
            Don't have an account? Sign Up
          </Button>
        </CardContent>
      </Card>

      {/* Quick Login */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
          Quick Login (Demo)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setEmail('athlete@test.com');
              setPassword('test123');
            }}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            Athlete
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setEmail('trainer@test.com');
              setPassword('test123');
            }}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            Trainer
          </Button>
        </Box>
      </Box>

      {/* Other Options */}
      <Box sx={{ mt: 'auto', pt: 4, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/trainer/login')}
          sx={{ color: '#999', fontSize: '0.9rem', mb: 1 }}
        >
          Trainer Portal
        </Button>
        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
          © 2025 AthleteX. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default MobileLoginPage;
