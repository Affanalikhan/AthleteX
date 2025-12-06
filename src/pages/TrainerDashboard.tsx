import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Person,
  School,
  Star,
  Schedule,
  VideoCall,
  AttachMoney,
  Verified,
  Warning,
  TrendingUp,
  People,
  Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import trainerAuthService from '../services/trainerAuthService';
import { TrainerProfile } from '../models/trainer';
import bookingService, { SessionBooking } from '../services/bookingService';
import TrainerAthletesList from '../components/TrainerAthletesList';
import TrainerVerificationStatus from '../components/TrainerVerificationStatus';
import TrainerPerformanceAnalytics from '../components/TrainerPerformanceAnalytics';
import TrainerAvailabilityManager from '../components/TrainerAvailabilityManager';

const TrainerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(trainerAuthService.getCurrentTrainer());
  const [profile, setProfile] = useState<TrainerProfile | null>(trainer?.profile || null);

  useEffect(() => {
    if (!trainer) {
      navigate('/trainer/login');
      return;
    }

    // Initialize demo data
    trainerAuthService.initializeDemoData();
  }, [trainer, navigate]);

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 8;

    if (profile.personalDetails.firstName && profile.personalDetails.lastName) completed++;
    if (profile.personalDetails.bio) completed++;
    if (profile.sportsExpertise.primarySport) completed++;
    if (profile.experience.yearsOfExperience > 0) completed++;
    if (profile.qualifications.certificates.length > 0) completed++;
    if (profile.pricing.hourlyRate > 0) completed++;
    if (profile.verification.documents.length > 0) completed++;
    if (profile.personalDetails.profilePicture) completed++;

    return Math.round((completed / total) * 100);
  };

  const getVerificationStatus = () => {
    if (!profile) return { color: 'default', text: 'Unknown', icon: <Warning /> };
    
    switch (profile.verification.status) {
      case 'verified':
        return { color: 'success', text: 'Verified', icon: <Verified /> };
      case 'pending':
        return { color: 'warning', text: 'Pending Review', icon: <Schedule /> };
      case 'rejected':
        return { color: 'error', text: 'Rejected', icon: <Warning /> };
      default:
        return { color: 'default', text: 'Not Submitted', icon: <Warning /> };
    }
  };

  // Load real bookings for this trainer
  const [upcomingSessions, setUpcomingSessions] = useState<SessionBooking[]>([]);
  
  // Dialog states
  const [athletesDialogOpen, setAthletesDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);

  useEffect(() => {
    if (trainer) {
      const bookings = bookingService.getUpcomingBookingsForCoach(trainer.id);
      setUpcomingSessions(bookings);
    }
  }, [trainer]);

  const recentEarnings = [
    { date: 'Today', amount: 150, sessions: 2 },
    { date: 'Yesterday', amount: 225, sessions: 3 },
    { date: 'Nov 13', amount: 75, sessions: 1 },
    { date: 'Nov 12', amount: 300, sessions: 4 },
  ];

  const verificationStatus = getVerificationStatus();
  const completionPercentage = getProfileCompletionPercentage();

  if (!trainer || !profile) {
    return (
      <Container>
        <Alert severity="error">
          Unable to load trainer profile. Please try logging in again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#00f5ff' }}>
              Welcome back, {profile.personalDetails.firstName}!
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Manage your coaching sessions and grow your business
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={() => {
              // Clear trainer data and redirect to login
              localStorage.removeItem('athletex_trainer_user');
              navigate('/trainer/login');
            }}
            sx={{
              fontWeight: 'bold',
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            Sign Out
          </Button>
        </Box>

      {/* Profile Completion Alert */}
      {completionPercentage < 100 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/trainer/profile')}
            >
              Complete Profile
            </Button>
          }
        >
          Your profile is {completionPercentage}% complete. Complete it to attract more athletes!
        </Alert>
      )}

      {/* Verification Status Alert */}
      {profile.verification.status !== 'verified' && (
        <Alert 
          severity={profile.verification.status === 'rejected' ? 'error' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/trainer/verification')}
            >
              {profile.verification.status === 'pending' ? 'View Status' : 'Submit Documents'}
            </Button>
          }
        >
          {profile.verification.status === 'pending' 
            ? 'Your verification is under review by SAI. You\'ll be notified once approved.'
            : 'Complete your verification to start accepting paid sessions.'
          }
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <People />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {profile.ratings.totalReviews}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Athletes
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <Star />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {profile.ratings.averageRating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Rating
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <AttachMoney />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        ${profile.pricing.hourlyRate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hourly Rate
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: verificationStatus.color === 'success' ? 'success.main' : 'error.main' }}>
                      {verificationStatus.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {verificationStatus.text}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verification
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Upcoming Sessions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Sessions
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    // Refresh bookings
                    if (trainer) {
                      const bookings = bookingService.getUpcomingBookingsForCoach(trainer.id);
                      setUpcomingSessions(bookings);
                      alert(`Refreshed! Found ${bookings.length} upcoming sessions.`);
                    }
                  }}
                >
                  Refresh
                </Button>
              </Box>

              {upcomingSessions.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No upcoming sessions scheduled
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => setAvailabilityDialogOpen(true)}
                  >
                    Set Your Availability
                  </Button>
                </Box>
              ) : (
                <List>
                  {upcomingSessions.map((session, index) => (
                    <React.Fragment key={session.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar>
                            {session.athleteName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={session.athleteName}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {session.sessionType} • {session.duration} min
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {new Date(session.sessionDate).toLocaleDateString()} at {session.sessionTime}
                              </Typography>
                              <Typography variant="body2" color="success.main">
                                ${session.price}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VideoCall />}
                          onClick={() => {
                            alert(`Join Session: Starting video call with ${session.athleteName} for ${session.sessionType}. Video calling feature coming soon!`);
                          }}
                        >
                          Join
                        </Button>
                      </ListItem>
                      {index < upcomingSessions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Recent Earnings */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Earnings
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    alert('Earnings Details: View detailed earnings breakdown, payment history, tax documents, and payout settings. Coming soon!');
                  }}
                >
                  View Details
                </Button>
              </Box>

              <List>
                {recentEarnings.map((earning, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={earning.date}
                        secondary={`${earning.sessions} sessions`}
                      />
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        ${earning.amount}
                      </Typography>
                    </ListItem>
                    {index < recentEarnings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Profile Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  sx={{ width: 64, height: 64 }}
                  src={profile.personalDetails.profilePicture}
                >
                  {profile.personalDetails.firstName.charAt(0)}
                  {profile.personalDetails.lastName.charAt(0)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {profile.personalDetails.firstName} {profile.personalDetails.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.sportsExpertise.primarySport} Coach
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Chip
                      icon={verificationStatus.icon}
                      label={verificationStatus.text}
                      color={verificationStatus.color as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Profile Completion</Typography>
                  <Typography variant="body2">{completionPercentage}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/trainer/profile')}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Schedule />}
                  onClick={() => setAvailabilityDialogOpen(true)}
                >
                  Manage Availability
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => setAthletesDialogOpen(true)}
                >
                  View Athletes
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<School />}
                  onClick={() => setVerificationDialogOpen(true)}
                >
                  Verification Status
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => setAnalyticsDialogOpen(true)}
                >
                  Performance Analytics
                </Button>

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={() => {
                      // Clear trainer data and redirect to login
                      localStorage.removeItem('athletex_trainer_user');
                      navigate('/trainer/login');
                    }}
                    sx={{
                      borderColor: '#f44336',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#d32f2f',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      },
                    }}
                  >
                    Sign Out
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Container>

      {/* Dialog Components */}
      <TrainerAthletesList
        open={athletesDialogOpen}
        onClose={() => setAthletesDialogOpen(false)}
        trainerId={trainer.id}
      />

      <TrainerVerificationStatus
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        profile={profile}
      />

      <TrainerPerformanceAnalytics
        open={analyticsDialogOpen}
        onClose={() => setAnalyticsDialogOpen(false)}
        trainerId={trainer.id}
      />

      <TrainerAvailabilityManager
        open={availabilityDialogOpen}
        onClose={() => setAvailabilityDialogOpen(false)}
        trainerId={trainer.id}
      />
    </Box>
  );
};

export default TrainerDashboard;