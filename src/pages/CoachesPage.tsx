import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Rating,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Verified,
  Schedule,
  VideoCall,
  EmojiEvents,
  FilterList,
  Search,
  CalendarToday,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import trainerAuthService from '../services/trainerAuthService';
import { TrainerProfile } from '../models/trainer';
import bookingService from '../services/bookingService';

interface CoachData {
  id: string;
  profile: TrainerProfile;
  isOnline: boolean;
  nextAvailable: string;
  totalSessions: number;
  responseTime: string;
}

const CoachesPage: React.FC = () => {
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<CoachData[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<CoachData | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [athleteName, setAthleteName] = useState('');
  const [athleteEmail, setAthleteEmail] = useState('');

  const sports = [
    'Football', 'Basketball', 'Tennis', 'Swimming', 'Athletics', 'Cricket', 'Hockey', 'Badminton', 'Boxing', 'Yoga', 'Wrestling'
  ];

  const sessionTypes = [
    { value: 'technique', label: 'Technique Training', duration: 60, description: 'Focus on improving specific skills and techniques' },
    { value: 'fitness', label: 'Fitness & Conditioning', duration: 45, description: 'Physical conditioning and fitness improvement' },
    { value: 'strategy', label: 'Strategy & Tactics', duration: 90, description: 'Game strategy and tactical understanding' },
    { value: 'assessment', label: 'Performance Assessment', duration: 120, description: 'Comprehensive skill and performance evaluation' },
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-50', label: '$0 - $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-150', label: '$100 - $150' },
    { value: '150+', label: '$150+' },
  ];

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [coaches, selectedSport, priceRange, searchQuery]);

  const loadCoaches = () => {
    console.log('Loading coaches...');
    // Clear existing data and initialize fresh demo data
    localStorage.removeItem('athletex_trainers_db');
    trainerAuthService.initializeDemoData();
    
    // Get verified trainers
    const verifiedTrainers = trainerAuthService.getVerifiedTrainers();
    console.log('Found verified trainers:', verifiedTrainers.length);
    
    const coachData: CoachData[] = verifiedTrainers.map(trainer => ({
      id: trainer.id,
      profile: trainer.profile!,
      isOnline: Math.random() > 0.3,
      nextAvailable: getNextAvailableSlot(),
      totalSessions: Math.floor(Math.random() * 200) + 50,
      responseTime: `${Math.floor(Math.random() * 30) + 5} min`,
    }));

    console.log('Created coach data:', coachData);
    setCoaches(coachData);
  };

  const getNextAvailableSlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const hours = Math.floor(Math.random() * 8) + 9;
    tomorrow.setHours(hours, 0, 0, 0);
    return tomorrow.toISOString();
  };

  const applyFilters = () => {
    let filtered = [...coaches];

    if (searchQuery) {
      filtered = filtered.filter(coach =>
        `${coach.profile.personalDetails.firstName} ${coach.profile.personalDetails.lastName}`
          .toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.profile.sportsExpertise.primarySport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSport !== 'all') {
      filtered = filtered.filter(coach =>
        coach.profile.sportsExpertise.primarySport === selectedSport ||
        coach.profile.sportsExpertise.secondarySports.includes(selectedSport)
      );
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p.replace('+', ''));
      filtered = filtered.filter(coach => {
        const rate = coach.profile.pricing.hourlyRate;
        if (priceRange === '150+') return rate >= 150;
        return rate >= parseInt(min) && rate <= parseInt(max);
      });
    }

    setFilteredCoaches(filtered);
  };

  const handleBookSession = (coach: CoachData) => {
    setSelectedCoach(coach);
    setBookingStep(0);
    setBookingDialogOpen(true);
  };

  const handleBookingNext = () => {
    setBookingStep(prev => prev + 1);
  };

  const handleBookingBack = () => {
    setBookingStep(prev => prev - 1);
  };

  const handleConfirmBooking = () => {
    if (!selectedCoach || !sessionType || !selectedDate || !selectedTime || !athleteName || !athleteEmail) {
      alert('Please fill in all required fields');
      return;
    }

    // Create the booking
    const session = sessionTypes.find(s => s.value === sessionType);
    const booking = bookingService.createBooking({
      coachId: selectedCoach.id,
      coachName: `${selectedCoach.profile.personalDetails.firstName} ${selectedCoach.profile.personalDetails.lastName}`,
      athleteName: athleteName,
      athleteEmail: athleteEmail,
      sessionType: session?.label || sessionType,
      sessionDate: selectedDate,
      sessionTime: selectedTime,
      duration: session?.duration || 60,
      price: getSessionPrice(),
    });

    alert(`Booking confirmed! Your session with ${selectedCoach.profile.personalDetails.firstName} has been booked for ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}. The coach will be notified and you'll receive a confirmation email.`);
    
    setBookingDialogOpen(false);
    resetBookingForm();
  };

  const resetBookingForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSessionType('');
    setAthleteName('');
    setAthleteEmail('');
    setBookingStep(0);
  };

  const getSessionPrice = () => {
    if (!selectedCoach || !sessionType) return 0;
    const session = sessionTypes.find(s => s.value === sessionType);
    const hourlyRate = selectedCoach.profile.pricing.hourlyRate;
    const duration = session?.duration || 60;
    return Math.round((hourlyRate * duration / 60) * 100) / 100;
  };

  const renderBookingStep = () => {
    switch (bookingStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Your Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Email"
                  type="email"
                  value={athleteEmail}
                  onChange={(e) => setAthleteEmail(e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select Session Type</Typography>
            <Grid container spacing={2}>
              {sessionTypes.map((type) => (
                <Grid item xs={12} key={type.value}>
                  <Card
                    variant={sessionType === type.value ? 'elevation' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      border: sessionType === type.value ? 2 : 1,
                      borderColor: sessionType === type.value ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setSessionType(type.value)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {type.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                          <Typography variant="caption">
                            Duration: {type.duration} minutes
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                          ${Math.round((selectedCoach!.profile.pricing.hourlyRate * type.duration / 60) * 100) / 100}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select Date & Time</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Preferred Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Time</InputLabel>
                  <Select
                    value={selectedTime}
                    label="Preferred Time"
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 9).map(hour => (
                      <MenuItem key={hour} value={`${hour}:00`}>
                        {hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Booking Summary</Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Athlete"
                  secondary={`${athleteName} (${athleteEmail})`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Coach"
                  secondary={`${selectedCoach?.profile.personalDetails.firstName} ${selectedCoach?.profile.personalDetails.lastName}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Session Type"
                  secondary={sessionTypes.find(s => s.value === sessionType)?.label}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Date & Time"
                  secondary={`${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Duration"
                  secondary={`${sessionTypes.find(s => s.value === sessionType)?.duration} minutes`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Total Price"
                  secondary={`$${getSessionPrice()}`}
                />
              </ListItem>
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  console.log('Rendering coaches page with', coaches.length, 'coaches and', filteredCoaches.length, 'filtered');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Find Your Perfect Coach
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Connect with verified professional coaches for personalized training sessions
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <FilterList />
          <Typography variant="h6">Find Coaches</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                label="Sport"
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <MenuItem value="all">All Sports</MenuItem>
                {sports.map(sport => (
                  <MenuItem key={sport} value={sport}>{sport}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceRange}
                label="Price Range"
                onChange={(e) => setPriceRange(e.target.value)}
              >
                {priceRanges.map(range => (
                  <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">
          {filteredCoaches.length} coaches available
        </Typography>
      </Box>

      {/* Debug Info */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          Debug: Total coaches loaded: {coaches.length}, Filtered coaches: {filteredCoaches.length}
        </Typography>
      </Box>

      {/* Coaches Grid */}
      <Grid container spacing={3}>
        {filteredCoaches.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No coaches found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {coaches.length === 0 
                  ? 'Loading coaches... Please wait.'
                  : 'Try adjusting your filters or check back later for more coaches.'
                }
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredCoaches.map((coach) => (
            <Grid item xs={12} sm={6} lg={4} key={coach.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  {/* Coach Header */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: coach.isOnline ? 'success.main' : 'grey.500',
                            border: '2px solid white',
                          }}
                        />
                      }
                    >
                      <Avatar sx={{ width: 56, height: 56 }}>
                        {coach.profile.personalDetails.firstName.charAt(0)}
                      </Avatar>
                    </Badge>
                    
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {coach.profile.personalDetails.firstName} {coach.profile.personalDetails.lastName}
                        </Typography>
                        <Verified color="primary" fontSize="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {coach.profile.sportsExpertise.primarySport} Coach
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Rating value={coach.profile.ratings.averageRating} size="small" readOnly />
                        <Typography variant="caption">
                          ({coach.profile.ratings.totalReviews})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Coach Info */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {coach.profile.personalDetails.bio}
                    </Typography>
                    
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                      <Chip
                        label={coach.profile.sportsExpertise.primarySport}
                        size="small"
                        color="primary"
                      />
                      {coach.profile.sportsExpertise.secondarySports.slice(0, 2).map(sport => (
                        <Chip key={sport} label={sport} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmojiEvents fontSize="small" color="action" />
                        <Typography variant="caption">
                          {coach.profile.experience.yearsOfExperience}+ years
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="caption">
                          {coach.responseTime} response
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="caption">
                        Next available: {new Date(coach.nextAvailable).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Pricing */}
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ${coach.profile.pricing.hourlyRate}/hour
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coach.totalSessions} sessions completed
                      </Typography>
                    </Box>
                    <Chip
                      label={coach.isOnline ? 'Online' : 'Offline'}
                      color={coach.isOnline ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<VideoCall />}
                    onClick={() => handleBookSession(coach)}
                  >
                    Book Session
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Book Session with {selectedCoach?.profile.personalDetails.firstName}
            </Typography>
            <IconButton onClick={() => setBookingDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={bookingStep} orientation="vertical">
            <Step>
              <StepLabel>Your Information</StepLabel>
              <StepContent>
                {bookingStep === 0 && renderBookingStep()}
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Choose Session Type</StepLabel>
              <StepContent>
                {bookingStep === 1 && renderBookingStep()}
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Select Date & Time</StepLabel>
              <StepContent>
                {bookingStep === 2 && renderBookingStep()}
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Confirm Booking</StepLabel>
              <StepContent>
                {bookingStep === 3 && renderBookingStep()}
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookingDialogOpen(false)}>
            Cancel
          </Button>
          {bookingStep > 0 && (
            <Button onClick={handleBookingBack}>
              Back
            </Button>
          )}
          {bookingStep < 3 ? (
            <Button
              variant="contained"
              onClick={handleBookingNext}
              disabled={
                (bookingStep === 0 && (!athleteName || !athleteEmail)) ||
                (bookingStep === 1 && !sessionType) ||
                (bookingStep === 2 && (!selectedDate || !selectedTime))
              }
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleConfirmBooking}
            >
              Confirm Booking (${getSessionPrice()})
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoachesPage;