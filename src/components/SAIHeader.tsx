import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
} from '@mui/material';
import {
  Home,
  AccountBalance,
  NavigateNext,
} from '@mui/icons-material';

interface SAIHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  actions?: React.ReactNode;
}

const SAIHeader: React.FC<SAIHeaderProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions 
}) => {
  const navigate = useNavigate();

  const defaultBreadcrumbs = [
    { label: 'Main Page', path: '/' },
    { label: 'SAI Portal', path: '/sai-portal' },
    ...breadcrumbs,
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{ mb: 2 }}
      >
        {defaultBreadcrumbs.map((crumb, index) => (
          <Link
            key={index}
            color={index === defaultBreadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
            href={crumb.path}
            onClick={(e) => {
              if (crumb.path) {
                e.preventDefault();
                navigate(crumb.path);
              }
            }}
            sx={{
              textDecoration: 'none',
              cursor: crumb.path ? 'pointer' : 'default',
              '&:hover': crumb.path ? { textDecoration: 'underline' } : {},
            }}
          >
            {crumb.label}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Header Content */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/')}
          >
            Back to Main Page
          </Button>
          {actions}
        </Box>
      </Box>
    </Paper>
  );
};

export default SAIHeader;