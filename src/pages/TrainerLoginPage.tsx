import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { School, Verified, TrendingUp, Home } from '@mui/icons-material';

const TrainerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    setLoading(true);
    setError(null);

    // Simple validation - just check if fields are not empty
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    console.log('Validation passed, navigating to dashboard...');
    // Simulate login delay and always succeed
    setTimeout(() => {
      // Create a simple trainer object and store it
      const mockTrainer = {
        id: 'trainer_simple_login',
        email: email,
        role: 'trainer' as const,
        profile: {
          id: 'profile_simple',
          userId: 'trainer_simple_login',
          personalDetails: {
            firstName: 'Demo',
            lastName: 'Trainer',
            email: email,
            phone: '+1-555-0000',
            dateOfBirth: '1990-01-01',
            gender: 'other' as const,
            profilePicture: '',
            bio: 'Demo trainer account',
          },
          verification: {
            status: 'verified' as const,
            verifiedBy: 'System',
            verificationDate: new Date().toISOString(),
            documents: [],
          },
          // Add other required fields with minimal data
          experience: {
            yearsOfExperience: 5,
            previousClubs: [],
            achievements: [],
            specializations: [],
          },
          qualifications: {
            degrees: [],
            certificates: [],
            licenses: [],
          },
          sportsExpertise: {
            primarySport: 'General Fitness',
            secondarySports: [],
            ageGroups: ['adult'],
            skillLevels: ['beginner'],
          },
          pricing: {
            hourlyRate: 50,
            currency: 'USD',
            packageDeals: [],
          },
          availability: {
            timeZone: 'UTC',
            weeklySchedule: {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: [],
            },
            blackoutDates: [],
          },
          ratings: {
            averageRating: 5.0,
            totalReviews: 0,
            reviews: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
      
      // Store the trainer in localStorage
      localStorage.setItem('athletex_trainer_user', JSON.stringify(mockTrainer));
      
      setLoading(false);
      console.log('Navigating to /trainer/dashboard');
      navigate('/trainer/dashboard');
    }, 500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Back to Main Page Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{
              color: '#00f5ff',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(0, 245, 255, 0.1)',
              },
            }}
          >
            Back to Main Page
          </Button>
        </Box>

        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Branding */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white', mb: 4 }}>
              <Typography 
                variant="h2" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #00f5ff, #0080ff)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AthleteX
              </Typography>
              <Typography variant="h4" gutterBottom sx={{ color: '#00f5ff' }}>
                Trainer Portal
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 4 }}>
                Empower athletes. Share your expertise. Build your coaching career.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <School sx={{ fontSize: 40, color: '#00f5ff' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Professional Platform</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Connect with athletes worldwide and grow your coaching business
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Verified sx={{ fontSize: 40, color: '#4caf50' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Verified Credentials</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Showcase your qualifications and build trust with athletes
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Flexible Earnings</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Set your rates and schedule. Earn from live coaching sessions
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
              }}
            >
              <Box textAlign="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#00f5ff' }} gutterBottom>
                  Welcome Back, Coach!
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Sign in to your trainer account
                </Typography>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    background: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    color: '#ff6b6b',
                  }}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: 'rgba(0, 245, 255, 0.3)',
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
                      color: '#ffffff',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: 'rgba(0, 245, 255, 0.3)',
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
                      color: '#ffffff',
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    mb: 3, 
                    py: 1.5,
                    background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 100%)',
                    color: '#000',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 14px rgba(0, 245, 255, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00c4cc 0%, #0066cc 100%)',
                      boxShadow: '0 6px 20px rgba(0, 245, 255, 0.35)',
                    },
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <Box textAlign="center">
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Don't have an account?{' '}
                  <Link to="/trainer/register" style={{ color: '#00f5ff', textDecoration: 'none' }}>
                    Create Trainer Account
                  </Link>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TrainerLoginPage;