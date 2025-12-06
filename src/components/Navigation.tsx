import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle,
  Assessment,
  TrendingUp,
  FitnessCenter,
  Groups,
  Logout,
  School
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogoClick = () => {
    // If user is authenticated, go to profile page, otherwise go to landing page
    if (user) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleClose();
  };

  const getNavItems = () => {
    const items = [
      { label: 'Profile', path: '/profile', icon: <AccountCircle /> },
      { label: 'Assessment', path: '/assessment', icon: <Assessment /> },
      { label: 'Performance', path: '/performance', icon: <TrendingUp /> },
      { label: 'Training', path: '/training', icon: <FitnessCenter /> },
      { label: 'Coaches', path: '/coaches', icon: <School /> },
      { label: 'Social', path: '/social', icon: <Groups /> }
    ];

    return items;
  };

  const navItems = getNavItems();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(0, 245, 255, 0.1))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 245, 255, 0.2)'
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box 
          display="flex" 
          alignItems="center" 
          gap={2} 
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={handleLogoClick}
        >
          <FitnessCenter sx={{ fontSize: 28, color: '#00f5ff' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00f5ff, #0080ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            AthleteX
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => handleNavigation(item.path)}
                variant={location.pathname === item.path ? 'contained' : 'text'}
                startIcon={item.icon}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  ...(location.pathname === item.path ? {
                    bgcolor: '#00f5ff',
                    color: '#000',
                    '&:hover': {
                      bgcolor: '#0080ff'
                    }
                  } : {
                    color: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 245, 255, 0.1)',
                      color: '#00f5ff'
                    }
                  })
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ ml: 2 }}>
          <IconButton
            size="large"
            aria-label="account menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            {user?.photoURL ? (
              <Avatar 
                src={user.photoURL} 
                sx={{ 
                  width: 32, 
                  height: 32,
                  border: '2px solid #00f5ff'
                }} 
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'linear-gradient(135deg, #00f5ff, #0080ff)',
                  border: '2px solid rgba(0, 245, 255, 0.5)',
                  color: '#000',
                  fontWeight: 'bold'
                }}
              >
                {user?.displayName?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
            )}
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                bgcolor: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                borderRadius: 2,
                mt: 1
              }
            }}
          >
            <MenuItem disabled>
              <Typography variant="subtitle2">
                {user?.displayName || user?.email}
              </Typography>
            </MenuItem>

            {isMobile && (
              <>
                {navItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path}
                  >
                    {item.icon}
                    <Typography sx={{ ml: 1 }}>{item.label}</Typography>
                  </MenuItem>
                ))}
                <MenuItem divider />
              </>
            )}

            <MenuItem onClick={handleSignOut}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
