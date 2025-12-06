import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  Analytics,
  TrendingUp,
  Assessment,
  People,
  Timeline,
  BarChart,
} from '@mui/icons-material';

const PerformanceAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  const analyticsCards = [
    { title: 'Total Users', value: '2,847', icon: <People />, color: '#00f5ff' },
    { title: 'Assessments', value: '1,234', icon: <Assessment />, color: '#4caf50' },
    { title: 'Performance Gain', value: '+23%', icon: <TrendingUp />, color: '#ff9800' },
    { title: 'Active Sessions', value: '156', icon: <Timeline />, color: '#9c27b0' },
  ];

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
                  Performance Analytics
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  View comprehensive reports and analytics across the platform
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
        {/* Analytics Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {analyticsCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${card.color}40`,
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: card.color, mb: 1 }}>
                    {React.cloneElement(card.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h4" sx={{ color: card.color }} fontWeight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Analytics Charts Placeholder */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 245, 255, 0.1)',
                height: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart sx={{ fontSize: 80, color: '#00f5ff', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Performance Trends
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Interactive charts and graphs will be displayed here
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 245, 255, 0.1)',
                height: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Analytics sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Real-time Metrics
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Live performance indicators and KPIs
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PerformanceAnalyticsPage;