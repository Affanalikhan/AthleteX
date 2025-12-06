import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  VideoLibrary,
  Message,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  FitnessCenter,
  EmojiEvents,
  Close,
  Send,
  AttachFile,
  Person,
  School
} from '@mui/icons-material';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { AssessmentTest, TestType } from '../models';

interface SAIAthleteDetailsProps {
  athleteId: string;
  onClose: () => void;
}

interface CoachInteraction {
  id: string;
  coachName: string;
  coachRole: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'call' | 'meeting' | 'assessment';
  status: 'pending' | 'completed' | 'scheduled';
}

const SAIAthleteDetails: React.FC<SAIAthleteDetailsProps> = ({ athleteId, onClose }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [athlete, setAthlete] = useState<any>(null);
  const [assessments, setAssessments] = useState<AssessmentTest[]>([]);
  const [coachInteractions, setCoachInteractions] = useState<CoachInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadAthleteData();
  }, [athleteId]);

  const loadAthleteData = async () => {
    setLoading(true);
    try {
      // Load athlete profile
      const athleteData = {
        id: athleteId,
        name: 'Rahul Sharma',
        age: 16,
        gender: 'male',
        sport: 'Football',
        location: 'Mumbai, Maharashtra',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        school: 'Delhi Public School',
        profilePictureUrl: '/images/athlete-avatar.jpg',
        overallRating: 85,
        potentialRating: 92,
        coachName: 'Coach Suresh Kumar',
        trainingCenter: 'SAI Regional Center - Mumbai'
      };
      setAthlete(athleteData);

      // Load assessments
      const assessmentData: AssessmentTest[] = [
        {
          id: '1',
          athleteId,
          testType: TestType.TENNIS_STANDING_START,
          score: 88,
          videoUrl: '/videos/sprint.mp4',
          timestamp: new Date('2025-11-20'),
          notes: 'Excellent acceleration'
        },
        {
          id: '2',
          athleteId,
          testType: TestType.SIT_UPS,
          score: 82,
          videoUrl: '/videos/situps.mp4',
          timestamp: new Date('2025-11-18'),
          notes: 'Good core strength'
        },
        {
          id: '3',
          athleteId,
          testType: TestType.STANDING_VERTICAL_JUMP,
          score: 90,
          videoUrl: '/videos/jump.mp4',
          timestamp: new Date('2025-11-15'),
          notes: 'Outstanding explosive power'
        },
        {
          id: '4',
          athleteId,
          testType: TestType.ENDURANCE_RUN,
          score: 75,
          videoUrl: '/videos/run.mp4',
          timestamp: new Date('2025-11-12'),
          notes: 'Needs improvement in endurance'
        }
      ];
      setAssessments(assessmentData);

      // Load coach interactions
      const interactions: CoachInteraction[] = [
        {
          id: '1',
          coachName: 'Coach Suresh Kumar',
          coachRole: 'Head Coach - Football',
          message: 'Excellent progress in sprint training. Keep up the good work!',
          timestamp: new Date('2025-11-21'),
          type: 'message',
          status: 'completed'
        },
        {
          id: '2',
          coachName: 'Dr. Priya Mehta',
          coachRole: 'Sports Physiologist',
          message: 'Scheduled fitness assessment for next week',
          timestamp: new Date('2025-11-19'),
          type: 'meeting',
          status: 'scheduled'
        },
        {
          id: '3',
          coachName: 'Coach Rajesh Patel',
          coachRole: 'Strength & Conditioning',
          message: 'Discussed strength training program. Focus on lower body.',
          timestamp: new Date('2025-11-17'),
          type: 'call',
          status: 'completed'
        },
        {
          id: '4',
          coachName: 'Coach Suresh Kumar',
          coachRole: 'Head Coach - Football',
          message: 'Reviewed video analysis of recent match. Good positioning.',
          timestamp: new Date('2025-11-15'),
          type: 'assessment',
          status: 'completed'
        }
      ];
      setCoachInteractions(interactions);
    } catch (error) {
      console.error('Error loading athlete data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTestName = (testType: TestType): string => {
    return testType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp color="success" />;
    if (current < previous) return <TrendingDown color="error" />;
    return null;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const interaction: CoachInteraction = {
        id: Date.now().toString(),
        coachName: 'SAI Administrator',
        coachRole: 'SAI Portal',
        message: newMessage,
        timestamp: new Date(),
        type: 'message',
        status: 'completed'
      };
      setCoachInteractions([interaction, ...coachInteractions]);
      setNewMessage('');
      setShowMessageDialog(false);
    }
  };

  // Prepare chart data
  const assessmentTrendData = assessments
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(assessment => ({
      date: assessment.timestamp.toLocaleDateString(),
      score: assessment.score,
      test: getTestName(assessment.testType)
    }));

  const radarData = [
    { category: 'Speed', value: 88 },
    { category: 'Strength', value: 82 },
    { category: 'Endurance', value: 75 },
    { category: 'Agility', value: 85 },
    { category: 'Power', value: 90 },
    { category: 'Flexibility', value: 78 }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading athlete data...</Typography>
      </Box>
    );
  }

  if (!athlete) {
    return (
      <Alert severity="error">
        Athlete data not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={athlete.profilePictureUrl}
            sx={{ width: 80, height: 80 }}
          >
            {athlete.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5">{athlete.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {athlete.age} years • {athlete.gender} • {athlete.sport}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                icon={<EmojiEvents />}
                label={`Rating: ${athlete.overallRating}/100`}
                color="primary"
                size="small"
              />
              <Chip
                icon={<TrendingUp />}
                label={`Potential: ${athlete.potentialRating}/100`}
                color="success"
                size="small"
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Contact Info */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2">{athlete.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2">{athlete.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2">{athlete.location}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Training Details
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person fontSize="small" />
                <Typography variant="body2">{athlete.coachName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <School fontSize="small" />
                <Typography variant="body2">{athlete.school}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenter fontSize="small" />
                <Typography variant="body2">{athlete.trainingCenter}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="fullWidth">
          <Tab icon={<Assessment />} label="Assessment Results" />
          <Tab icon={<Message />} label="Coach Interactions" />
          <Tab icon={<TrendingUp />} label="Performance Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box>
          {/* Assessment Results */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Assessment Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Type</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Video</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>{getTestName(assessment.testType)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={assessment.score}
                              sx={{
                                width: 100,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getScoreColor(assessment.score)
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {assessment.score}/100
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {assessment.timestamp.toLocaleDateString()}
                        </TableCell>
                        <TableCell>{assessment.notes}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <VideoLibrary />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Performance Radar Chart */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Profile
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#1976d2"
                    fill="#1976d2"
                    fillOpacity={0.6}
                  />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {currentTab === 1 && (
        <Box>
          {/* Coach Interactions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Coach Interactions ({coachInteractions.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setShowMessageDialog(true)}
            >
              Send Message
            </Button>
          </Box>

          <List>
            {coachInteractions.map((interaction, index) => (
              <React.Fragment key={interaction.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Badge
                      badgeContent={
                        interaction.type === 'message' ? <Message fontSize="small" /> :
                        interaction.type === 'call' ? <Phone fontSize="small" /> :
                        interaction.type === 'meeting' ? <CalendarToday fontSize="small" /> :
                        <Assessment fontSize="small" />
                      }
                      color="primary"
                    >
                      <Avatar>{interaction.coachName.charAt(0)}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {interaction.coachName}
                        </Typography>
                        <Chip
                          label={interaction.status}
                          size="small"
                          color={
                            interaction.status === 'completed' ? 'success' :
                            interaction.status === 'scheduled' ? 'warning' : 'default'
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {interaction.coachRole} • {interaction.timestamp.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {interaction.message}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < coachInteractions.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {currentTab === 2 && (
        <Box>
          {/* Performance Analytics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assessment Score Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={assessmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)}
                  </Typography>
                  <Typography variant="caption">
                    Across {assessments.length} tests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Best Performance
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {Math.max(...assessments.map(a => a.score))}
                  </Typography>
                  <Typography variant="caption">
                    {getTestName(assessments.find(a => a.score === Math.max(...assessments.map(a => a.score)))?.testType || TestType.HEIGHT)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Improvement Rate
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    +12%
                  </Typography>
                  <Typography variant="caption">
                    Last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onClose={() => setShowMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message to Athlete</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage} startIcon={<Send />}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SAIAthleteDetails;
