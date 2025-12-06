import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  Verified,
  Pending,
  Close,
  CheckCircle,
  Cancel,
  Home,
  Visibility,
  Download,
  Person,
  School,
  EmojiEvents,
  Schedule,
} from '@mui/icons-material';
import trainerAuthService from '../services/trainerAuthService';
import { TrainerProfile } from '../models/trainer';

interface TrainerApplication {
  id: string;
  trainer: {
    id: string;
    email: string;
    profile: TrainerProfile;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

const TrainerVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<TrainerApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    // Get all trainers and convert to applications format
    const trainers = trainerAuthService.getAllTrainers();
    const mockApplications: TrainerApplication[] = trainers
      .filter(trainer => trainer.profile) // Only include trainers with profiles
      .map(trainer => ({
        id: `app_${trainer.id}`,
        trainer: {
          ...trainer,
          profile: trainer.profile!
        },
        status: trainer.profile!.verification.status === 'verified' ? 'approved' : 
                trainer.profile!.verification.status === 'rejected' ? 'rejected' : 'pending',
        submittedAt: trainer.profile!.createdAt || new Date().toISOString(),
        reviewedAt: trainer.profile!.verification.verificationDate,
        reviewedBy: trainer.profile!.verification.verifiedBy,
        reviewNotes: '',
      }));
    
    setApplications(mockApplications);
  };

  const handleViewApplication = (application: TrainerApplication) => {
    setSelectedApplication(application);
    setReviewNotes(application.reviewNotes || '');
    setDialogOpen(true);
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      // Update trainer verification status
      await trainerAuthService.updateProfile({
        ...application.trainer.profile,
        verification: {
          ...application.trainer.profile!.verification,
          status: 'verified',
          verifiedBy: 'SAI Admin',
          verificationDate: new Date().toISOString(),
        }
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'SAI Admin' }
          : app
      ));

      setDialogOpen(false);
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      // Update trainer verification status
      await trainerAuthService.updateProfile({
        ...application.trainer.profile,
        verification: {
          ...application.trainer.profile!.verification,
          status: 'rejected',
          verifiedBy: 'SAI Admin',
          verificationDate: new Date().toISOString(),
        }
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              status: 'rejected', 
              reviewedAt: new Date().toISOString(), 
              reviewedBy: 'SAI Admin',
              reviewNotes: reviewNotes 
            }
          : app
      ));

      setDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Verified />;
      case 'rejected': return <Cancel />;
      default: return <Pending />;
    }
  };

  const filteredApplications = applications.filter(app => {
    switch (tabValue) {
      case 0: return app.status === 'pending';
      case 1: return app.status === 'approved';
      case 2: return app.status === 'rejected';
      default: return true;
    }
  });

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* Top Navigation Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 245, 255, 0.2)',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/sai-portal')}
                sx={{ 
                  color: '#00f5ff',
                  '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' }
                }}
              >
                Back
              </Button>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#00f5ff' }}>
                  Trainer Verification
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Review and verify trainer applications
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                fontWeight: 'bold',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-1px)',
                  background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                },
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Pending sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Applications Table */}
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`Pending (${stats.pending})`} />
            <Tab label={`Approved (${stats.approved})`} />
            <Tab label={`Rejected (${stats.rejected})`} />
          </Tabs>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trainer</TableCell>
                <TableCell>Sports Expertise</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Qualifications</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar>
                        {application.trainer.profile?.personalDetails.firstName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {application.trainer.profile?.personalDetails.firstName}{' '}
                          {application.trainer.profile?.personalDetails.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.trainer.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {application.trainer.profile?.sportsExpertise.primarySport}
                      </Typography>
                      {application.trainer.profile?.sportsExpertise.secondarySports.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          +{application.trainer.profile.sportsExpertise.secondarySports.length} more
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {application.trainer.profile?.experience.yearsOfExperience} years
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="caption">
                        Degrees: {application.trainer.profile?.qualifications.degrees.length}
                      </Typography>
                      <Typography variant="caption">
                        Certificates: {application.trainer.profile?.qualifications.certificates.length}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(application.status)}
                      label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewApplication(application)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Application Review Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedApplication && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Trainer Application Review
                </Typography>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                {/* Personal Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Person color="primary" />
                        <Typography variant="h6">Personal Details</Typography>
                      </Box>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Name" 
                            secondary={`${selectedApplication.trainer.profile?.personalDetails.firstName} ${selectedApplication.trainer.profile?.personalDetails.lastName}`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Email" 
                            secondary={selectedApplication.trainer.profile?.personalDetails.email} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Phone" 
                            secondary={selectedApplication.trainer.profile?.personalDetails.phone} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Bio" 
                            secondary={selectedApplication.trainer.profile?.personalDetails.bio || 'Not provided'} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Experience */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <EmojiEvents color="primary" />
                        <Typography variant="h6">Experience</Typography>
                      </Box>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Years of Experience" 
                            secondary={`${selectedApplication.trainer.profile?.experience.yearsOfExperience} years`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Previous Clubs" 
                            secondary={selectedApplication.trainer.profile?.experience.previousClubs.join(', ') || 'None listed'} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Achievements" 
                            secondary={selectedApplication.trainer.profile?.experience.achievements.join(', ') || 'None listed'} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Qualifications */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <School color="primary" />
                        <Typography variant="h6">Qualifications</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" gutterBottom>Degrees</Typography>
                          {selectedApplication.trainer.profile?.qualifications.degrees.map((degree, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2">{degree.degree}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {degree.institution} ({degree.graduationYear})
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" gutterBottom>Certificates</Typography>
                          {selectedApplication.trainer.profile?.qualifications.certificates.map((cert, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2">{cert.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {cert.issuingOrganization}
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" gutterBottom>Licenses</Typography>
                          {selectedApplication.trainer.profile?.qualifications.licenses.map((license, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2">{license.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {license.issuingAuthority}
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Review Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Review Notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this application review..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              {selectedApplication.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleRejectApplication(selectedApplication.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApproveApplication(selectedApplication.id)}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default TrainerVerificationPage;