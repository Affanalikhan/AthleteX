import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import MobileNavigation from '../components/MobileNavigation';

const MobilePerformancePage: React.FC = () => {
  const navigate = useNavigate();

  const performanceData = [
    { date: 'Mon', value: 65 },
    { date: 'Tue', value: 70 },
    { date: 'Wed', value: 68 },
    { date: 'Thu', value: 75 },
    { date: 'Fri', value: 80 },
    { date: 'Sat', value: 78 },
    { date: 'Sun', value: 85 },
  ];

  const metrics = [
    {
      name: 'Speed',
      value: 85,
      change: +12,
      color: '#00f5ff',
      icon: '🏃',
    },
    {
      name: 'Endurance',
      value: 78,
      change: +8,
      color: '#4caf50',
      icon: '💪',
    },
    {
      name: 'Strength',
      value: 72,
      change: -3,
      color: '#ffd700',
      icon: '🏋️',
    },
    {
      name: 'Agility',
      value: 90,
      change: +15,
      color: '#ff6b35',
      icon: '⚡',
    },
  ];

  const recentActivities = [
    {
      type: 'Sprint Training',
      date: 'Today, 6:00 AM',
      duration: '45 min',
      calories: 320,
      participants: 3,
    },
    {
      type: 'Strength Session',
      date: 'Yesterday, 5:30 PM',
      duration: '60 min',
      calories: 450,
      participants: 5,
    },
    {
      type: 'Endurance Run',
      date: '2 days ago',
      duration: '90 min',
      calories: 680,
      participants: 2,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        pb: 10,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
          p: 3,
          pt: 5,
          borderRadius: '0 0 30px 30px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: '#fff', mr: 2 }}
          >
            <BackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
            Performance
          </Typography>
        </Box>

        {/* Chart Card */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#000' }}>
                  85
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Overall Score
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: '1rem' }} />}
                label="+12% this week"
                sx={{
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Box>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={performanceData}>
                <XAxis
                  dataKey="date"
                  stroke="#999"
                  style={{ fontSize: '0.7rem' }}
                />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4caf50"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Metrics Grid */}
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, mb: 2, mt: 2 }}
        >
          Key Metrics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {metrics.map((metric) => (
            <Card
              key={metric.name}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ fontSize: '2rem', mb: 1 }}>{metric.icon}</Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#999', mb: 0.5, fontSize: '0.75rem' }}
                >
                  {metric.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#fff', mr: 1 }}
                  >
                    {metric.value}
                  </Typography>
                  <Chip
                    icon={
                      metric.change > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: '0.8rem' }} />
                      ) : metric.change < 0 ? (
                        <TrendingDownIcon sx={{ fontSize: '0.8rem' }} />
                      ) : (
                        <RemoveIcon sx={{ fontSize: '0.8rem' }} />
                      )
                    }
                    label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      backgroundColor:
                        metric.change > 0
                          ? 'rgba(76, 175, 80, 0.2)'
                          : metric.change < 0
                          ? 'rgba(244, 67, 54, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                      color:
                        metric.change > 0
                          ? '#4caf50'
                          : metric.change < 0
                          ? '#f44336'
                          : '#999',
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: metric.color,
                    },
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Recent Activities */}
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, mb: 2 }}
        >
          Recent Activities
        </Typography>
        {recentActivities.map((activity, index) => (
          <Card
            key={index}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 2,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}
                  >
                    {activity.type}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: '0.9rem', color: '#999' }} />
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {activity.date}
                    </Typography>
                  </Box>
                </Box>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                  {[...Array(activity.participants)].map((_, i) => (
                    <Avatar key={i} sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                      {String.fromCharCode(65 + i)}
                    </Avatar>
                  ))}
                </AvatarGroup>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={activity.duration}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0, 245, 255, 0.1)',
                    color: '#00f5ff',
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label={`${activity.calories} cal`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    color: '#ff6b35',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <MobileNavigation />
    </Box>
  );
};

export default MobilePerformancePage;
