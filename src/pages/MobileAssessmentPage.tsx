import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Videocam as VideoIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MobileNavigation from '../components/MobileNavigation';

const MobileAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const assessmentTypes = [
    {
      id: 'sprint',
      name: '100m Sprint',
      icon: '🏃',
      duration: '2 min',
      difficulty: 'Medium',
      color: '#ff6b35',
      description: 'Test your speed and acceleration',
    },
    {
      id: 'endurance',
      name: 'Endurance Run',
      icon: '🏃‍♂️',
      duration: '12 min',
      difficulty: 'Hard',
      color: '#4caf50',
      description: 'Measure cardiovascular fitness',
    },
    {
      id: 'strength',
      name: 'Strength Test',
      icon: '💪',
      duration: '5 min',
      difficulty: 'Medium',
      color: '#ffd700',
      description: 'Assess muscular strength',
    },
    {
      id: 'agility',
      name: 'Agility Drill',
      icon: '⚡',
      duration: '3 min',
      difficulty: 'Easy',
      color: '#00f5ff',
      description: 'Test quick movements and coordination',
    },
    {
      id: 'flexibility',
      name: 'Flexibility',
      icon: '🧘',
      duration: '4 min',
      difficulty: 'Easy',
      color: '#9c27b0',
      description: 'Evaluate range of motion',
    },
  ];

  const recentScores = [
    { test: 'Sprint', score: 85, date: '2 days ago' },
    { test: 'Strength', score: 78, date: '5 days ago' },
    { test: 'Agility', score: 92, date: '1 week ago' },
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
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
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
            Assessments
          </Typography>
        </Box>

        {/* Stats Card */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff6b35' }}>
                  24
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Completed
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  85
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Avg Score
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffd700' }}>
                  12
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Rank
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Recent Scores */}
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, mb: 2, mt: 2 }}
        >
          Recent Scores
        </Typography>
        {recentScores.map((item, index) => (
          <Card
            key={index}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 1.5,
            }}
          >
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 245, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <TrendingIcon sx={{ color: '#00f5ff' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                  {item.test}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {item.date}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  sx={{ color: '#00f5ff', fontWeight: 700 }}
                >
                  {item.score}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Score
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Assessment Types */}
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, mb: 2, mt: 3 }}
        >
          Start New Assessment
        </Typography>
        {assessmentTypes.map((test) => (
          <Card
            key={test.id}
            onClick={() => setSelectedTest(test.id)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              border: `2px solid ${
                selectedTest === test.id ? test.color : 'rgba(255, 255, 255, 0.1)'
              }`,
              mb: 2,
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    fontSize: '2.5rem',
                    mr: 2,
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    backgroundColor: `${test.color}20`,
                  }}
                >
                  {test.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}
                  >
                    {test.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#999', mb: 1.5, lineHeight: 1.4 }}
                  >
                    {test.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<TimerIcon sx={{ fontSize: '0.9rem' }} />}
                      label={test.duration}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '0.7rem',
                      }}
                    />
                    <Chip
                      label={test.difficulty}
                      size="small"
                      sx={{
                        backgroundColor: test.color,
                        color: '#000',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              {selectedTest === test.id && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<VideoIcon />}
                  sx={{
                    backgroundColor: test.color,
                    color: '#000',
                    fontWeight: 700,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: test.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  Start Assessment
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <MobileNavigation />
    </Box>
  );
};

export default MobileAssessmentPage;
