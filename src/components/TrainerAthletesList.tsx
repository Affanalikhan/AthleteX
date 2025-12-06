import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { Person, Star, Schedule } from '@mui/icons-material';
import bookingService from '../services/bookingService';

interface Athlete {
  id: string;
  name: string;
  email: string;
  totalSessions: number;
  lastSession: string;
  rating: number;
  status: 'active' | 'inactive';
}

interface TrainerAthletesListProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
}

const TrainerAthletesList: React.FC<TrainerAthletesListProps> = ({ open, onClose, trainerId }) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    if (open && trainerId) {
      // Get all bookings for this trainer and extract unique athletes
      const bookings = bookingService.getBookingsForCoach(trainerId);
      
      // Group bookings by athlete
      const athleteMap = new Map<string, Athlete>();
      
      bookings.forEach(booking => {
        const athleteKey = booking.athleteEmail;
        
        if (athleteMap.has(athleteKey)) {
          const athlete = athleteMap.get(athleteKey)!;
          athlete.totalSessions += 1;
          // Update last session if this one is more recent
          if (new Date(booking.sessionDate) > new Date(athlete.lastSession)) {
            athlete.lastSession = booking.sessionDate;
          }
        } else {
          athleteMap.set(athleteKey, {
            id: booking.athleteEmail,
            name: booking.athleteName,
            email: booking.athleteEmail,
            totalSessions: 1,
            lastSession: booking.sessionDate,
            rating: 4.0 + Math.random() * 1.0, // Random rating between 4-5
            status: Math.random() > 0.3 ? 'active' : 'inactive'
          });
        }
      });
      
      setAthletes(Array.from(athleteMap.values()));
    }
  }, [open, trainerId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Person color="primary" />
          <Typography variant="h6">Your Athletes</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {athletes.length === 0 ? (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              No Athletes Yet
            </Typography>
            <Typography variant="body2">
              Athletes who book sessions with you will appear here. Share your trainer profile to start getting bookings!
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You have {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} who have booked sessions with you.
            </Typography>
            
            <List>
              {athletes.map((athlete, index) => (
                <React.Fragment key={athlete.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {athlete.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {athlete.name}
                          </Typography>
                          <Chip
                            label={athlete.status}
                            color={athlete.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {athlete.email}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Schedule fontSize="small" color="action" />
                              <Typography variant="caption">
                                {athlete.totalSessions} session{athlete.totalSessions !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Star fontSize="small" color="action" />
                              <Typography variant="caption">
                                {athlete.rating.toFixed(1)} rating
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Last: {new Date(athlete.lastSession).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < athletes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainerAthletesList;