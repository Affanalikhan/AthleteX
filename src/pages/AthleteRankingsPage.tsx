import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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
  Avatar,
  Chip,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  EmojiEvents,
  TrendingUp,
  Assessment,
  FilterList,
  Search,
} from '@mui/icons-material';

const AthleteRankingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');

  // Mock data for demonstration
  const athletes = [
    { id: 1, name: 'Sarah Johnson', sport: 'Athletics', score: 95.2, rank: 1, location: 'Mumbai' },
    { id: 2, name: 'Raj Patel', sport: 'Swimming', score: 92.8, rank: 2, location: 'Delhi' },
    { id: 3, name: 'Priya Singh', sport: 'Basketball', score: 90.5, rank: 3, location: 'Bangalore' },
    { id: 4, name: 'Arjun Kumar', sport: 'Football', score: 89.1, rank: 4, location: 'Chennai' },
    { id: 5, name: 'Meera Sharma', sport: 'Tennis', score: 87.9, rank: 5, location: 'Kolkata' },
  ];

  const sports = ['Athletics', 'Swimming', 'Basketball', 'Football', 'Tennis', 'Cricket', 'Hockey'];

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
                  Athlete Rankings
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  View athlete rankings, assessments, and performance data
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
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 245, 255, 0.1)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 40, color: '#ffd700', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#00f5ff' }} fontWeight="bold">
                  2,847
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Athletes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#4caf50' }} fontWeight="bold">
                  156
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Top Performers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#ff9800' }} fontWeight="bold">
                  1,234
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Assessments Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 245, 255, 0.1)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterList sx={{ color: '#00f5ff' }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>Filter Athletes</Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(0, 245, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00f5ff',
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sport</InputLabel>
                <Select
                  value={selectedSport}
                  label="Sport"
                  onChange={(e) => setSelectedSport(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 245, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00f5ff',
                    },
                  }}
                >
                  <MenuItem value="all">All Sports</MenuItem>
                  {sports.map(sport => (
                    <MenuItem key={sport} value={sport}>{sport}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Rankings Table */}
        <Paper 
          elevation={3}
          sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 245, 255, 0.1)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Rank</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Athlete</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Sport</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Score</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {athletes.map((athlete) => (
                  <TableRow key={athlete.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          #{athlete.rank}
                        </Typography>
                        {athlete.rank <= 3 && <EmojiEvents sx={{ color: '#ffd700' }} />}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#00f5ff', color: '#000' }}>
                          {athlete.name.charAt(0)}
                        </Avatar>
                        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {athlete.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={athlete.sport} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(0, 245, 255, 0.2)',
                          color: '#00f5ff',
                          border: '1px solid rgba(0, 245, 255, 0.3)',
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {athlete.score}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {athlete.location}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small"
                        sx={{ color: '#fff' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default AthleteRankingsPage;