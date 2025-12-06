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
  Chip,
  Paper,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  Warning,
  CheckCircle,
  Error,
  Security,
  Assessment,
  Flag,
} from '@mui/icons-material';

const AssessmentIntegrityPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Mock data for demonstration
  const integrityIssues = [
    { id: 1, athlete: 'John Doe', test: 'Speed Test', issue: 'Anomalous Results', severity: 'high', status: 'investigating' },
    { id: 2, athlete: 'Jane Smith', test: 'Strength Test', issue: 'Video Quality', severity: 'medium', status: 'resolved' },
    { id: 3, athlete: 'Mike Johnson', test: 'Agility Test', issue: 'Timing Inconsistency', severity: 'low', status: 'pending' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'investigating': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
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
                  Assessment Integrity
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Monitor assessment integrity and review flagged activities
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
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#4caf50' }} fontWeight="bold">
                  1,156
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Valid Assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Warning sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#ff9800' }} fontWeight="bold">
                  23
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Flagged Issues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(244, 67, 54, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Error sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#f44336' }} fontWeight="bold">
                  5
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Critical Issues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Security sx={{ fontSize: 40, color: '#00f5ff', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#00f5ff' }} fontWeight="bold">
                  98.2%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Integrity Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alert for Critical Issues */}
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            color: '#ff9800',
          }}
        >
          <Typography variant="body1">
            5 critical integrity issues require immediate attention. Review flagged assessments below.
          </Typography>
        </Alert>

        {/* Tabs */}
        <Paper 
          elevation={3}
          sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 245, 255, 0.1)',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 245, 255, 0.2)' }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#00f5ff',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00f5ff',
                },
              }}
            >
              <Tab label="All Issues" />
              <Tab label="High Priority" />
              <Tab label="Under Investigation" />
              <Tab label="Resolved" />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Athlete</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Test Type</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Issue</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: '#00f5ff', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrityIssues.map((issue) => (
                  <TableRow key={issue.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' } }}>
                    <TableCell>
                      <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {issue.athlete}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        icon={<Assessment />}
                        label={issue.test} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(0, 245, 255, 0.2)',
                          color: '#00f5ff',
                          border: '1px solid rgba(0, 245, 255, 0.3)',
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {issue.issue}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        icon={<Flag />}
                        label={issue.severity.toUpperCase()} 
                        size="small"
                        sx={{ 
                          backgroundColor: `${getSeverityColor(issue.severity)}20`,
                          color: getSeverityColor(issue.severity),
                          border: `1px solid ${getSeverityColor(issue.severity)}40`,
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={issue.status.charAt(0).toUpperCase() + issue.status.slice(1)} 
                        color={getStatusColor(issue.status) as any}
                        size="small"
                        sx={{ color: '#fff' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ 
                          color: '#00f5ff',
                          borderColor: '#00f5ff',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 245, 255, 0.1)',
                          },
                        }}
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
      </Container>
    </Box>
  );
};

export default AssessmentIntegrityPage;