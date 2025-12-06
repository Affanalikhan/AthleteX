import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge
} from '@mui/material';
import {
  Home as HomeIcon,
  FitnessCenter as FitnessIcon,
  TrendingUp as PerformanceIcon,
  People as SocialIcon,
  Person as ProfileIcon
} from '@mui/icons-material';

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/profile') return 0;
    if (path === '/assessment' || path === '/assessment/ai') return 1;
    if (path === '/performance') return 2;
    if (path === '/training') return 3;
    if (path === '/social') return 4;
    return 0;
  };

  const [value, setValue] = React.useState(getActiveTab());

  React.useEffect(() => {
    setValue(getActiveTab());
  }, [location.pathname]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/profile');
        break;
      case 1:
        navigate('/assessment');
        break;
      case 2:
        navigate('/performance');
        break;
      case 3:
        navigate('/training');
        break;
      case 4:
        navigate('/social');
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255, 255, 255, 0.5)',
            minWidth: 'auto',
            padding: '8px 12px',
            '&.Mui-selected': {
              color: '#00f5ff',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Profile"
          icon={<ProfileIcon />}
        />
        <BottomNavigationAction
          label="Assess"
          icon={<FitnessIcon />}
        />
        <BottomNavigationAction
          label="Stats"
          icon={<PerformanceIcon />}
        />
        <BottomNavigationAction
          label="Train"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Social"
          icon={
            <Badge badgeContent={0} color="error">
              <SocialIcon />
            </Badge>
          }
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileNavigation;
