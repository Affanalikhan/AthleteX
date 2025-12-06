import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  FitnessCenter as FitnessIcon,
  LocalFireDepartment as FireIcon
} from '@mui/icons-material';
import { useAthlete } from '../hooks/useAthlete';
import MobileNavigation from '../components/MobileNavigation';

const MobileProfilePage: React.FC = () => {
  const { profile: athlete, loading } = useAthlete();

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  const stats = [
    { label: 'Workouts', value: '24', icon: <FitnessIcon />, color: '#00f5ff' },
    { label: 'Streak', value: '7', icon: <FireIcon />, color: '#ff6b35' },
    { label: 'Level', value: '12', icon: <TrophyIcon />, color: '#ffd700' },
    { label: 'Progress', value: '85%', icon: <TrendingIcon />, color: '#4caf50' },
  ];

  const athleteData = athlete as any;
  const performance = athleteData?.performance || {
    speed: 75,
    endurance: 80,
    strength: 70,
    agility: 85,
    flexibility: 65
  };

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
          background: 'linear-gradient(135deg, #00f5ff 0%, #0080ff 100%)',
          p: 3,
          pt: 5,
          borderRadius: '0 0 30px 30px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#000', fontWeight: 700 }}>
            Profile
          </Typography>
          <IconButton sx={{ color: '#000' }}>
            <SettingsIcon />
          </IconButton>
        </Box>

        {/* Profile Card */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={athleteData?.profilePictureUrl}
                sx={{
                  width: 80,
                  height: 80,
                  border: '4px solid #00f5ff',
                  mr: 2,
                }}
              >
                {athleteData?.name?.[0] || 'A'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                  {athleteData?.name || 'Athlete'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  {athleteData?.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {athleteData?.sportsPlayed?.slice(0, 2).map((sport: string) => (
                    <Chip
                      key={sport}
                      label={sport}
                      size="small"
                      sx={{
                        backgroundColor: '#00f5ff',
                        color: '#000',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <IconButton
                sx={{
                  backgroundColor: '#00f5ff',
                  color: '#000',
                  '&:hover': { backgroundColor: '#00d4dd' },
                }}
              >
                <EditIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid item xs={6} key={stat.label}>
              <Card
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                      color: stat.color,
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Performance Metrics */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#fff', mb: 3 }}
            >
              Performance Metrics
            </Typography>
            {Object.entries(performance).map(([key, value]) => {
              const numValue = value as number;
              return (
                <Box key={key} sx={{ mb: 2.5 }}>
                  <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                    <Grid item>
                      <Typography
                        variant="body2"
                        sx={{ color: '#fff', textTransform: 'capitalize', fontWeight: 500 }}
                      >
                        {key}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography
                        variant="body2"
                        sx={{ color: '#00f5ff', fontWeight: 700 }}
                      >
                        {numValue}%
                      </Typography>
                    </Grid>
                  </Grid>
                  <LinearProgress
                    variant="determinate"
                    value={numValue}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #00f5ff 0%, #0080ff 100%)',
                      },
                    }}
                  />
                </Box>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#00f5ff',
                color: '#000',
                fontWeight: 700,
                py: 1.5,
                mb: 1.5,
                borderRadius: 2,
                '&:hover': { backgroundColor: '#00d4dd' },
              }}
            >
              Edit Profile
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
              }}
            >
              View Achievements
            </Button>
          </CardContent>
        </Card>
      </Box>

      <MobileNavigation />
    </Box>
  );
};

export default MobileProfilePage;
