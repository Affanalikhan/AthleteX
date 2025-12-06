import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  Security,
  Shield,
  Lock,
  VerifiedUser,
  Warning,
  CheckCircle,
  Visibility,
  Policy,
  Gavel,
} from '@mui/icons-material';

const SecurityCompliancePage: React.FC = () => {
  const navigate = useNavigate();

  const securityMetrics = [
    { title: 'System Security', value: '99.8%', status: 'excellent', icon: <Shield /> },
    { title: 'Data Compliance', value: '100%', status: 'compliant', icon: <Policy /> },
    { title: 'User Verification', value: '95.2%', status: 'good', icon: <VerifiedUser /> },
    { title: 'Audit Score', value: '98.5%', status: 'excellent', icon: <Gavel /> },
  ];

  const recentActivities = [
    { action: 'Security scan completed', time: '2 hours ago', status: 'success' },
    { action: 'User access review', time: '4 hours ago', status: 'info' },
    { action: 'Compliance check passed', time: '6 hours ago', status: 'success' },
    { action: 'Data backup completed', time: '8 hours ago', status: 'success' },
    { action: 'Failed login attempt detected', time: '12 hours ago', status: 'warning' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#2196f3';
      case 'compliant': return '#00f5ff';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
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
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/sai-portal')}
                sx={{ 
                  color: '#00f5ff',
                  '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' }
                }}
              >
                Back
              </Button>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#00f5ff' }}>
                  Security & Compliance
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Manage platform security, compliance, and audit logs
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                fontWeight: 'bold',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                '&:hover': {
                  boxShadow: 6,
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
        {/* Security Status Alert */}
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            color: '#4caf50',
          }}
        >
          <Typography variant="body1">
            All security systems are operational. Last security audit passed with 98.5% compliance.
          </Typography>
        </Alert>

        {/* Security Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {securityMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${getStatusColor(metric.status)}40`,
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: getStatusColor(metric.status), mb: 1 }}>
                    {React.cloneElement(metric.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h4" sx={{ color: getStatusColor(metric.status) }} fontWeight="bold">
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {metric.title}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(metric.value)} 
                    sx={{ 
                      mt: 1, 
                      height: 4, 
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStatusColor(metric.status),
                      },
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Security Activities */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 245, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Recent Security Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {activity.status === 'success' && <CheckCircle sx={{ color: '#4caf50' }} />}
                      {activity.status === 'warning' && <Warning sx={{ color: '#ff9800' }} />}
                      {activity.status === 'info' && <Visibility sx={{ color: '#2196f3' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff' }}>
                          {activity.action}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {activity.time}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Compliance Status */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 245, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Compliance Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Data Protection (GDPR)
                  </Typography>
                  <Chip label="Compliant" color="success" size="small" sx={{ color: '#fff' }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Sports Authority Guidelines
                  </Typography>
                  <Chip label="Compliant" color="success" size="small" sx={{ color: '#fff' }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Platform Security Standards
                  </Typography>
                  <Chip label="Compliant" color="success" size="small" sx={{ color: '#fff' }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    User Privacy Protection
                  </Typography>
                  <Chip label="Compliant" color="success" size="small" sx={{ color: '#fff' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SecurityCompliancePage;