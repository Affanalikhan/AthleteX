import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  ExpandMore,
  Save,
  Cancel,
  FitnessCenter,
  SportsSoccer,
  ContentCopy,
  Publish,
  Archive,
  Restore,
  Search,
  FilterList
} from '@mui/icons-material';
import { SportType, DifficultyLevel, TrainingProgram } from '../models';
import trainingProgramsData from '../data/trainingPrograms.json';

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  reps: string;
  imageUrl: string;
}

interface TrainingProgramForm {
  id: string;
  sport: SportType;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  duration: string;
  exercises: Exercise[];
  status: 'active' | 'archived' | 'draft';
}

const SAITrainingManagement: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState<SportType | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [formData, setFormData] = useState<TrainingProgramForm | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [programs, searchQuery, filterSport, filterDifficulty, currentTab]);

  const loadPrograms = () => {
    const loadedPrograms = trainingProgramsData.map(program => ({
      ...program,
      sport: program.sport as SportType,
      difficulty: program.difficulty as DifficultyLevel,
      status: 'active' as const
    }));
    setPrograms(loadedPrograms as any);
  };

  const applyFilters = () => {
    let filtered = [...programs];

    // Filter by tab (status)
    const statusFilter = currentTab === 0 ? 'active' : currentTab === 1 ? 'draft' : 'archived';
    filtered = filtered.filter(p => (p as any).status === statusFilter || currentTab === 0);

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport
    if (filterSport !== 'all') {
      filtered = filtered.filter(p => p.sport === filterSport);
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === filterDifficulty);
    }

    setFilteredPrograms(filtered);
  };

  const handleCreate = () => {
    const newProgram: TrainingProgramForm = {
      id: `new_${Date.now()}`,
      sport: SportType.FOOTBALL,
      title: '',
      description: '',
      difficulty: DifficultyLevel.BEGINNER,
      duration: '',
      exercises: [],
      status: 'draft'
    };
    setFormData(newProgram);
    setEditDialogOpen(true);
  };

  const handleEdit = (program: TrainingProgram) => {
    setFormData({
      ...program,
      status: (program as any).status || 'active'
    } as TrainingProgramForm);
    setEditDialogOpen(true);
  };

  const handleView = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setViewDialogOpen(true);
  };

  const handleDelete = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = (program: TrainingProgram) => {
    const duplicated: TrainingProgramForm = {
      ...program,
      id: `copy_${Date.now()}`,
      title: `${program.title} (Copy)`,
      status: 'draft'
    } as TrainingProgramForm;
    setFormData(duplicated);
    setEditDialogOpen(true);
  };

  const handleArchive = (program: TrainingProgram) => {
    const updated = programs.map(p =>
      p.id === program.id ? { ...p, status: 'archived' } : p
    );
    setPrograms(updated as any);
    showSuccess('Program archived successfully');
  };

  const handleRestore = (program: TrainingProgram) => {
    const updated = programs.map(p =>
      p.id === program.id ? { ...p, status: 'active' } : p
    );
    setPrograms(updated as any);
    showSuccess('Program restored successfully');
  };

  const handleSave = () => {
    if (!formData) return;

    if (formData.id.startsWith('new_') || formData.id.startsWith('copy_')) {
      // Create new program
      setPrograms([...programs, formData as any]);
      showSuccess('Program created successfully');
    } else {
      // Update existing program
      const updated = programs.map(p =>
        p.id === formData.id ? formData : p
      );
      setPrograms(updated as any);
      showSuccess('Program updated successfully');
    }

    setEditDialogOpen(false);
    setFormData(null);
  };

  const confirmDelete = () => {
    if (!selectedProgram) return;

    const updated = programs.filter(p => p.id !== selectedProgram.id);
    setPrograms(updated);
    setDeleteDialogOpen(false);
    setSelectedProgram(null);
    showSuccess('Program deleted successfully');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const addExercise = () => {
    if (!formData) return;

    const newExercise: Exercise = {
      id: `ex_${Date.now()}`,
      name: '',
      description: '',
      duration: '',
      reps: '',
      imageUrl: ''
    };

    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise]
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    if (!formData) return;

    const updated = [...formData.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, exercises: updated });
  };

  const removeExercise = (index: number) => {
    if (!formData) return;

    const updated = formData.exercises.filter((_, i) => i !== index);
    setFormData({ ...formData, exercises: updated });
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return 'success';
      case DifficultyLevel.INTERMEDIATE:
        return 'warning';
      case DifficultyLevel.ADVANCED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ px: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Training Programs
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Create Program
        </Button>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sport</InputLabel>
                <Select
                  value={filterSport}
                  label="Sport"
                  onChange={(e) => setFilterSport(e.target.value as SportType | 'all')}
                >
                  <MenuItem value="all">All Sports</MenuItem>
                  {Object.values(SportType).map((sport) => (
                    <MenuItem key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filterDifficulty}
                  label="Difficulty"
                  onChange={(e) => setFilterDifficulty(e.target.value as DifficultyLevel | 'all')}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  {Object.values(DifficultyLevel).map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="textSecondary" textAlign={{ xs: 'center', md: 'left' }}>
                {filteredPrograms.length} programs
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.875rem', md: '1rem' },
              minWidth: { xs: 'auto', md: 120 }
            }
          }}
        >
          <Tab label="Active" />
          <Tab label="Drafts" />
          <Tab label="Archived" />
        </Tabs>
      </Paper>

      {/* Programs Table - Desktop */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Program Title</TableCell>
              <TableCell>Sport</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Exercises</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    No programs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{program.title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {program.description.substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<SportsSoccer />}
                      label={program.sport}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={program.difficulty}
                      size="small"
                      color={getDifficultyColor(program.difficulty)}
                    />
                  </TableCell>
                  <TableCell>{program.duration}</TableCell>
                  <TableCell>{program.exercises.length}</TableCell>
                  <TableCell>
                    <Chip
                      label={(program as any).status || 'active'}
                      size="small"
                      color={getStatusColor((program as any).status || 'active')}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleView(program)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(program)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicate(program)}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    {(program as any).status === 'active' ? (
                      <Tooltip title="Archive">
                        <IconButton size="small" onClick={() => handleArchive(program)}>
                          <Archive />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Restore">
                        <IconButton size="small" onClick={() => handleRestore(program)}>
                          <Restore />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(program)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Programs Cards - Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredPrograms.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="textSecondary" textAlign="center">
                No programs found
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredPrograms.map((program) => (
            <Card key={program.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {program.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                      {program.description.substring(0, 80)}...
                    </Typography>
                  </Box>
                  <Chip
                    label={(program as any).status || 'active'}
                    size="small"
                    color={getStatusColor((program as any).status || 'active')}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={<SportsSoccer />}
                    label={program.sport}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={program.difficulty}
                    size="small"
                    color={getDifficultyColor(program.difficulty)}
                  />
                  <Chip
                    label={program.duration}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${program.exercises.length} exercises`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleView(program)} color="primary">
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(program)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDuplicate(program)}>
                    <ContentCopy />
                  </IconButton>
                  {(program as any).status === 'active' ? (
                    <IconButton size="small" onClick={() => handleArchive(program)}>
                      <Archive />
                    </IconButton>
                  ) : (
                    <IconButton size="small" onClick={() => handleRestore(program)}>
                      <Restore />
                    </IconButton>
                  )}
                  <IconButton size="small" color="error" onClick={() => handleDelete(program)}>
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Edit/Create Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle>
          {formData?.id.startsWith('new_') || formData?.id.startsWith('copy_') ? 'Create' : 'Edit'} Training Program
        </DialogTitle>
        <DialogContent>
          {formData && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sport</InputLabel>
                    <Select
                      value={formData.sport}
                      label="Sport"
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value as SportType })}
                    >
                      {Object.values(SportType).map((sport) => (
                        <MenuItem key={sport} value={sport}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={formData.difficulty}
                      label="Difficulty"
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                    >
                      {Object.values(DifficultyLevel).map((level) => (
                        <MenuItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Program Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration"
                    placeholder="e.g., 8 weeks"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Exercises */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Exercises</Typography>
                  <Button startIcon={<Add />} onClick={addExercise}>
                    Add Exercise
                  </Button>
                </Box>

                {formData.exercises.map((exercise, index) => (
                  <Accordion key={exercise.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {exercise.name || `Exercise ${index + 1}`}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Exercise Name"
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={exercise.description}
                            onChange={(e) => updateExercise(index, 'description', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Duration"
                            placeholder="e.g., 20 minutes"
                            value={exercise.duration}
                            onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Reps/Sets"
                            placeholder="e.g., 3 sets of 10"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Image URL"
                            value={exercise.imageUrl}
                            onChange={(e) => updateExercise(index, 'imageUrl', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => removeExercise(index)}
                          >
                            Remove Exercise
                          </Button>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save />}>
            Save Program
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Program Details</DialogTitle>
        <DialogContent>
          {selectedProgram && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Sport</Typography>
                  <Typography variant="body1">{selectedProgram.sport}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Difficulty</Typography>
                  <Chip label={selectedProgram.difficulty} color={getDifficultyColor(selectedProgram.difficulty)} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Title</Typography>
                  <Typography variant="h6">{selectedProgram.title}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedProgram.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Duration</Typography>
                  <Typography variant="body1">{selectedProgram.duration}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Exercises</Typography>
                  <Typography variant="body1">{selectedProgram.exercises.length} exercises</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Exercises</Typography>
              <List>
                {selectedProgram.exercises.map((exercise, index) => (
                  <React.Fragment key={exercise.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${index + 1}. ${exercise.name}`}
                        secondary={
                          <>
                            <Typography variant="body2">{exercise.description}</Typography>
                            <Typography variant="caption">
                              Duration: {exercise.duration} • Reps: {exercise.reps}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < selectedProgram.exercises.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProgram?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SAITrainingManagement;
