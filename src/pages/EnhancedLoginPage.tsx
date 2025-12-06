import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  FitnessCenter,
  Speed,
  Psychology,
  TrendingUp,
  PersonAdd,
  Login,
  ArrowBack,
  Home
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAthlete } from '../hooks/useAthlete';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedLoginPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    displayName: '' 
  });
  const [signUpError, setSignUpError] = useState('');
  
  const { user, loading, error, signIn, signUp, clearError } = useAuth();
  const { profile } = useAthlete();
  const navigate = useNavigate();

  // Redirect logic based on user state and profile completion
  useEffect(() => {
    if (user) {
      if (profile) {
        // User has profile, go to dashboard
        navigate('/profile');
      } else {
        // User exists but no profile, go to profile creation
        navigate('/profile');
      }
    }
  }, [user, profile, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    clearError();
    setSignUpError('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await signIn(signInData.email || 'user', signInData.password || 'pass');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate sign up form
    if (!signUpData.displayName.trim()) {
      setSignUpError('Full name is required');
      return;
    }
    
    if (!signUpData.email.trim()) {
      setSignUpError('Email is required');
      return;
    }
    
    if (!signUpData.password.trim()) {
      setSignUpError('Password is required');
      return;
    }
    
    if (signUpData.password !== signUpData.confirmPassword) {
      setSignUpError('Passwords do not match');
      return;
    }

    try {
      clearError();
      setSignUpError('');
      await signUp(signUpData.email, signUpData.password, signUpData.displayName);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(
            135deg,
            #0a0a0a 0%,
            rgba(0, 245, 255, 0.1) 50%,
            rgba(138, 43, 226, 0.1) 100%
          ),
          radial-gradient(
            ellipse at center,
            rgba(0, 245, 255, 0.15) 0%,
            transparent 70%
          )
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f5ff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          opacity: 0.5
        }}
      />

      {/* Back to Main Page Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            '&:hover': {
              borderColor: '#00f5ff',
              bgcolor: 'rgba(0, 245, 255, 0.1)',
              color: '#00f5ff'
            },
            fontWeight: 'bold',
            textTransform: 'none'
          }}
        >
          Back to Main Page
        </Button>
      </Box>

      {/* Mobile Home Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: { xs: 'block', sm: 'none' }
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{
            minWidth: 'auto',
            width: 48,
            height: 48,
            borderRadius: '50%',
            color: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            '&:hover': {
              borderColor: '#00f5ff',
              bgcolor: 'rgba(0, 245, 255, 0.1)',
              color: '#00f5ff'
            }
          }}
        >
          <Home />
        </Button>
      </Box>
      
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" gap={8}>
          {/* Left Side - Features */}
          <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ mb: 6 }}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2} 
                sx={{ 
                  mb: 3,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
                onClick={() => navigate('/')}
              >
                <FitnessCenter sx={{ fontSize: 40, color: '#00f5ff' }} />
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #00f5ff, #0080ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  AthleteX
                </Typography>
              </Box>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  lineHeight: 1.2
                }}
              >
                Elevate Your
                <br />
                <span style={{ color: '#00f5ff' }}>Athletic Performance</span>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 300,
                  lineHeight: 1.6
                }}
              >
                Join thousands of athletes using AI-powered insights to optimize their training and achieve peak performance.
              </Typography>
            </Box>
            
            {/* Feature Cards */}
            <Box display="flex" flexDirection="column" gap={2}>
              {[
                { icon: <Psychology />, title: 'AI-Powered Analysis', desc: 'Get personalized insights from advanced AI' },
                { icon: <Speed />, title: 'Performance Tracking', desc: 'Monitor progress across all athletic metrics' },
                { icon: <TrendingUp />, title: 'Smart Recommendations', desc: 'Receive training plans tailored for you' }
              ].map((feature, index) => (
                <Card
                  key={index}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ color: '#00f5ff' }}>
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {feature.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
          
          {/* Right Side - Auth Forms */}
          <Box flex={1} display="flex" justifyContent="center">
            <Card
              elevation={20}
              sx={{
                width: '100%',
                maxWidth: 450,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              {/* Header with Tabs */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(138, 43, 226, 0.2))',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  Welcome to AthleteX
                </Typography>
                
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  centered
                  sx={{
                    '& .MuiTab-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '1rem',
                      minWidth: 120
                    },
                    '& .Mui-selected': {
                      color: '#00f5ff !important'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#00f5ff'
                    }
                  }}
                >
                  <Tab 
                    icon={<Login />} 
                    label="Sign In" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<PersonAdd />} 
                    label="Sign Up" 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              <CardContent sx={{ p: 0 }}>
                {/* Error Display */}
                {(error || signUpError) && (
                  <Box sx={{ p: 3, pb: 0 }}>
                    <Alert 
                      severity="error" 
                      onClose={() => {
                        clearError();
                        setSignUpError('');
                      }}
                      sx={{ 
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        color: '#ff6b6b',
                        border: '1px solid rgba(244, 67, 54, 0.3)'
                      }}
                    >
                      {error || signUpError}
                    </Alert>
                  </Box>
                )}

                {/* Sign In Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white',
                      mb: 3,
                      textAlign: 'center'
                    }}
                  >
                    Sign in to access your dashboard
                  </Typography>

                  <Box component="form" onSubmit={handleSignIn}>
                    <TextField
                      label="Username or Email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Enter your username or email..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />
                    
                    <TextField
                      label="Password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Enter your password..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 2,
                        bgcolor: '#00f5ff',
                        color: '#000',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
                        '&:hover': {
                          bgcolor: '#0080ff',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)'
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.5)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Sign In to Dashboard'}
                    </Button>

                    <Box 
                      sx={{ 
                        textAlign: 'center',
                        p: 2,
                        bgcolor: 'rgba(0, 245, 255, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(0, 245, 255, 0.2)'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#00f5ff', fontWeight: 'bold' }}>
                        Demo Mode: Any credentials work!
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Just enter any username and password to explore
                      </Typography>
                    </Box>
                  </Box>
                </TabPanel>

                {/* Sign Up Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white',
                      mb: 3,
                      textAlign: 'center'
                    }}
                  >
                    Create your athlete account
                  </Typography>

                  <Box component="form" onSubmit={handleSignUp}>
                    <TextField
                      label="Full Name"
                      value={signUpData.displayName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Enter your full name..."
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />

                    <TextField
                      label="Email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Enter your email..."
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />
                    
                    <TextField
                      label="Password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Create a password..."
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />

                    <TextField
                      label="Confirm Password"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      fullWidth
                      margin="normal"
                      placeholder="Confirm your password..."
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&:hover fieldset': {
                            borderColor: '#00f5ff'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00f5ff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiInputBase-input': {
                          color: 'white'
                        }
                      }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 2,
                        bgcolor: '#00f5ff',
                        color: '#000',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
                        '&:hover': {
                          bgcolor: '#0080ff',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)'
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.5)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Create Account & Setup Profile'}
                    </Button>

                    <Box 
                      sx={{ 
                        textAlign: 'center',
                        p: 2,
                        bgcolor: 'rgba(0, 245, 255, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(0, 245, 255, 0.2)'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#00f5ff', fontWeight: 'bold' }}>
                        New to AthleteX?
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Sign up to create your profile and start tracking your performance
                      </Typography>
                    </Box>
                  </Box>
                </TabPanel>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default EnhancedLoginPage;