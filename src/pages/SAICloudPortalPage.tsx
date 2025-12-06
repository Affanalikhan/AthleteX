import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  AccountBalance,
  VerifiedUser,
  Assessment,
  People,
  Analytics,
  Security,
  Dashboard,
  ArrowForward,
  Logout,
} from '@mui/icons-material';

const SAICloudPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalTrainers: 156,
    pendingVerifications: 23,
    verifiedTrainers: 133,
    totalAthletes: 2847,
    activeSessions: 45,
  });

  const features = [
    {
      icon: <VerifiedUser color="primary" />,
      title: 'Trainer Verification',
      description: 'Review and verify trainer credentials, qualifications, and documents',
      action: () => navigate('/sai/trainer-verification'),
    },
    {
      icon: <People color="success" />,
      title: 'Athlete Rankings',
      description: 'View athlete rankings, assessments, and performance data',
      action: () => navigate('/sai/athletes'),
    },
    {
      icon: <Analytics color="info" />,
      title: 'Performance Analytics',
      description: 'View comprehensive reports and analytics across the platform',
      action: () => navigate('/sai/analytics'),
    },
    {
      icon: <Assessment color="warning" />,
      title: 'Assessment Integrity',
      description: 'Monitor assessment integrity and review flagged activities',
      action: () => navigate('/sai/integrity'),
    },
    {
      icon: <Dashboard color="info" />,
      title: 'Platform Dashboard',
      description: 'Main administrative dashboard with system overview',
      action: () => navigate('/sai/dashboard'),
    },
    {
      icon: <Security color="error" />,
      title: 'Security & Compliance',
      description: 'Manage platform security, compliance, and audit logs',
      action: () => navigate('/sai/security'),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
      }}
    >
      {/* Top Navigation Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 245, 255, 0.2)',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <AccountBalance sx={{ fontSize: 32, color: '#00f5ff' }} />
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#00f5ff' }}>
                SAI Cloud Portal
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<Logout />}
              onClick={() => {
                // Clear any SAI session data
                localStorage.removeItem('sai_admin_user');
                localStorage.removeItem('sai_auth_token');
                // Navigate to SAI login page
                navigate('/sai-login');
              }}
              sx={{
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(244, 67, 54, 0.25)',
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                color: '#fff',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(244, 67, 54, 0.35)',
                  transform: 'translateY(-1px)',
                  background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                },
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Main Header */}
        <Paper
          elevation={8}
          sx={{
            p: 4,
            mb: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(0, 245, 255, 0.2)',
          }}
        >
          <Box textAlign="center">
            <AccountBalance sx={{ fontSize: 64, color: '#00f5ff', mb: 2 }} />
            <Typography variant="h2" fontWeight="bold" sx={{ color: '#00f5ff' }} gutterBottom>
              SAI Cloud Portal
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
              Sports Authority of India - Digital Platform Management
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 600, mx: 'auto', mb: 4 }}>
              Comprehensive administrative platform for managing trainer verification, 
              athlete monitoring, and platform analytics
            </Typography>
            
            {/* Welcome Message */}
            <Box sx={{ mt: 4 }}>
              <Box
                sx={{
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  borderRadius: 2,
                  p: 3,
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                <Typography variant="h6" sx={{ color: '#00f5ff', fontWeight: 'bold', mb: 1 }}>
                  🏆 Welcome to SAI Administrative Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Access all administrative functions through the feature cards below
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 245, 255, 0.1)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#00f5ff' }} fontWeight="bold">
                  {stats.totalTrainers}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Trainers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ff9800' }} fontWeight="bold">
                  {stats.pendingVerifications}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Pending Verifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#4caf50' }} fontWeight="bold">
                  {stats.verifiedTrainers}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Verified Trainers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#2196f3' }} fontWeight="bold">
                  {stats.totalAthletes}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Athletes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(156, 39, 176, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#9c27b0' }} fontWeight="bold">
                  {stats.activeSessions}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Active Sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Features */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 245, 255, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 245, 255, 0.2)',
                    border: '1px solid rgba(0, 245, 255, 0.3)',
                  },
                }}
                onClick={feature.action}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                    {feature.icon}
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {feature.description}
                      </Typography>
                    </Box>
                    <ArrowForward sx={{ color: '#00f5ff' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Access */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 245, 255, 0.1)',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
            Quick Access
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                    Trainer Verification Queue
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {stats.pendingVerifications} trainers awaiting verification
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VerifiedUser />}
                    onClick={() => navigate('/sai/trainer-verification')}
                    sx={{
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
                      },
                    }}
                  >
                    Review Applications
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                    Platform Analytics
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    View real-time platform performance metrics
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Dashboard />}
                    onClick={() => navigate('/sai/analytics')}
                    sx={{
                      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      },
                    }}
                  >
                    View Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
            Sports Authority of India - Digital Talent Identification Platform
          </Typography>
          <Typography variant="caption" color="white" sx={{ opacity: 0.6 }}>
            Empowering Indian sports through technology and data-driven insights
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SAICloudPortalPage;