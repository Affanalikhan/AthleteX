import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  TextField,
  Collapse,
  Button,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  SendOutlined,
  BookmarkBorder,
  MoreVert,
  Verified,
} from '@mui/icons-material';
import { SocialPost } from '../models';

interface InstagramPostProps {
  post: SocialPost;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onShare: (postId: string) => void;
  onUserClick: (userId: string) => void;
}

const InstagramPost: React.FC<InstagramPostProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onUserClick,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const isLiked = currentUserId ? post.likedBy.includes(currentUserId) : false;

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 7) return timestamp.toLocaleDateString();
    if (days > 0) return `${days} DAYS AGO`;
    if (hours > 0) return `${hours} HOURS AGO`;
    return 'JUST NOW';
  };

  return (
    <Card sx={{ mb: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <CardHeader
        avatar={
          <Avatar
            sx={{ cursor: 'pointer' }}
            onClick={() => onUserClick(post.athleteId)}
          >
            {post.athleteName.charAt(0).toUpperCase()}
          </Avatar>
        }
        action={
          <IconButton>
            <MoreVert />
          </IconButton>
        }
        title={
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
              onClick={() => onUserClick(post.athleteId)}
            >
              {post.athleteName}
            </Typography>
            {['sarah_johnson', 'emma_wilson', 'jordan_smith'].includes(post.athleteId) && (
              <Verified color="primary" sx={{ fontSize: 16 }} />
            )}
          </Box>
        }
        subheader={formatTimestamp(post.timestamp)}
        sx={{ pb: 1 }}
      />

      {/* Media */}
      {post.mediaUrl && (
        <CardMedia
          component={post.mediaType === 'video' ? 'video' : 'img'}
          height="500"
          image={post.mediaUrl}
          src={post.mediaType === 'video' ? post.mediaUrl : undefined}
          controls={post.mediaType === 'video'}
          sx={{ objectFit: 'cover' }}
        />
      )}

      {/* Actions */}
      <CardActions disableSpacing sx={{ px: 2, py: 1 }}>
        <IconButton onClick={() => onLike(post.id)}>
          {isLiked ? <Favorite sx={{ color: 'red' }} /> : <FavoriteBorder />}
        </IconButton>
        <IconButton onClick={() => setShowComments(!showComments)}>
          <ChatBubbleOutline />
        </IconButton>
        <IconButton onClick={() => onShare(post.id)}>
          <SendOutlined />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton>
          <BookmarkBorder />
        </IconButton>
      </CardActions>

      {/* Likes Count */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {post.likes.toLocaleString()} likes
        </Typography>
      </Box>

      {/* Caption */}
      <CardContent sx={{ pt: 0, pb: 1 }}>
        <Typography variant="body2">
          <Typography component="span" variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
            {post.athleteName}
          </Typography>
          {post.content}
        </Typography>
      </CardContent>

      {/* View Comments */}
      {post.comments.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Button
            size="small"
            sx={{ textTransform: 'none', color: 'text.secondary', p: 0, minWidth: 0 }}
            onClick={() => setShowComments(!showComments)}
          >
            View all {post.comments.length} comments
          </Button>
        </Box>
      )}

      {/* Comments Section */}
      <Collapse in={showComments}>
        <Box sx={{ px: 2, pb: 1, maxHeight: 200, overflowY: 'auto' }}>
          {post.comments.map((comment) => (
            <Box key={comment.id} sx={{ mb: 1 }}>
              <Typography variant="body2">
                <Typography component="span" variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                  {comment.athleteName}
                </Typography>
                {comment.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(comment.timestamp)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>

      {/* Add Comment */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="Add a comment..."
          variant="standard"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommentSubmit();
            }
          }}
          InputProps={{
            disableUnderline: true,
          }}
          sx={{ fontSize: 14 }}
        />
        {commentText.trim() && (
          <Button
            size="small"
            onClick={handleCommentSubmit}
            sx={{ textTransform: 'none', fontWeight: 'bold', minWidth: 0 }}
          >
            Post
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default InstagramPost;
