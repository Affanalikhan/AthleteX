import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Badge,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  People,
  Star,
  Assessment,
  CloudSync,
  FilterList,
  Search,
  Download,
  Visibility,
  LocationOn,
  SportsSoccer,
  EmojiEvents,
  Analytics,
  Campaign,
  NotificationImportant,
  ExpandMore,
  Close,
  CheckCircle,
  Warning,
  Info,
  AccountBalance,
  Groups,
  Map as MapIcon,
  Timeline,
  Phone,
  Email,
  PersonAdd,
  FileUpload,
  Home,
  ArrowBack,
  FitnessCenter
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import saiCloudService, { SAITalentProfile, SAITalentSearchFilters, SAIRecruitmentCampaign } from '../services/saiCloudService';
import assessmentService from '../services/assessmentService';
import athleteService from '../services/athleteService';
import SAIAthleteDetails from '../components/SAIAthleteDetails';
import SAITrainingManagement from '../components/SAITrainingManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sai-tabpanel-${index}`}
      aria-labelledby={`sai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DashboardMetrics {
  totalTalents: number;
  identifiedTalents: number;
  activeRecruitments: number;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSync: Date;
}

const SAIDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [talents, setTalents] = useState<SAITalentProfile[]>([]);
  const [campaigns, setCampaigns] = useState<SAIRecruitmentCampaign[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTalents: 0,
    identifiedTalents: 0,
    activeRecruitments: 0,
    syncStatus: 'synced',
    lastSync: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<SAITalentProfile | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Search and Filter States
  const [searchFilters, setSearchFilters] = useState<SAITalentSearchFilters>({
    ageRange: { min: 14, max: 25 },
    minScore: 60,
    percentileThreshold: 50
  });
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  
  // Selection States
  const [selectedTalentIds, setSelectedTalentIds] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<'shortlist' | 'export' | 'contact' | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load talents, campaigns, and analytics
      const [talentsData, campaignsData, analyticsData] = await Promise.all([
        saiCloudService.searchTalents(searchFilters),
        saiCloudService.getActiveRecruitmentCampaigns(),
        saiCloudService.generateTalentAnalytics()
      ]);

      setTalents(talentsData);
      setCampaigns(campaignsData);
      setAnalytics(analyticsData);
      
      // Update metrics
      setMetrics({
        totalTalents: analyticsData.totalTalents,
        identifiedTalents: analyticsData.recruitmentFunnel.identified,
        activeRecruitments: campaignsData.length,
        syncStatus: 'synced',
        lastSync: new Date()
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncLoading(true);
    try {
      // Get local athlete and assessment data
      const [athletes, assessments] = await Promise.all([
        athleteService.getAllAthletes(),
        assessmentService.getAllAssessments()
      ]);

      // Group assessments by athlete
      const assessmentsByAthlete = new Map<string, any[]>();
      assessments.forEach(assessment => {
        const existing = assessmentsByAthlete.get(assessment.athleteId) || [];
        assessmentsByAthlete.set(assessment.athleteId, [...existing, assessment]);
      });

      // Bulk sync to SAI cloud
      const syncResult = await saiCloudService.bulkSyncAthletes(athletes, assessmentsByAthlete);
      
      // Reload data after sync
      await loadDashboardData();
      
      setMetrics(prev => ({
        ...prev,
        syncStatus: 'synced',
        lastSync: new Date()
      }));
      
    } catch (error) {
      console.error('Sync error:', error);
      setMetrics(prev => ({ ...prev, syncStatus: 'error' }));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await saiCloudService.searchTalents(searchFilters);
      setTalents(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTalent = (talent: SAITalentProfile) => {
    setSelectedTalent(talent);
    setViewDetailsOpen(true);
  };

  const handleSelectTalent = (talentId: string) => {
    const newSet = new Set(selectedTalentIds);
    if (newSet.has(talentId)) {
      newSet.delete(talentId);
    } else {
      newSet.add(talentId);
    }
    setSelectedTalentIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedTalentIds.size === talents.length) {
      setSelectedTalentIds(new Set());
    } else {
      setSelectedTalentIds(new Set(talents.map(t => t.athleteId)));
    }
  };

  const handleBulkAction = async (action: 'shortlist' | 'export' | 'contact') => {
    if (selectedTalentIds.size === 0) return;

    setBulkActionDialog(action);
  };

  const executeBulkAction = async () => {
    if (!bulkActionDialog || selectedTalentIds.size === 0) return;

    try {
      const selectedIds = Array.from(selectedTalentIds);
      
      switch (bulkActionDialog) {
        case 'shortlist':
          if (campaigns.length > 0) {
            await saiCloudService.createRecruitmentShortlist(campaigns[0].id, selectedIds);
          }
          break;
        case 'export':
          const exportResult = await saiCloudService.exportTalentData({
            ...searchFilters,
            // Filter to only selected talents
          }, 'excel');
          // Handle download
          break;
        case 'contact':
          // Implement contact functionality
          break;
      }
      
      setSelectedTalentIds(new Set());
      setBulkActionDialog(null);
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  const getSyncStatusColor = () => {
    switch (metrics.syncStatus) {
      case 'synced': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getRecruitmentStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return 'success';
      case 'shortlisted': return 'info';
      case 'contacted': return 'warning';
      case 'recruited': return 'primary';
      default: return 'default';
    }
  };

  // Chart colors for consistency
  const chartColors = ['#00f5ff', '#0080ff', '#4dd5ff', '#66b2ff', '#0056b3'];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Groups color="primary" fontSize="large" />
              <Box>
                <Typography variant="h4">{metrics.totalTalents}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Talents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Star color="warning" fontSize="large" />
              <Box>
                <Typography variant="h4">{metrics.identifiedTalents}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Identified Talents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Campaign color="info" fontSize="large" />
              <Box>
                <Typography variant="h4">{metrics.activeRecruitments}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Campaigns
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <CloudSync color={getSyncStatusColor() as any} fontSize="large" />
              <Box>
                <Typography variant="h6">
                  <Chip 
                    label={metrics.syncStatus.toUpperCase()} 
                    color={getSyncStatusColor()} 
                    size="small" 
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data Sync Status
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Analytics Charts */}
      {analytics && (
        <>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Talent Distribution by State" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byState}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#00f5ff" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Sport-wise Talent Count" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.bySport}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: any) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.bySport.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Recruitment Funnel" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(analytics.recruitmentFunnel).map(([stage, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={stage}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="primary">
                          {count as number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderTalentSearchTab = () => (
    <Box>
      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Minimum Score"
              type="number"
              value={searchFilters.minScore || ''}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Min Percentile"
              type="number"
              value={searchFilters.percentileThreshold || ''}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, percentileThreshold: Number(e.target.value) }))}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading}
              fullWidth
            >
              Search
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setAdvancedFiltersOpen(true)}
              fullWidth
            >
              Filters
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<CloudSync />}
              onClick={handleSyncData}
              disabled={syncLoading}
              fullWidth
            >
              {syncLoading ? 'Syncing...' : 'Sync Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions */}
      {selectedTalentIds.size > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedTalentIds.size} talent{selectedTalentIds.size !== 1 ? 's' : ''} selected
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Star />}
                onClick={() => handleBulkAction('shortlist')}
              >
                Shortlist
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleBulkAction('export')}
              >
                Export
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<PersonAdd />}
                onClick={() => handleBulkAction('contact')}
              >
                Contact
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setSelectedTalentIds(new Set())}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Talents Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Button
                    size="small"
                    onClick={handleSelectAll}
                  >
                    {selectedTalentIds.size === talents.length && talents.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </TableCell>
                <TableCell>Athlete</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Percentile</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading talents...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                talents.map((talent) => (
                  <TableRow key={talent.athleteId} selected={selectedTalentIds.has(talent.athleteId)}>
                    <TableCell padding="checkbox">
                      <Button
                        size="small"
                        onClick={() => handleSelectTalent(talent.athleteId)}
                      >
                        {selectedTalentIds.has(talent.athleteId) ? '☑️' : '☐'}
                      </Button>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>
                          {talent.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {talent.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Age: {talent.age}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {talent.location.city}, {talent.location.state}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {talent.sportsCategories.slice(0, 2).map(sport => (
                          <Chip
                            key={sport}
                            label={sport}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {talent.sportsCategories.length > 2 && (
                          <Chip
                            label={`+${talent.sportsCategories.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={talent.assessmentSummary.averageScore.toFixed(1)}
                        color={talent.assessmentSummary.averageScore >= 80 ? 'success' : 
                               talent.assessmentSummary.averageScore >= 70 ? 'info' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {talent.assessmentSummary.percentileRank}th
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={talent.recruitmentStatus.replace('_', ' ').toUpperCase()}
                        color={getRecruitmentStatusColor(talent.recruitmentStatus)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewTalent(talent)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  // All 29 states of India with major cities
  const indianStatesData = [
    { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'] },
    { state: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila'] },
    { state: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'] },
    { state: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'] },
    { state: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg'] },
    { state: 'Goa', cities: ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda'] },
    { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'] },
    { state: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar'] },
    { state: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'] },
    { state: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'] },
    { state: 'Karnataka', cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'] },
    { state: 'Kerala', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'] },
    { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'] },
    { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'] },
    { state: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'] },
    { state: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara'] },
    { state: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'] },
    { state: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'] },
    { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'] },
    { state: 'Punjab', cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'] },
    { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Udaipur'] },
    { state: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Soreng'] },
    { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'] },
    { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'] },
    { state: 'Tripura', cities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia'] },
    { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi'] },
    { state: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'] },
    { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'] },
    { state: 'Delhi', cities: ['New Delhi', 'Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi'] }
  ];

  const renderCampaignsTab = () => {
    // Generate recruitment campaigns for all states
    const stateCampaigns = indianStatesData.map((stateData, index) => ({
      id: `campaign-${index}`,
      name: `${stateData.state} Talent Hunt 2024`,
      description: `State-level athletics talent identification program for ${stateData.state}`,
      status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'upcoming' : 'completed',
      targetSports: ['Athletics', 'Football', 'Hockey', 'Basketball', 'Wrestling'],
      recruitmentQuota: Math.floor(Math.random() * 50) + 20,
      eligibilityCriteria: { minScore: 70 },
      cities: stateData.cities,
      state: stateData.state,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      coordinator: `SAI ${stateData.state} Office`,
      contactEmail: `sai.${stateData.state.toLowerCase().replace(/\s+/g, '')}@gov.in`,
      totalApplicants: Math.floor(Math.random() * 500) + 100,
      shortlisted: Math.floor(Math.random() * 50) + 10
    }));

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🇮🇳 National Talent Identification Program
          </Typography>
          <Typography variant="body2">
            Comprehensive recruitment campaigns across all 29 states and union territories of India. 
            Each campaign targets local talent in multiple sports categories with state-specific coordinators.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {stateCampaigns.map((campaign) => (
            <Grid item xs={12} md={6} lg={4} key={campaign.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={campaign.name}
                  subheader={campaign.description}
                  action={
                    <Chip
                      label={campaign.status.toUpperCase()}
                      color={
                        campaign.status === 'active' ? 'success' : 
                        campaign.status === 'upcoming' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><LocationOn /></ListItemIcon>
                      <ListItemText
                        primary="Target Cities"
                        secondary={campaign.cities.slice(0, 3).join(', ') + (campaign.cities.length > 3 ? ` +${campaign.cities.length - 3} more` : '')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SportsSoccer /></ListItemIcon>
                      <ListItemText
                        primary="Target Sports"
                        secondary={campaign.targetSports.slice(0, 3).join(', ') + (campaign.targetSports.length > 3 ? ' +more' : '')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Groups /></ListItemIcon>
                      <ListItemText
                        primary="Recruitment Quota"
                        secondary={`${campaign.recruitmentQuota} athletes`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText
                        primary="Progress"
                        secondary={`${campaign.shortlisted}/${campaign.totalApplicants} shortlisted`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Email /></ListItemIcon>
                      <ListItemText
                        primary="Coordinator"
                        secondary={campaign.coordinator}
                      />
                    </ListItem>
                  </List>
                  
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(campaign.shortlisted / campaign.totalApplicants) * 100}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {((campaign.shortlisted / campaign.totalApplicants) * 100).toFixed(1)}% completion
                    </Typography>
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button variant="outlined" fullWidth size="small">
                    View Campaign Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderAdvancedAnalyticsTab = () => {
    const performanceData = [
      { month: 'Jan', identified: 120, shortlisted: 45, recruited: 12 },
      { month: 'Feb', identified: 150, shortlisted: 60, recruited: 18 },
      { month: 'Mar', identified: 180, shortlisted: 75, recruited: 25 },
      { month: 'Apr', identified: 200, shortlisted: 85, recruited: 30 },
      { month: 'May', identified: 220, shortlisted: 95, recruited: 35 },
      { month: 'Jun', identified: 250, shortlisted: 110, recruited: 42 }
    ];

    const statePerformance = indianStatesData.slice(0, 10).map(state => ({
      state: state.state,
      talents: Math.floor(Math.random() * 100) + 20,
      recruited: Math.floor(Math.random() * 20) + 5,
      efficiency: Math.floor(Math.random() * 30) + 70
    }));

    const sportDistribution = [
      { sport: 'Athletics', count: 450, percentage: 35 },
      { sport: 'Football', count: 320, percentage: 25 },
      { sport: 'Hockey', count: 200, percentage: 15 },
      { sport: 'Basketball', count: 150, percentage: 12 },
      { sport: 'Wrestling', count: 100, percentage: 8 },
      { sport: 'Others', count: 80, percentage: 5 }
    ];

    return (
      <Grid container spacing={3}>
        {/* Key Performance Indicators */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#00f5ff', fontWeight: 'bold' }}>
            Advanced Performance Analytics
          </Typography>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="success.main">94.2%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Talent Retention Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Analytics color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="info.main">78.5%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prediction Accuracy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <EmojiEvents color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="warning.main">156</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Elite Athletes Identified
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Timeline color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="primary.main">2.3x</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Improvement Factor
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Performance Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Monthly Recruitment Performance" />
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="identified" stroke="#00f5ff" strokeWidth={3} name="Identified" />
                  <Line type="monotone" dataKey="shortlisted" stroke="#0080ff" strokeWidth={3} name="Shortlisted" />
                  <Line type="monotone" dataKey="recruited" stroke="#4dd5ff" strokeWidth={3} name="Recruited" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sport Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Sport-wise Talent Distribution" />
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={sportDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="sport"
                  >
                    {sportDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* State Performance Ranking */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Top Performing States" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>State</TableCell>
                      <TableCell align="center">Talents Identified</TableCell>
                      <TableCell align="center">Successfully Recruited</TableCell>
                      <TableCell align="center">Efficiency Rate</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statePerformance
                      .sort((a, b) => b.efficiency - a.efficiency)
                      .map((state, index) => (
                        <TableRow key={state.state}>
                          <TableCell>
                            <Chip
                              label={index + 1}
                              color={index < 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="bold">
                                {state.state}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{state.talents}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="success.main">
                              {state.recruited}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${state.efficiency}%`}
                              color={state.efficiency >= 85 ? 'success' : state.efficiency >= 75 ? 'info' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <LinearProgress
                              variant="determinate"
                              value={state.efficiency}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Predictive Analytics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="AI-Powered Talent Predictions" />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText
                    primary="High Potential Athletes"
                    secondary="89 athletes predicted to achieve national level performance"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Warning color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="At-Risk Talents"
                    secondary="23 athletes require immediate intervention to prevent dropout"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Info color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Emerging Sports"
                    secondary="Badminton and Table Tennis showing 40% growth in participation"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Allocation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Resource Allocation Insights" />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon><Groups color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Coaching Staff Requirement"
                    secondary="Additional 45 coaches needed in tier-2 cities"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Home color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="Infrastructure Gaps"
                    secondary="12 states require upgraded training facilities"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmojiEvents color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="Budget Optimization"
                    secondary="₹2.3 Cr can be reallocated for maximum impact"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
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
        <Container maxWidth="xl" sx={{ px: { xs: 1, md: 3 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={{ xs: 1, md: 2 }} flex={1} minWidth={0}>
              <IconButton
                onClick={() => window.location.href = '/sai-portal'}
                sx={{ 
                  color: '#00f5ff',
                  display: { xs: 'flex', md: 'none' }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => window.location.href = '/sai-portal'}
                sx={{ 
                  color: '#00f5ff',
                  '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' },
                  display: { xs: 'none', md: 'flex' }
                }}
              >
                Back
              </Button>
              <AccountBalance sx={{ fontSize: { xs: 24, md: 32 }, color: '#00f5ff', display: { xs: 'none', sm: 'block' } }} />
              <Box minWidth={0}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ 
                    color: '#00f5ff',
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  SAI Dashboard
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: { xs: 'none', md: 'block' }
                  }}
                >
                  Sports Authority of India
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={{ xs: 0.5, md: 2 }} alignItems="center">
              <IconButton
                color="error"
                onClick={() => window.location.href = '/'}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                  },
                }}
              >
                <Home />
              </IconButton>
              <Button
                variant="contained"
                color="error"
                startIcon={<Home />}
                onClick={() => window.location.href = '/'}
                size="small"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  fontWeight: 'bold',
                  px: 2,
                  py: 1,
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
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: { xs: 'none', lg: 'block' } }}
              >
                {metrics.lastSync.toLocaleTimeString()}
              </Typography>
              <Chip
                label={saiCloudService.getCurrentOfficialId()}
                color="primary"
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 3 } }}>
        {/* Main Content */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', md: 120 },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              px: { xs: 1, md: 2 }
            }
          }}
        >
          <Tab label="Overview" icon={<Dashboard />} iconPosition="start" />
          <Tab label="Search" icon={<Search />} iconPosition="start" />
          <Tab label="Campaigns" icon={<Campaign />} iconPosition="start" />
          <Tab label="Training" icon={<FitnessCenter />} iconPosition="start" />
          <Tab label="Analytics" icon={<Analytics />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderOverviewTab()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderTalentSearchTab()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderCampaignsTab()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <SAITrainingManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        {renderAdvancedAnalyticsTab()}
      </TabPanel>

      {/* Talent Details Dialog */}
      <Dialog open={viewDetailsOpen} onClose={() => setViewDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedTalent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 56, height: 56 }}>
                  {selectedTalent.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedTalent.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTalent.location.city}, {selectedTalent.location.state}
                  </Typography>
                </Box>
                <IconButton onClick={() => setViewDetailsOpen(false)} sx={{ ml: 'auto' }}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Age" secondary={`${selectedTalent.age} years`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Sports Categories" 
                        secondary={selectedTalent.sportsCategories.join(', ')} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Recruitment Status"
                        secondary={
                          <Chip
                            label={selectedTalent.recruitmentStatus.replace('_', ' ').toUpperCase()}
                            color={getRecruitmentStatusColor(selectedTalent.recruitmentStatus)}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Assessment Summary</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Total Assessments" 
                        secondary={selectedTalent.assessmentSummary.totalAssessments} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Average Score" 
                        secondary={selectedTalent.assessmentSummary.averageScore.toFixed(1)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Percentile Rank" 
                        secondary={`${selectedTalent.assessmentSummary.percentileRank}th percentile`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Key Strengths" 
                        secondary={selectedTalent.assessmentSummary.strengths.join(', ') || 'None identified'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                {selectedTalent.assessmentSummary.potentialSports.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Potential Sports</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedTalent.assessmentSummary.potentialSports.map(sport => (
                        <Chip
                          key={sport}
                          label={sport}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setViewDetailsOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                color="primary"
              >
                Add to Shortlist
              </Button>
              <Button
                variant="outlined"
                startIcon={<Phone />}
              >
                Contact Athlete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={!!bulkActionDialog} onClose={() => setBulkActionDialog(null)}>
        <DialogTitle>
          Confirm Bulk Action
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to {bulkActionDialog} {selectedTalentIds.size} selected talent{selectedTalentIds.size !== 1 ? 's' : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={executeBulkAction}
            color={bulkActionDialog === 'shortlist' ? 'primary' : 'success'}
          >
            Confirm
          </Button>
        </DialogActions>
        </Dialog>

        {/* Athlete Details Dialog */}
        <Dialog
          open={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedTalent && (
            <SAIAthleteDetails
              athleteId={selectedTalent.athleteId}
              onClose={() => setViewDetailsOpen(false)}
            />
          )}
        </Dialog>


      </Container>
    </Box>
  );
};

export default SAIDashboard;
