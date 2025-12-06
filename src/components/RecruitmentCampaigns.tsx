import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Campaign,
  LocationOn,
  SportsSoccer,
  Groups,
  Assessment,
  Email,
  Phone,
  CalendarToday,
  EmojiEvents,
  CheckCircle,
  Info,
  PersonAdd,
  Send
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import recruitmentService, { RecruitmentCampaign } from '../services/recruitmentService';

const RecruitmentCampaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<RecruitmentCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<RecruitmentCampaign | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    age: '',
    sport: '',
    city: '',
    phoneNumber: '',
    experience: '',
    achievements: ''
  });

  useEffect(() => {
    // Load campaigns from service
    const activeCampaigns = recruitmentService.getActiveCampaigns();
    setCampaigns(activeCampaigns);
  }, []);

  const handleRegister = (campaign: RecruitmentCampaign) => {
    if (!user) {
      alert('Please log in to register for campaigns');
      return;
    }

    // Check if already registered
    if (recruitmentService.isUserRegistered(user.uid, campaign.id)) {
      alert('You have already registered for this campaign!');
      return;
    }

    setSelectedCampaign(campaign);
    setRegistrationOpen(true);
    // Pre-fill user data if available
    setRegistrationData(prev => ({
      ...prev,
      fullName: user.displayName || ''
    }));
  };

  const handleSubmitRegistration = () => {
    if (!selectedCampaign || !user) return;

    // Validate required fields
    if (!registrationData.fullName || !registrationData.age || !registrationData.sport || !registrationData.city) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Register using service
      const registration = recruitmentService.registerForCampaign({
        campaignId: selectedCampaign.id,
        campaignName: selectedCampaign.name,
        userId: user.uid,
        userEmail: user.email || '',
        ...registrationData
      });

      alert(`Registration successful! You have registered for ${selectedCampaign.name}. Registration ID: ${registration.id}. You will receive confirmation via email within 24 hours.`);
      
      // Reset form and close dialog
      setRegistrationData({
        fullName: '',
        age: '',
        sport: '',
        city: '',
        phoneNumber: '',
        experience: '',
        achievements: ''
      });
      setRegistrationOpen(false);
      setSelectedCampaign(null);
    } catch (error) {
      alert('Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'upcoming': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  // Filter to show only active and upcoming campaigns
  const availableCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'upcoming');

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <Campaign />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            🇮🇳 SAI Recruitment Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join national talent identification programs across India
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🏆 National Talent Hunt 2024
        </Typography>
        <Typography variant="body2">
          Sports Authority of India is conducting recruitment campaigns across all 29 states. 
          Register now to showcase your talent and get selected for national training programs!
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {availableCampaigns.slice(0, 6).map((campaign) => (
          <Grid item xs={12} sm={6} key={campaign.id}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                    {campaign.name}
                  </Typography>
                  <Chip
                    label={campaign.status.toUpperCase()}
                    color={getStatusColor(campaign.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {campaign.description}
                </Typography>

                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="caption">
                      {campaign.cities.slice(0, 2).join(', ')} +{campaign.cities.length - 2} more
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <SportsSoccer fontSize="small" color="action" />
                    <Typography variant="caption">
                      {campaign.targetSports.slice(0, 3).join(', ')}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Groups fontSize="small" color="action" />
                    <Typography variant="caption">
                      {campaign.recruitmentQuota} positions available
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Assessment fontSize="small" color="action" />
                    <Typography variant="caption">
                      Min Score: {campaign.eligibilityCriteria.minScore}%
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(campaign.shortlisted / campaign.totalApplicants) * 100}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {campaign.shortlisted}/{campaign.totalApplicants} applications processed
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={campaign.status === 'active' ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => handleRegister(campaign)}
                  disabled={campaign.status === 'completed'}
                >
                  {campaign.status === 'active' ? 'Register Now' : 
                   campaign.status === 'upcoming' ? 'Register Early' : 'Closed'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {availableCampaigns.length > 6 && (
        <Box textAlign="center" mt={3}>
          <Button variant="outlined" size="small">
            View All {campaigns.length} Campaigns
          </Button>
        </Box>
      )}

      {/* Registration Dialog */}
      <Dialog open={registrationOpen} onClose={() => setRegistrationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Campaign color="primary" />
            <Box>
              <Typography variant="h6">Register for Campaign</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCampaign?.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name *"
                value={registrationData.fullName}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age *"
                type="number"
                value={registrationData.age}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, age: e.target.value }))}
                inputProps={{ min: 14, max: 25 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Primary Sport *</InputLabel>
                <Select
                  value={registrationData.sport}
                  label="Primary Sport *"
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, sport: e.target.value }))}
                >
                  {selectedCampaign?.targetSports.map(sport => (
                    <MenuItem key={sport} value={sport}>{sport}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>City *</InputLabel>
                <Select
                  value={registrationData.city}
                  label="City *"
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, city: e.target.value }))}
                >
                  {selectedCampaign?.cities.map(city => (
                    <MenuItem key={city} value={city}>{city}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={registrationData.phoneNumber}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sports Experience (years)"
                value={registrationData.experience}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, experience: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Key Achievements"
                placeholder="List your major achievements, awards, or competitions..."
                value={registrationData.achievements}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, achievements: e.target.value }))}
              />
            </Grid>
          </Grid>

          {selectedCampaign && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Campaign Details
              </Typography>
              <Typography variant="body2">
                • Coordinator: {selectedCampaign.coordinator}<br/>
                • Contact: {selectedCampaign.contactEmail}<br/>
                • Duration: {selectedCampaign.startDate} to {selectedCampaign.endDate}<br/>
                • Minimum Score Required: {selectedCampaign.eligibilityCriteria.minScore}%
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRegistrationOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSubmitRegistration}
            disabled={!registrationData.fullName || !registrationData.age || !registrationData.sport || !registrationData.city}
          >
            Submit Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RecruitmentCampaigns;