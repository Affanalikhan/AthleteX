import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
} from '@mui/material';
import {
  FitnessCenter as FitnessIcon,
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MobileLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      title: 'AI Analysis',
      description: 'Advanced pose detection and form analysis',
      color: '#00f5ff',
    },
    {
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      title: 'Track Progress',
      description: 'Monitor your performance over time',
      color: '#4caf50',
    },
    {
      icon: <FitnessIcon sx={{ fontSize: 40 }} />,
      title: 'Personalized Training',
      description: 'Custom workout plans for your goals',
      color: '#ff6b35',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Find Trainers',
      description: 'Connect with certified professionals',
      color: '#ffd700',
    },
  ];

  const stats = [
    { value: '95%', label: 'Performance Boost', icon: <SpeedIcon /> },
    { value: '24/7', label: 'Progress Tracking', icon: <TrendingIcon /> },
    { value: 'AI', label: 'Powered Analysis', icon: <AIIcon /> },
    { value: 'Smart', label: 'Recommendations', icon: <TrophyIcon /> },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
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
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 50%, #00f5ff 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, #0080ff 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, #00f5ff 0%, transparent 50%)
          `,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FitnessIcon sx={{ fontSize: 32, color: '#00f5ff' }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AthleteX
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  px: 2,
                }}
              >
                Athlete Login
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/trainer/login')}
                sx={{
                  borderColor: '#00f5ff',
                  color: '#00f5ff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  px: 2,
                }}
              >
                Trainer Portal
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#fff',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            An AI Training Platform as{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Versatile as You
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#999',
              mb: 4,
              lineHeight: 1.6,
              px: 2,
            }}
          >
            Advanced AI-powered performance analysis for athletes. Get personalized insights,
            training recommendations, and track your progress like never before.
          </Typography>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                backgroundColor: '#00f5ff',
                color: '#000',
                fontWeight: 700,
                fontSize: '1.1rem',
                py: 2,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
                '&:hover': {
                  backgroundColor: '#00d4dd',
                  boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)',
                },
              }}
            >
              Start Training Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1rem',
                py: 1.5,
                borderRadius: 3,
              }}
            >
              View Demo
            </Button>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} key={index}>
              <Card
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Box sx={{ color: '#00f5ff', mb: 1 }}>{stat.icon}</Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Features */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#fff',
              mb: 3,
              textAlign: 'center',
            }}
          >
            Why Choose AthleteX?
          </Typography>
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                mb: 2,
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 3,
                    backgroundColor: `${feature.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: feature.color,
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {feature.icon}
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    {feature.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Final CTA */}
        <Box sx={{ textAlign: 'center', pb: 6 }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 600 }}>
            Ready to Transform Your Training?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              backgroundColor: '#00f5ff',
              color: '#000',
              fontWeight: 700,
              fontSize: '1.1rem',
              py: 2,
              px: 6,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
              '&:hover': {
                backgroundColor: '#00d4dd',
                boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)',
              },
            }}
          >
            Get Started Now
          </Button>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 3 }}>
            © 2025 AthleteX. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default MobileLandingPage;
