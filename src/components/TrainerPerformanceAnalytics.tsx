import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  People,
  Star,
  Schedule,
  Assessment
} from '@mui/icons-material';
import bookingService from '../services/bookingService';

interface PerformanceData {
  totalEarnings: number;
  totalSessions: number;
  averageRating: number;
  totalAthletes: number;
  monthlyEarnings: { month: string; amount: number }[];
  sessionTypes: { type: string; count: number }[];
  recentFeedback: { athlete: string; rating: number; comment: string; date: string }[];
}

interface TrainerPerformanceAnalyticsProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
}

const TrainerPerformanceAnalytics: React.FC<TrainerPerformanceAnalyticsProps> = ({ 
  open, 
  onClose, 
  trainerId 
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    if (open && trainerId) {
      // Generate performance data based on bookings
      const bookings = bookingService.getBookingsForCoach(trainerId);
      
      const totalEarnings = bookings.reduce((sum, booking) => sum + booking.price, 0);
      const totalSessions = bookings.length;
      const uniqueAthletes = new Set(bookings.map(b => b.athleteEmail)).size;
      
      // Generate monthly earnings (last 6 months)
      const monthlyEarnings = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (let i = 0; i < 6; i++) {
        monthlyEarnings.push({
          month: months[i],
          amount: Math.floor(Math.random() * 500) + 200
        });
      }

      // Session types breakdown
      const sessionTypeCounts = new Map<string, number>();
      bookings.forEach(booking => {
        const count = sessionTypeCounts.get(booking.sessionType) || 0;
        sessionTypeCounts.set(booking.sessionType, count + 1);
      });

      const sessionTypes = Array.from(sessionTypeCounts.entries()).map(([type, count]) => ({
        type,
        count
      }));

      // Generate sample feedback
      const sampleFeedback = [
        { athlete: 'John Smith', rating: 5, comment: 'Excellent coaching! Really helped improve my technique.', date: '2024-11-10' },
        { athlete: 'Sarah Johnson', rating: 4, comment: 'Great session, very knowledgeable trainer.', date: '2024-11-08' },
        { athlete: 'Mike Wilson', rating: 5, comment: 'Amazing workout plan, seeing great results!', date: '2024-11-05' },
        { athlete: 'Emma Davis', rating: 4, comment: 'Professional and motivating coach.', date: '2024-11-03' }
      ];

      setPerformanceData({
        totalEarnings,
        totalSessions,
        averageRating: 4.2 + Math.random() * 0.8, // Random rating between 4.2-5.0
        totalAthletes: uniqueAthletes,
        monthlyEarnings,
        sessionTypes,
        recentFeedback: sampleFeedback
      });
    }
  }, [open, trainerId]);

  if (!performanceData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>Loading analytics...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <TrendingUp color="primary" />
          <Typography variant="h6">Performance Analytics</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney color="success" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      ${performanceData.totalEarnings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Earnings
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
                  <Schedule color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {performanceData.totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
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
                  <People color="info" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {performanceData.totalAthletes}
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
                  <Star color="warning" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {performanceData.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Monthly Earnings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Earnings
                </Typography>
                <List dense>
                  {performanceData.monthlyEarnings.map((month, index) => (
                    <React.Fragment key={month.month}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={month.month}
                          secondary="2024"
                        />
                        <Typography variant="h6" color="success.main">
                          ${month.amount}
                        </Typography>
                      </ListItem>
                      {index < performanceData.monthlyEarnings.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Session Types */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Types
                </Typography>
                {performanceData.sessionTypes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No sessions completed yet
                  </Typography>
                ) : (
                  <List dense>
                    {performanceData.sessionTypes.map((sessionType, index) => (
                      <React.Fragment key={sessionType.type}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={sessionType.type}
                            secondary={`${sessionType.count} session${sessionType.count !== 1 ? 's' : ''}`}
                          />
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {sessionType.count}
                          </Box>
                        </ListItem>
                        {index < performanceData.sessionTypes.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Feedback */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Athlete Feedback
                </Typography>
                <List>
                  {performanceData.recentFeedback.map((feedback, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {feedback.athlete}
                              </Typography>
                              <Box display="flex" alignItems="center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    fontSize="small"
                                    color={i < feedback.rating ? 'warning' : 'disabled'}
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                "{feedback.comment}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(feedback.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < performanceData.recentFeedback.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<Assessment />}>
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainerPerformanceAnalytics;