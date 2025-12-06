import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Verified,
  Schedule,
  Warning,
  CheckCircle,
  Cancel,
  Description,
  School,
  Badge
} from '@mui/icons-material';
import { TrainerProfile } from '../models/trainer';

interface TrainerVerificationStatusProps {
  open: boolean;
  onClose: () => void;
  profile: TrainerProfile | null;
}

const TrainerVerificationStatus: React.FC<TrainerVerificationStatusProps> = ({ 
  open, 
  onClose, 
  profile 
}) => {
  if (!profile) return null;

  const getStatusInfo = () => {
    switch (profile.verification.status) {
      case 'verified':
        return {
          color: 'success',
          icon: <Verified />,
          title: 'Verification Complete',
          message: 'Your trainer account has been successfully verified by SAI.',
          progress: 100
        };
      case 'pending':
        return {
          color: 'warning',
          icon: <Schedule />,
          title: 'Verification Pending',
          message: 'Your documents are under review by the SAI verification team.',
          progress: 75
        };
      case 'rejected':
        return {
          color: 'error',
          icon: <Cancel />,
          title: 'Verification Rejected',
          message: 'Your verification was rejected. Please review the feedback and resubmit.',
          progress: 25
        };
      default:
        return {
          color: 'info',
          icon: <Warning />,
          title: 'Verification Required',
          message: 'Please submit your documents for verification to start accepting paid sessions.',
          progress: 0
        };
    }
  };

  const statusInfo = getStatusInfo();

  const verificationSteps = [
    {
      title: 'Personal Information',
      completed: profile.personalDetails.firstName && profile.personalDetails.lastName,
      icon: <Badge />
    },
    {
      title: 'Sports Expertise',
      completed: profile.sportsExpertise.primarySport,
      icon: <School />
    },
    {
      title: 'Qualifications',
      completed: profile.qualifications.certificates.length > 0,
      icon: <Description />
    },
    {
      title: 'Document Upload',
      completed: profile.verification.documents.length > 0,
      icon: <Description />
    },
    {
      title: 'SAI Review',
      completed: profile.verification.status === 'verified',
      icon: <Verified />
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {statusInfo.icon}
          <Typography variant="h6">{statusInfo.title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity={statusInfo.color as any} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status: {profile.verification.status.charAt(0).toUpperCase() + profile.verification.status.slice(1)}
          </Typography>
          <Typography variant="body2">
            {statusInfo.message}
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">Verification Progress</Typography>
            <Typography variant="body2">{statusInfo.progress}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={statusInfo.progress}
            color={statusInfo.color as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Verification Steps
        </Typography>
        
        <List dense>
          {verificationSteps.map((step, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                {step.completed ? (
                  <CheckCircle color="success" />
                ) : (
                  React.cloneElement(step.icon, { color: 'disabled' })
                )}
              </ListItemIcon>
              <ListItemText
                primary={step.title}
                secondary={step.completed ? 'Completed' : 'Pending'}
              />
              <Chip
                label={step.completed ? 'Done' : 'Pending'}
                color={step.completed ? 'success' : 'default'}
                size="small"
              />
            </ListItem>
          ))}
        </List>

        {profile.verification.status === 'verified' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🎉 Congratulations!
            </Typography>
            <Typography variant="body2">
              You can now accept paid coaching sessions and appear in athlete searches.
            </Typography>
          </Alert>
        )}

        {profile.verification.status === 'rejected' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rejection Reason
            </Typography>
            <Typography variant="body2">
              Please review your submitted documents and ensure they meet the verification requirements.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {profile.verification.status !== 'verified' && (
          <Button 
            variant="contained" 
            onClick={() => {
              onClose();
              // Navigate to profile page for document upload
              window.location.href = '/trainer/profile';
            }}
          >
            {profile.verification.status === 'rejected' ? 'Resubmit Documents' : 'Complete Verification'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TrainerVerificationStatus;