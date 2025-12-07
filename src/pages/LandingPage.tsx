import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Speed,
  FitnessCenter,
  Timeline,
  Assessment,
  TrendingUp,
  Psychology,
  Groups,
  AdminPanelSettings,
  School,
} from '@mui/icons-material';
import AnimatedSportsBackground from '../components/AnimatedSportsBackground';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: 'AI Performance Analysis',
      description: 'Advanced AI-powered assessment of your athletic performance with personalized insights and recommendations.',
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'Smart Insights',
      description: 'Get detailed analysis of your strengths, weaknesses, and areas for improvement based on your test results.',
    },
    {
      icon: <FitnessCenter sx={{ fontSize: 40 }} />,
      title: 'Training Programs',
      description: 'Personalized training recommendations designed to improve your specific athletic performance metrics.',
    },
    {
      icon: <Timeline sx={{ fontSize: 40 }} />,
      title: 'Progress Tracking',
      description: 'Monitor your improvement over time with comprehensive performance analytics and trend analysis.',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Multiple Test Types',
      description: 'Comprehensive testing for Speed, Agility, Strength, Endurance, Flexibility, and Balance.',
    },
    {
      icon: <Groups sx={{ fontSize: 40 }} />,
      title: 'Social Platform',
      description: 'Connect with other athletes, share achievements, and stay motivated in our athletic community.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', position: 'relative' }}>
      {/* Animated Sports Background */}
      <AnimatedSportsBackground variant="full" />
      
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FitnessCenter sx={{ fontSize: 32, color: '#00f5ff' }} />
              <Typography 
                variant="h5" 
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
            
            <Box display="flex" gap={2}>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ 
                  color: 'white', 
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Athlete Login
              </Button>
              <Button
                variant="outlined"
                startIcon={<School />}
                onClick={() => navigate('/trainer/login')}
                sx={{
                  color: '#00f5ff',
                  borderColor: '#00f5ff',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'rgba(0, 245, 255, 0.1)',
                    borderColor: '#00f5ff'
                  }
                }}
              >
                Trainer Portal
              </Button>
              <Button
                variant="outlined"
                startIcon={<School />}
                onClick={() => navigate('/university-login')}
                sx={{
                  color: '#4caf50',
                  borderColor: '#4caf50',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: '#4caf50'
                  }
                }}
              >
                University Portal
              </Button>
              <Button
                variant="contained"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/sai-login')}
                sx={{
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    boxShadow: 6,
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                SAI Login
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `
            linear-gradient(
              135deg,
              rgba(0, 245, 255, 0.1) 0%,
              rgba(0, 128, 255, 0.1) 50%,
              rgba(138, 43, 226, 0.1) 100%
            ),
            radial-gradient(
              ellipse at center,
              rgba(0, 245, 255, 0.15) 0%,
              transparent 70%
            )
          `,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f5ff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            `,
            opacity: 0.3
          }}
        />
        
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white' }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '4rem' },
                    fontWeight: 900,
                    lineHeight: 1.2,
                    mb: 3,
                    px: { xs: 2, md: 0 },
                    background: 'linear-gradient(135deg, #ffffff, #00f5ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  An AI Training Platform as
                  <br />
                  <span style={{ color: '#00f5ff' }}>Versatile as You</span>
                </Typography>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 300,
                    lineHeight: 1.6,
                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                    px: { xs: 2, md: 0 }
                  }}
                >
                  Advanced AI-powered performance analysis for athletes. 
                  Get personalized insights, training recommendations, and track your progress like never before.
                </Typography>
                
                <Box 
                  display="flex" 
                  gap={{ xs: 2, md: 3 }} 
                  flexWrap="wrap"
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    px: { xs: 2, md: 0 }
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    fullWidth={window.innerWidth < 600}
                    sx={{
                      bgcolor: '#00f5ff',
                      color: '#000',
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.5, md: 2 },
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
                      '&:hover': {
                        bgcolor: '#0080ff',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Training Free
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Timeline />}
                    fullWidth={window.innerWidth < 600}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.5, md: 2 },
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 500,
                      textTransform: 'none',
                      borderRadius: 3,
                      '&:hover': {
                        borderColor: '#00f5ff',
                        bgcolor: 'rgba(0, 245, 255, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View Demo
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 500
                }}
              >
                {/* Athletic Figure Representation */}
                <Box
                  sx={{
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(138, 43, 226, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: -20,
                      bottom: -20,
                      borderRadius: '50%',
                      background: 'conic-gradient(from 0deg, transparent, #00f5ff, transparent, #0080ff, transparent)',
                      animation: 'spin 20s linear infinite',
                      zIndex: -1
                    },
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                >
                  <FitnessCenter sx={{ fontSize: 100, color: '#00f5ff', opacity: 0.8 }} />
                </Box>
                
                {/* Floating Stats */}
                {[
                  { icon: <Speed />, label: '95%', desc: 'Performance Boost', top: '10%', left: '10%' },
                  { icon: <Assessment />, label: 'AI', desc: 'Powered Analysis', top: '20%', right: '5%' },
                  { icon: <TrendingUp />, label: '24/7', desc: 'Progress Tracking', bottom: '15%', left: '5%' },
                  { icon: <Psychology />, label: 'Smart', desc: 'Recommendations', bottom: '10%', right: '10%' }
                ].map((stat, index) => (
                  <Card
                    key={index}
                    sx={{
                      position: 'absolute',
                      [stat.top ? 'top' : 'bottom']: stat.top || stat.bottom,
                      [stat.left ? 'left' : 'right']: stat.left || stat.right,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                      minWidth: 100,
                      animation: `float${index} 3s ease-in-out infinite`,
                      '@keyframes float0': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-10px)' }
                      },
                      '@keyframes float1': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-15px)' }
                      },
                      '@keyframes float2': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-8px)' }
                      },
                      '@keyframes float3': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-12px)' }
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Box sx={{ color: '#00f5ff', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {stat.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          </Grid>
          
          {/* Mobile Stats Section */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 6, px: 2 }}>
            <Grid container spacing={2}>
              {[
                { icon: <Speed />, label: '95%', desc: 'Performance Boost' },
                { icon: <Assessment />, label: 'AI', desc: 'Powered Analysis' },
                { icon: <TrendingUp />, label: '24/7', desc: 'Progress Tracking' },
                { icon: <Psychology />, label: 'Smart', desc: 'Recommendations' }
              ].map((stat, index) => (
                <Grid item xs={6} key={index}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Box sx={{ color: '#00f5ff', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                        {stat.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, bgcolor: 'rgba(10, 10, 10, 0.95)' }}>
        <Container maxWidth="xl">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              mb: 8,
              color: 'white',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffffff, #00f5ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Powerful Features for Elite Athletes
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      bgcolor: 'rgba(0, 245, 255, 0.1)',
                      borderColor: 'rgba(0, 245, 255, 0.3)',
                      boxShadow: '0 20px 40px rgba(0, 245, 255, 0.2)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: '#00f5ff', mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(138, 43, 226, 0.1))',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              mb: 3,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Ready to Elevate Your Performance?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 5,
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300
            }}
          >
            Join thousands of athletes who are already using AthleteX to optimize their training and achieve their goals.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: '#00f5ff',
              color: '#000',
              px: 6,
              py: 3,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
              '&:hover': {
                bgcolor: '#0080ff',
                transform: 'translateY(-3px)',
                boxShadow: '0 15px 50px rgba(0, 245, 255, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Get Started Now - It's Free!
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
