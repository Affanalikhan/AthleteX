import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents,
  FilterList,
  Visibility,
  Star,
  Assessment,
  People,
  Analytics,
  Download,
  CheckBox,
  CheckBoxOutlineBlank,
  Clear,
  AccountBalance,
  CloudUpload
} from '@mui/icons-material';
import { TestType, Athlete, AssessmentTest, SportType } from '../models';
import assessmentService from '../services/assessmentService';
import athleteService from '../services/athleteService';
import saiCloudService from '../services/saiCloudService';

interface AthleteRanking {
  athlete: Athlete;
  assessments: AssessmentTest[];
  totalScore: number;
  averageScore: number;
  rank: number;
  isShortlisted: boolean;
}

interface FilterState {
  sport: string;
  testType: string;
  minScore: number;
  searchName: string;
}

const AdminPage: React.FC = () => {
  const [rankings, setRankings] = useState<AthleteRanking[]>([]);
  const [filteredRankings, setFilteredRankings] = useState<AthleteRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteRanking | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    sport: '',
    testType: '',
    minScore: 0,
    searchName: ''
  });

  const loadRankingsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all athletes and assessments
      const [athletes, allAssessments] = await Promise.all([
        athleteService.getAllAthletes(),
        assessmentService.getAllAssessments()
      ]);

      // Create sample data if no real data exists
      const sampleAthletes = athletes.length === 0 ? generateSampleAthletes() : athletes;
      const sampleAssessments = allAssessments.length === 0 ? generateSampleAssessments() : allAssessments;

      // Calculate rankings
      const athleteRankings = sampleAthletes.map(athlete => {
        const athleteAssessments = sampleAssessments.filter(a => a.athleteId === athlete.id);
        const totalScore = athleteAssessments.reduce((sum, assessment) => sum + assessment.score, 0);
        const averageScore = athleteAssessments.length > 0 ? totalScore / athleteAssessments.length : 0;

        return {
          athlete,
          assessments: athleteAssessments,
          totalScore: Math.round(totalScore * 100) / 100,
          averageScore: Math.round(averageScore * 100) / 100,
          rank: 0, // Will be set after sorting
          isShortlisted: Math.random() > 0.7 // Random for demo
        };
      });

      // Sort by average score (descending) and assign ranks
      const sortedRankings = athleteRankings
        .sort((a, b) => b.averageScore - a.averageScore)
        .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

      setRankings(sortedRankings);
    } catch (error) {
      console.error('Error loading rankings data:', error);
      setError('Failed to load rankings data');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...rankings];

    // Filter by name
    if (filters.searchName) {
      filtered = filtered.filter(r => 
        r.athlete.name.toLowerCase().includes(filters.searchName.toLowerCase())
      );
    }

    // Filter by sport
    if (filters.sport) {
      filtered = filtered.filter(r => 
        r.athlete.sportsPlayed.includes(filters.sport)
      );
    }

    // Filter by test type
    if (filters.testType) {
      filtered = filtered.filter(r => 
        r.assessments.some(a => a.testType === filters.testType)
      );
    }

    // Filter by minimum score
    if (filters.minScore > 0) {
      filtered = filtered.filter(r => r.averageScore >= filters.minScore);
    }

    setFilteredRankings(filtered);
  }, [rankings, filters]);

  // Load athletes and assessments data
  useEffect(() => {
    loadRankingsData();
  }, [loadRankingsData]);

  // Apply filters whenever filters or rankings change
  useEffect(() => {
    applyFilters();
  }, [rankings, filters, applyFilters]);

  const handleViewDetails = (ranking: AthleteRanking) => {
    setSelectedAthlete(ranking);
    setOpenDetails(true);
  };

  const handleShortlist = (athleteId: string) => {
    setRankings(prev => 
      prev.map(r => 
        r.athlete.id === athleteId 
          ? { ...r, isShortlisted: !r.isShortlisted }
          : r
      )
    );
  };

  const handleSelectAthlete = (athleteId: string, checked: boolean) => {
    setSelectedAthletes(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(athleteId);
      } else {
        newSet.delete(athleteId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAthletes.size === filteredRankings.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredRankings.map(r => r.athlete.id)));
    }
  };

  const handleBulkShortlist = (shortlist: boolean) => {
    setRankings(prev => 
      prev.map(r => 
        selectedAthletes.has(r.athlete.id)
          ? { ...r, isShortlisted: shortlist }
          : r
      )
    );
    setSelectedAthletes(new Set());
  };

  const handleExportSelected = () => {
    const selectedData = filteredRankings
      .filter(r => selectedAthletes.has(r.athlete.id))
      .map(r => ({
        name: r.athlete.name,
        age: r.athlete.age,
        sports: r.athlete.sportsPlayed.join(', '),
        rank: r.rank,
        averageScore: r.averageScore,
        totalScore: r.totalScore,
        assessmentCount: r.assessments.length,
        isShortlisted: r.isShortlisted,
        location: `${r.athlete.city}, ${r.athlete.state}`
      }));

    const csvContent = [
      Object.keys(selectedData[0] || {}).join(','),
      ...selectedData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected_athletes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSyncToSAI = async () => {
    if (selectedAthletes.size === 0) {
      alert('Please select athletes to sync to SAI Cloud');
      return;
    }

    setSyncLoading(true);
    try {
      // Get selected athletes and their assessments
      const selectedRankings = filteredRankings.filter(r => selectedAthletes.has(r.athlete.id));
      const assessmentsByAthlete = new Map<string, AssessmentTest[]>();
      
      selectedRankings.forEach(ranking => {
        assessmentsByAthlete.set(ranking.athlete.id, ranking.assessments);
      });

      // Sync to SAI cloud
      const syncResult = await saiCloudService.bulkSyncAthletes(
        selectedRankings.map(r => r.athlete),
        assessmentsByAthlete
      );

      // Show result
      const successCount = syncResult.success.length;
      const failedCount = syncResult.failed.length;
      
      if (failedCount === 0) {
        alert(`Successfully synced ${successCount} athletes to SAI Cloud!`);
      } else {
        alert(`Synced ${successCount} athletes successfully. ${failedCount} failed to sync.`);
      }
      
      setSelectedAthletes(new Set());
    } catch (error) {
      console.error('SAI sync error:', error);
      alert('Failed to sync to SAI Cloud. Please ensure you have proper permissions.');
    } finally {
      setSyncLoading(false);
    }
  };

  const getTestTypeLabel = (testType: TestType) => {
    return testType.replace('_', ' ').toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'transparent';
  };

  // Generate sample data for demonstration
  const generateSampleAthletes = (): Athlete[] => [
    {
      id: 'athlete1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phoneNumber: '+1234567890',
      age: 22,
      gender: 'female' as const,
      weight: 65,
      height: 170,
      sportsPlayed: [SportType.ATHLETICS, SportType.BASKETBALL],
      country: 'USA',
      state: 'California',
      city: 'Los Angeles',
      pinCode: '90210',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'athlete2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      phoneNumber: '+1234567891',
      age: 25,
      gender: 'male' as const,
      weight: 75,
      height: 180,
      sportsPlayed: [SportType.FOOTBALL, SportType.ATHLETICS],
      country: 'USA',
      state: 'New York',
      city: 'New York City',
      pinCode: '10001',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'athlete3',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phoneNumber: '+1234567892',
      age: 24,
      gender: 'other' as const,
      weight: 70,
      height: 175,
      sportsPlayed: [SportType.HANDBALL, SportType.BASKETBALL],
      country: 'USA',
      state: 'Texas',
      city: 'Houston',
      pinCode: '77001',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'athlete4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      phoneNumber: '+1234567893',
      age: 23,
      gender: 'female' as const,
      weight: 60,
      height: 165,
      sportsPlayed: [SportType.ATHLETICS, SportType.HOCKEY],
      country: 'USA',
      state: 'Florida',
      city: 'Miami',
      pinCode: '33101',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'athlete5',
      name: 'David Kumar',
      email: 'david@example.com',
      phoneNumber: '+1234567894',
      age: 26,
      gender: 'male' as const,
      weight: 80,
      height: 182,
      sportsPlayed: [SportType.KABADDI, SportType.ATHLETICS],
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      pinCode: '400001',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const generateSampleAssessments = (): AssessmentTest[] => {
    const athletes = ['athlete1', 'athlete2', 'athlete3', 'athlete4', 'athlete5'];
    const testTypes = Object.values(TestType);
    const assessments: AssessmentTest[] = [];

    athletes.forEach(athleteId => {
      // Generate 2-4 random assessments per athlete
      const numAssessments = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numAssessments; i++) {
        const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
        const baseScore = Math.random() * 40 + 40; // 40-80 base score
        const variation = (Math.random() - 0.5) * 20; // ±10 variation
        const score = Math.max(0, Math.min(100, baseScore + variation));

        assessments.push({
          id: `assessment_${athleteId}_${i}`,
          athleteId,
          testType,
          videoUrl: '',
          score: Math.round(score * 100) / 100,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          notes: `Assessment ${i + 1} for ${testType}`
        });
      }
    });

    return assessments;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h6">Loading athlete rankings...</Typography>
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard - Athlete Rankings
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<AccountBalance />}
          onClick={() => window.open('/sai-portal', '_blank')}
          sx={{ fontWeight: 'bold' }}
        >
          SAI Cloud Portal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <People color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4">{rankings.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Athletes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4">
                    {rankings.reduce((sum, r) => sum + r.assessments.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assessments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Star color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4">
                    {rankings.filter(r => r.isShortlisted).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shortlisted
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Analytics color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4">
                    {rankings.length > 0 ? Math.round(rankings.reduce((sum, r) => sum + r.averageScore, 0) / rankings.length) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterList />
          <Typography variant="h6">Filters</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by name"
              value={filters.searchName}
              onChange={(e) => setFilters(prev => ({ ...prev, searchName: e.target.value }))}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sport</InputLabel>
              <Select
                value={filters.sport}
                label="Sport"
                onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
              >
                <MenuItem value="">All Sports</MenuItem>
                {Object.values(SportType).map(sport => (
                  <MenuItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Test Type</InputLabel>
              <Select
                value={filters.testType}
                label="Test Type"
                onChange={(e) => setFilters(prev => ({ ...prev, testType: e.target.value }))}
              >
                <MenuItem value="">All Tests</MenuItem>
                {Object.values(TestType).map(test => (
                  <MenuItem key={test} value={test}>
                    {getTestTypeLabel(test)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Score"
              type="number"
              value={filters.minScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
              size="small"
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions Toolbar */}
      {selectedAthletes.size > 0 && (
        <Paper elevation={2} sx={{ mt: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography variant="h6">
              {selectedAthletes.size} athlete{selectedAthletes.size !== 1 ? 's' : ''} selected
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Star />}
                onClick={() => handleBulkShortlist(true)}
              >
                Shortlist Selected
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Clear />}
                onClick={() => handleBulkShortlist(false)}
              >
                Remove from Shortlist
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportSelected}
              >
                Export Selected
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<CloudUpload />}
                onClick={() => handleSyncToSAI()}
                disabled={syncLoading}
              >
                {syncLoading ? 'Syncing...' : 'Sync to SAI Cloud'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setSelectedAthletes(new Set())}
              >
                Clear Selection
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Rankings Table */}
      <Paper elevation={2} sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Button
                    size="small"
                    startIcon={selectedAthletes.size === filteredRankings.length && filteredRankings.length > 0 ? <CheckBox /> : <CheckBoxOutlineBlank />}
                    onClick={handleSelectAll}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {selectedAthletes.size === filteredRankings.length && filteredRankings.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>Athlete</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell align="center">Assessments</TableCell>
                <TableCell align="center">Avg Score</TableCell>
                <TableCell align="center">Total Score</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRankings.map((ranking) => (
                <TableRow key={ranking.athlete.id} hover selected={selectedAthletes.has(ranking.athlete.id)}>
                  <TableCell padding="checkbox">
                    <Button
                      size="small"
                      startIcon={selectedAthletes.has(ranking.athlete.id) ? <CheckBox color="primary" /> : <CheckBoxOutlineBlank />}
                      onClick={() => handleSelectAthlete(ranking.athlete.id, !selectedAthletes.has(ranking.athlete.id))}
                    >
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        width={30}
                        height={30}
                        borderRadius="50%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor={getRankColor(ranking.rank)}
                        color={ranking.rank <= 3 ? 'white' : 'text.primary'}
                        fontWeight="bold"
                      >
                        {ranking.rank}
                      </Box>
                      {ranking.rank <= 3 && <EmojiEvents color="warning" />}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {ranking.athlete.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {ranking.athlete.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ranking.athlete.city}, {ranking.athlete.state}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {ranking.athlete.sportsPlayed.slice(0, 2).map(sport => (
                        <Chip
                          key={sport}
                          label={sport.charAt(0).toUpperCase() + sport.slice(1)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {ranking.athlete.sportsPlayed.length > 2 && (
                        <Chip
                          label={`+${ranking.athlete.sportsPlayed.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Badge badgeContent={ranking.assessments.length} color="primary">
                      <Assessment />
                    </Badge>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={ranking.averageScore.toFixed(1)}
                      color={getScoreColor(ranking.averageScore)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {ranking.totalScore}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    {ranking.isShortlisted ? (
                      <Chip label="Shortlisted" color="success" size="small" />
                    ) : (
                      <Chip label="Active" color="default" size="small" />
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(ranking)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant={ranking.isShortlisted ? 'outlined' : 'contained'}
                        color={ranking.isShortlisted ? 'secondary' : 'primary'}
                        startIcon={<Star />}
                        onClick={() => handleShortlist(ranking.athlete.id)}
                      >
                        {ranking.isShortlisted ? 'Remove' : 'Shortlist'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Athlete Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        {selectedAthlete && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  {selectedAthlete.athlete.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedAthlete.athlete.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rank #{selectedAthlete.rank} • Avg Score: {selectedAthlete.averageScore}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Age" secondary={`${selectedAthlete.athlete.age} years`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Height" secondary={`${selectedAthlete.athlete.height} cm`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Weight" secondary={`${selectedAthlete.athlete.weight} kg`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Location" 
                        secondary={`${selectedAthlete.athlete.city}, ${selectedAthlete.athlete.state}, ${selectedAthlete.athlete.country}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Sports" 
                        secondary={selectedAthlete.athlete.sportsPlayed.join(', ')} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Assessment Results</Typography>
                  <List dense>
                    {selectedAthlete.assessments.map((assessment, index) => (
                      <React.Fragment key={assessment.id}>
                        <ListItem>
                          <ListItemText
                            primary={getTestTypeLabel(assessment.testType)}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Score: <Chip label={assessment.score} color={getScoreColor(assessment.score)} size="small" />
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {assessment.timestamp.toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedAthlete.assessments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                  
                  {selectedAthlete.assessments.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No assessments completed yet.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setOpenDetails(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Star />}
                onClick={() => {
                  handleShortlist(selectedAthlete.athlete.id);
                  setOpenDetails(false);
                }}
                color={selectedAthlete.isShortlisted ? 'secondary' : 'primary'}
              >
                {selectedAthlete.isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AdminPage;
