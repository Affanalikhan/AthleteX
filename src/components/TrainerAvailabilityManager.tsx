import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  TextField
} from '@mui/material';
import {
  Schedule,
  AccessTime,
  CalendarToday,
  Save
} from '@mui/icons-material';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DaySchedule {
  day: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface TrainerAvailabilityManagerProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
}

const TrainerAvailabilityManager: React.FC<TrainerAvailabilityManagerProps> = ({ 
  open, 
  onClose, 
  trainerId 
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {
      day: 'Monday',
      enabled: true,
      timeSlots: [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ]
    },
    {
      day: 'Tuesday',
      enabled: true,
      timeSlots: [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ]
    },
    {
      day: 'Wednesday',
      enabled: true,
      timeSlots: [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ]
    },
    {
      day: 'Thursday',
      enabled: true,
      timeSlots: [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ]
    },
    {
      day: 'Friday',
      enabled: true,
      timeSlots: [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ]
    },
    {
      day: 'Saturday',
      enabled: false,
      timeSlots: []
    },
    {
      day: 'Sunday',
      enabled: false,
      timeSlots: []
    }
  ]);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  const handleDayToggle = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;
    
    if (newSchedule[dayIndex].enabled && newSchedule[dayIndex].timeSlots.length === 0) {
      // Add default time slots when enabling a day
      newSchedule[dayIndex].timeSlots = [
        { start: '09:00', end: '12:00', available: true },
        { start: '14:00', end: '18:00', available: true }
      ];
    }
    
    setSchedule(newSchedule);
  };

  const handleTimeSlotChange = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.push({ start: '09:00', end: '10:00', available: true });
    setSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter(d => d !== date));
  };

  const handleSave = () => {
    // Save availability to localStorage or send to backend
    const availabilityData = {
      trainerId,
      schedule,
      blockedDates,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`trainer_availability_${trainerId}`, JSON.stringify(availabilityData));
    
    alert('Availability saved successfully! Athletes can now book sessions during your available hours.');
    onClose();
  };

  const timeOptions: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Schedule color="primary" />
          <Typography variant="h6">Manage Your Availability</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Set Your Coaching Schedule
          </Typography>
          <Typography variant="body2">
            Configure your weekly availability and block specific dates. Athletes will only be able to book sessions during your available hours.
          </Typography>
        </Alert>

        {/* Weekly Schedule */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Weekly Schedule
        </Typography>
        
        <Grid container spacing={2}>
          {schedule.map((daySchedule, dayIndex) => (
            <Grid item xs={12} key={daySchedule.day}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">{daySchedule.day}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={daySchedule.enabled}
                          onChange={() => handleDayToggle(dayIndex)}
                        />
                      }
                      label="Available"
                    />
                  </Box>
                  
                  {daySchedule.enabled && (
                    <Box>
                      {daySchedule.timeSlots.map((slot, slotIndex) => (
                        <Box key={slotIndex} display="flex" alignItems="center" gap={2} mb={2}>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Start</InputLabel>
                            <Select
                              value={slot.start}
                              label="Start"
                              onChange={(e) => handleTimeSlotChange(dayIndex, slotIndex, 'start', e.target.value)}
                            >
                              {timeOptions.map(time => (
                                <MenuItem key={time} value={time}>{time}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <Typography>to</Typography>
                          
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>End</InputLabel>
                            <Select
                              value={slot.end}
                              label="End"
                              onChange={(e) => handleTimeSlotChange(dayIndex, slotIndex, 'end', e.target.value)}
                            >
                              {timeOptions.map(time => (
                                <MenuItem key={time} value={time}>{time}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          >
                            Remove
                          </Button>
                        </Box>
                      ))}
                      
                      <Button
                        size="small"
                        startIcon={<AccessTime />}
                        onClick={() => addTimeSlot(dayIndex)}
                      >
                        Add Time Slot
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Blocked Dates */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Blocked Dates
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <TextField
            type="date"
            label="Block Date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
          >
            Block Date
          </Button>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1}>
          {blockedDates.map(date => (
            <Chip
              key={date}
              label={new Date(date).toLocaleDateString()}
              onDelete={() => removeBlockedDate(date)}
              color="error"
              variant="outlined"
            />
          ))}
        </Box>
        
        {blockedDates.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No blocked dates. Add dates when you're not available for coaching.
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          startIcon={<Save />}
          onClick={handleSave}
        >
          Save Availability
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainerAvailabilityManager;