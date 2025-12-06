import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { EmojiEvents, TrendingUp } from '@mui/icons-material';
import { progressTrackingService, PersonalRecord } from '../services/progressTrackingService';

interface PersonalRecordsCardProps {
  exerciseType?: string;
}

const PersonalRecordsCard: React.FC<PersonalRecordsCardProps> = ({ exerciseType }) => {
  const records = exerciseType
    ? progressTrackingService.getRecordsByExercise(exerciseType)
    : progressTrackingService.getPersonalRecords();

  const getMetricLabel = (metric: PersonalRecord['metric']): string => {
    switch (metric) {
      case 'reps':
        return 'Most Reps';
      case 'formScore':
        return 'Best Form Score';
      case 'duration':
        return 'Longest Duration';
      default:
        return metric;
    }
  };

  const formatValue = (record: PersonalRecord): string => {
    switch (record.metric) {
      case 'reps':
        return `${record.value} reps`;
      case 'formScore':
        return `${record.value.toFixed(1)}%`;
      case 'duration':
        return `${Math.floor(record.value / 60)}:${(record.value % 60).toString().padStart(2, '0')}`;
      default:
        return record.value.toString();
    }
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <EmojiEvents color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6">Personal Records</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            No personal records yet. Keep training to set your first record!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Group records by exercise type
  const recordsByExercise: { [key: string]: PersonalRecord[] } = {};
  records.forEach(record => {
    if (!recordsByExercise[record.exerciseType]) {
      recordsByExercise[record.exerciseType] = [];
    }
    recordsByExercise[record.exerciseType].push(record);
  });

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <EmojiEvents color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Personal Records</Typography>
          <Chip
            label={`${records.length} ${records.length === 1 ? 'Record' : 'Records'}`}
            size="small"
            color="warning"
            sx={{ ml: 'auto' }}
          />
        </Box>

        {Object.entries(recordsByExercise).map(([exercise, exerciseRecords], index) => (
          <Box key={exercise}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {exercise.replace(/_/g, ' ').toUpperCase()}
            </Typography>
            <List dense>
              {exerciseRecords.map((record, recordIndex) => (
                <ListItem key={recordIndex} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUp fontSize="small" color="success" />
                        <Typography variant="body2" fontWeight="bold">
                          {getMetricLabel(record.metric)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" color="warning.main">
                          {formatValue(record)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(record.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default PersonalRecordsCard;
