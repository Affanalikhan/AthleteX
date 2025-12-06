import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Edit,
  Add,
  Delete,
  Save,
  Cancel,
  CloudUpload,
  Verified,
  Warning,
  School,
  EmojiEvents,
  AttachMoney,
  Schedule,
  Security,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import trainerAuthService from '../services/trainerAuthService';
import { TrainerProfile, Degree, Certificate, License } from '../models/trainer';
import TrainerKYCVerification from '../components/TrainerKYCVerification';

const TrainerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(trainerAuthService.getCurrentTrainer());
  const [profile, setProfile] = useState<TrainerProfile | null>(trainer?.profile || null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'degree' | 'certificate' | 'license'>('degree');
  const [kycDialogOpen, setKycDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!trainer) {
      navigate('/trainer/login');
      return;
    }
  }, [trainer, navigate]);

  const handleSaveProfile = async (data: any) => {
    if (!profile) return;

    setLoading(true);
    try {
      const updatedProfile = await trainerAuthService.updateProfile({
        ...profile,
        personalDetails: {
          ...profile.personalDetails,
          ...data,
        },
        sportsExpertise: {
          ...profile.sportsExpertise,
          primarySport: data.primarySport,
          secondarySports: data.secondarySports?.split(',').map((s: string) => s.trim()) || [],
        },
        pricing: {
          ...profile.pricing,
          hourlyRate: parseFloat(data.hourlyRate) || 0,
        },
      });

      setProfile(updatedProfile);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQualification = (type: 'degree' | 'certificate' | 'license') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDeleteQualification = async (type: 'degree' | 'certificate' | 'license', id: string) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    
    switch (type) {
      case 'degree':
        updatedProfile.qualifications.degrees = updatedProfile.qualifications.degrees.filter(d => d.id !== id);
        break;
      case 'certificate':
        updatedProfile.qualifications.certificates = updatedProfile.qualifications.certificates.filter(c => c.id !== id);
        break;
      case 'license':
        updatedProfile.qualifications.licenses = updatedProfile.qualifications.licenses.filter(l => l.id !== id);
        break;
    }

    try {
      const updated = await trainerAuthService.updateProfile(updatedProfile);
      setProfile(updated);
    } catch (error) {
      console.error('Error deleting qualification:', error);
    }
  };

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

  if (!trainer || !profile) {
    return (
      <Container>
        <Alert severity="error">
          Unable to load trainer profile. Please try logging in again.
        </Alert>
      </Container>
    );
  }

  const verificationStatus = getVerificationStatus();
  const completionPercentage = getProfileCompletionPercentage();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Trainer Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your professional coaching profile
        </Typography>
      </Box>

      {/* Profile Completion */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Profile Completion</Typography>
            <Typography variant="h6" color="primary">
              {completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage}
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Complete your profile to attract more athletes and increase bookings
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Personal Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Personal Information</Typography>
                <Button
                  startIcon={editMode ? <Cancel /> : <Edit />}
                  onClick={() => {
                    if (editMode) {
                      reset();
                    }
                    setEditMode(!editMode);
                  }}
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </Button>
              </Box>

              {editMode ? (
                <form onSubmit={handleSubmit(handleSaveProfile)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...register('firstName', { required: 'First name is required' })}
                        fullWidth
                        label="First Name"
                        defaultValue={profile.personalDetails.firstName}
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message as string}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...register('lastName', { required: 'Last name is required' })}
                        fullWidth
                        label="Last Name"
                        defaultValue={profile.personalDetails.lastName}
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message as string}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        {...register('bio')}
                        fullWidth
                        multiline
                        rows={3}
                        label="Professional Bio"
                        defaultValue={profile.personalDetails.bio}
                        placeholder="Tell athletes about your coaching philosophy and experience..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...register('primarySport', { required: 'Primary sport is required' })}
                        fullWidth
                        label="Primary Sport"
                        defaultValue={profile.sportsExpertise.primarySport}
                        error={!!errors.primarySport}
                        helperText={errors.primarySport?.message as string}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...register('hourlyRate', { required: 'Hourly rate is required' })}
                        fullWidth
                        type="number"
                        label="Hourly Rate ($)"
                        defaultValue={profile.pricing.hourlyRate}
                        error={!!errors.hourlyRate}
                        helperText={errors.hourlyRate?.message as string}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        {...register('secondarySports')}
                        fullWidth
                        label="Secondary Sports (comma separated)"
                        defaultValue={profile.sportsExpertise.secondarySports.join(', ')}
                        placeholder="Basketball, Tennis, Swimming"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<Save />}
                          disabled={loading}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1" paragraph>
                      {profile.personalDetails.bio || 'No bio provided yet.'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Primary Sport</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.sportsExpertise.primarySport || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Hourly Rate</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${profile.pricing.hourlyRate}/hour
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Secondary Sports</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {profile.sportsExpertise.secondarySports.map(sport => (
                        <Chip key={sport} label={sport} size="small" />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EmojiEvents color="primary" />
                <Typography variant="h6">Experience</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Years of Experience</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.experience.yearsOfExperience} years
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Previous Clubs</Typography>
                  <List dense>
                    {profile.experience.previousClubs.map((club, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={club} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <School color="primary" />
                <Typography variant="h6">Qualifications</Typography>
              </Box>

              {/* Degrees */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Degrees</Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => handleAddQualification('degree')}
                  >
                    Add Degree
                  </Button>
                </Box>
                <List dense>
                  {profile.qualifications.degrees.map((degree) => (
                    <ListItem key={degree.id}>
                      <ListItemText
                        primary={`${degree.degree} in ${degree.field}`}
                        secondary={`${degree.institution} (${degree.graduationYear})`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteQualification('degree', degree.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Certificates */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Certificates</Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => handleAddQualification('certificate')}
                  >
                    Add Certificate
                  </Button>
                </Box>
                <List dense>
                  {profile.qualifications.certificates.map((cert) => (
                    <ListItem key={cert.id}>
                      <ListItemText
                        primary={cert.name}
                        secondary={cert.issuingOrganization}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteQualification('certificate', cert.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Licenses */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Licenses</Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => handleAddQualification('license')}
                  >
                    Add License
                  </Button>
                </Box>
                <List dense>
                  {profile.qualifications.licenses.map((license) => (
                    <ListItem key={license.id}>
                      <ListItemText
                        primary={license.name}
                        secondary={`${license.issuingAuthority} - ${license.licenseNumber}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteQualification('license', license.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Profile Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                src={profile.personalDetails.profilePicture}
              >
                {profile.personalDetails.firstName.charAt(0)}
                {profile.personalDetails.lastName.charAt(0)}
              </Avatar>
              
              <Typography variant="h6" fontWeight="bold">
                {profile.personalDetails.firstName} {profile.personalDetails.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profile.sportsExpertise.primarySport} Coach
              </Typography>

              <Box display="flex" justifyContent="center" mb={2}>
                <Chip
                  icon={verificationStatus.icon}
                  label={verificationStatus.text}
                  color={verificationStatus.color as any}
                  size="small"
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
              >
                Upload Photo
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box textAlign="left">
                <Typography variant="subtitle2" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.personalDetails.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.personalDetails.phone}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* KYC Verification Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security color="primary" />
                <Typography variant="h6">KYC Verification</Typography>
              </Box>

              {profile.verification.kyc ? (
                <Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">Aadhar Card</Typography>
                      {profile.verification.kyc.aadharCard?.verified ? (
                        <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                      ) : (
                        <Chip icon={<Warning />} label="Pending" color="warning" size="small" />
                      )}
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">PAN Card</Typography>
                      {profile.verification.kyc.panCard?.verified ? (
                        <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                      ) : (
                        <Chip icon={<Warning />} label="Pending" color="warning" size="small" />
                      )}
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">Email</Typography>
                      {profile.verification.kyc.email?.verified ? (
                        <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                      ) : (
                        <Chip icon={<Warning />} label="Pending" color="warning" size="small" />
                      )}
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">Phone</Typography>
                      {profile.verification.kyc.phone?.verified ? (
                        <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                      ) : (
                        <Chip icon={<Warning />} label="Pending" color="warning" size="small" />
                      )}
                    </Box>
                  </Box>

                  {!profile.verification.kyc.aadharCard?.verified ||
                   !profile.verification.kyc.panCard?.verified ||
                   !profile.verification.kyc.email?.verified ||
                   !profile.verification.kyc.phone?.verified ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Security />}
                      onClick={() => setKycDialogOpen(true)}
                    >
                      Complete KYC
                    </Button>
                  ) : (
                    <Alert severity="success" icon={<Verified />}>
                      KYC verification complete!
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Complete KYC verification to become a verified trainer
                  </Alert>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Security />}
                    onClick={() => setKycDialogOpen(true)}
                  >
                    Start KYC Verification
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verification Status
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {verificationStatus.icon}
                <Typography variant="body1" fontWeight="bold">
                  {verificationStatus.text}
                </Typography>
              </Box>

              {profile.verification.status === 'pending' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Your verification is under review. You'll be notified once approved.
                </Alert>
              )}

              {profile.verification.status === 'rejected' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Your verification was rejected. Please contact support for more information.
                </Alert>
              )}

              {profile.verification.status !== 'verified' && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/trainer/verification')}
                >
                  Submit for Verification
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Qualification Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
        </DialogTitle>
        <DialogContent>
          {/* Dialog content would go here for adding qualifications */}
          <Typography>
            Qualification form would be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* KYC Verification Dialog */}
      <Dialog 
        open={kycDialogOpen} 
        onClose={() => setKycDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Security color="primary" />
            <Typography variant="h6">Complete KYC Verification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TrainerKYCVerification 
              onComplete={() => {
                setKycDialogOpen(false);
                // Refresh profile data
                window.location.reload();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainerProfilePage;