import React from 'react';
import { Box, Avatar, Typography, Badge } from '@mui/material';
import { Add } from '@mui/icons-material';

interface Story {
  id: string;
  userName: string;
  userAvatar?: string;
  hasNewStory: boolean;
}

interface StoriesBarProps {
  stories: Story[];
  onStoryClick: (storyId: string) => void;
  onAddStory: () => void;
}

const StoriesBar: React.FC<StoriesBarProps> = ({ stories, onStoryClick, onAddStory }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 2,
        mb: 3,
        '&::-webkit-scrollbar': {
          height: 6,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 3,
        },
      }}
    >
      {/* Add Story Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 80,
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 },
        }}
        onClick={onAddStory}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: 'primary.main',
                border: '2px solid white',
              }}
            >
              <Add sx={{ fontSize: 16 }} />
            </Avatar>
          }
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              border: '3px solid',
              borderColor: 'grey.300',
            }}
          >
            Y
          </Avatar>
        </Badge>
        <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center' }}>
          Your Story
        </Typography>
      </Box>

      {/* Stories */}
      {stories.map((story) => (
        <Box
          key={story.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 80,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={() => onStoryClick(story.id)}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              border: '3px solid',
              borderColor: story.hasNewStory ? 'primary.main' : 'grey.300',
              background: story.hasNewStory
                ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
                : 'grey.300',
              padding: '3px',
            }}
          >
            <Avatar
              src={story.userAvatar}
              sx={{
                width: '100%',
                height: '100%',
                border: '2px solid white',
              }}
            >
              {story.userName.charAt(0).toUpperCase()}
            </Avatar>
          </Avatar>
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              textAlign: 'center',
              maxWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {story.userName}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StoriesBar;
