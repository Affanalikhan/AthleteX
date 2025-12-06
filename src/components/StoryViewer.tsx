import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Avatar,
  Typography,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Close, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Story } from '../services/socialService';

interface StoryViewerProps {
  open: boolean;
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  onView: (storyId: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  open,
  stories,
  initialStoryIndex,
  onClose,
  onView,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 5000; // 5 seconds per story

  // Define handlers first
  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setProgress(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    setCurrentIndex(initialStoryIndex);
    setProgress(0);
  }, [open, initialStoryIndex]);

  useEffect(() => {
    if (!open || !stories[currentIndex]) return;

    console.log('Viewing story:', stories[currentIndex]);

    // Mark story as viewed
    onView(stories[currentIndex].id);

    // Progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open, currentIndex, stories]);

  if (!open || !stories[currentIndex]) return null;

  const currentStory = stories[currentIndex];
  const timeAgo = getTimeAgo(currentStory.timestamp);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          height: '90vh',
          maxHeight: '90vh',
          m: 0,
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Progress bars */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            gap: 0.5,
            p: 1,
            zIndex: 2,
          }}
        >
          {stories.map((_, index) => (
            <Box key={index} sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={
                  index < currentIndex
                    ? 100
                    : index === currentIndex
                    ? progress
                    : 0
                }
                sx={{
                  height: 3,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pt: 4,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            zIndex: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src={currentStory.userAvatar}
              sx={{ width: 40, height: 40, border: '2px solid white' }}
            >
              {currentStory.userName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {currentStory.userName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {timeAgo}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Story Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              loop
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Navigation areas */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '30%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              pl: 1,
              '&:hover .nav-icon': {
                opacity: 1,
              },
            }}
            onClick={handlePrevious}
          >
            {currentIndex > 0 && (
              <IconButton
                className="nav-icon"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.5)',
                  },
                }}
              >
                <ArrowBackIos sx={{ ml: 0.5 }} />
              </IconButton>
            )}
          </Box>

          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '30%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pr: 1,
              '&:hover .nav-icon': {
                opacity: 1,
              },
            }}
            onClick={handleNext}
          >
            {currentIndex < stories.length - 1 && (
              <IconButton
                className="nav-icon"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.5)',
                  },
                }}
              >
                <ArrowForwardIos />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Views count */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            zIndex: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            👁️ {currentStory.views.length} {currentStory.views.length === 1 ? 'view' : 'views'}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default StoryViewer;
