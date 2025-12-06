import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Send,
  BookmarkBorder,
  MoreVert,
  AddCircleOutline,
  Search,
  Home,
  Explore,
  Message as MessageIcon,
  Notifications,
  AccountCircle,
  Close,
  Image as ImageIcon,
  Videocam,
  EmojiEmotions,
  Delete,
  PersonAdd,
  PersonRemove,
  Verified,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import socialService, { SocialPost, Story, UserProfile, Message } from '../services/socialService';
import StoriesBar from '../components/StoriesBar';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedSocialPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [reels, setReels] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Dialogs
  const [createPostDialog, setCreatePostDialog] = useState(false);
  const [createStoryDialog, setCreateStoryDialog] = useState(false);
  const [messagesDialog, setMessagesDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  
  // Post creation
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string>('');
  
  // Comments
  const [commentDialogs, setCommentDialogs] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Ensure user profile exists
      await socialService.createOrUpdateProfile(user);
      
      const loadedPosts = socialService.getPosts();
      setPosts(loadedPosts);
      
      const loadedStories = socialService.getStories();
      setStories(loadedStories);
      
      const suggested = await socialService.getSuggestedUsers(user.id, 5);
      setSuggestedUsers(suggested);
      
      // Load following status
      const profile = await socialService.getUserProfile(user.id);
      if (profile) {
        setFollowing(new Set(profile.following));
      }
      
      // Load reels
      const loadedReels = socialService.getReels();
      setReels(loadedReels);
      
      // Load notifications
      const loadedNotifications = socialService.getNotifications(user.id);
      setNotifications(loadedNotifications);
      setUnreadCount(socialService.getUnreadNotificationCount(user.id));
      
      // Load campaigns
      const loadedCampaigns = socialService.getCampaigns();
      setCampaigns(loadedCampaigns);
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    
    await socialService.createPost(
      user.id,
      user.displayName || user.email,
      user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=00f5ff&color=000`,
      newPostContent,
      newPostMedia || undefined,
      newPostMedia ? 'image' : undefined
    );
    
    setNewPostContent('');
    setNewPostMedia('');
    setCreatePostDialog(false);
    loadData();
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    await socialService.likePost(postId, user.id);
    loadData();
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    
    await socialService.addComment(
      postId,
      user.id,
      user.displayName || user.email,
      user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=00f5ff&color=000`,
      commentInputs[postId]
    );
    
    setCommentInputs({ ...commentInputs, [postId]: '' });
    loadData();
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;
    
    if (following.has(userId)) {
      await socialService.unfollowUser(user.id, userId);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      await socialService.followUser(user.id, userId);
      setFollowing(prev => new Set(prev).add(userId));
    }
    
    loadData();
  };

  const handleViewProfile = async (userId: string) => {
    const profile = await socialService.getUserProfile(userId);
    setSelectedProfile(profile);
    setProfileDialog(true);
  };

  const renderPost = (post: SocialPost) => {
    const isLiked = user && Array.isArray(post.likes) ? post.likes.includes(user.id) : false;
    
    return (
      <Card key={post.id} sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader
          avatar={
            <Avatar 
              src={post.userAvatar} 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleViewProfile(post.userId)}
            />
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
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProfile(post.userId)}
              >
                {post.userName}
              </Typography>
              <Verified sx={{ fontSize: 16, color: '#00f5ff' }} />
            </Box>
          }
          subheader={new Date(post.timestamp).toLocaleString()}
        />
        
        {post.mediaUrl && (
          <Box
            component="img"
            src={post.mediaUrl}
            alt="Post"
            sx={{
              width: '100%',
              maxHeight: 500,
              objectFit: 'cover',
            }}
          />
        )}
        
        <CardContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>{post.userName}</strong> {post.content}
          </Typography>
          
          {post.tags.length > 0 && (
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
              {post.tags.map(tag => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(0, 245, 255, 0.1)',
                    color: '#00f5ff',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        
        <CardActions disableSpacing>
          <IconButton onClick={() => handleLikePost(post.id)}>
            {isLiked ? (
              <Favorite sx={{ color: '#ff0050' }} />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {post.likes.length}
          </Typography>
          
          <IconButton onClick={() => setCommentDialogs({ ...commentDialogs, [post.id]: true })}>
            <ChatBubbleOutline />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {post.comments.length}
          </Typography>
          
          <IconButton>
            <Send />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton>
            <BookmarkBorder />
          </IconButton>
        </CardActions>
        
        {post.comments.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ cursor: 'pointer', mb: 1 }}
              onClick={() => setCommentDialogs({ ...commentDialogs, [post.id]: true })}
            >
              View all {post.comments.length} comments
            </Typography>
            
            {post.comments.slice(-2).map(comment => (
              <Typography key={comment.id} variant="body2" sx={{ mb: 0.5 }}>
                <strong>{comment.userName}</strong> {comment.content}
              </Typography>
            ))}
          </Box>
        )}
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <Avatar 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=00f5ff&color=000`}
            sx={{ width: 32, height: 32 }}
          />
          <TextField
            fullWidth
            size="small"
            placeholder="Add a comment..."
            value={commentInputs[post.id] || ''}
            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddComment(post.id);
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <EmojiEmotions />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="text" 
            onClick={() => handleAddComment(post.id)}
            disabled={!commentInputs[post.id]?.trim()}
          >
            Post
          </Button>
        </Box>
        
        {/* Comments Dialog */}
        <Dialog
          open={commentDialogs[post.id] || false}
          onClose={() => setCommentDialogs({ ...commentDialogs, [post.id]: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Comments
            <IconButton
              onClick={() => setCommentDialogs({ ...commentDialogs, [post.id]: false })}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <List>
              {post.comments.map(comment => (
                <ListItem key={comment.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={comment.userAvatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.content}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pt: 2 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Left Sidebar - Navigation */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 80, borderRadius: 3 }}>
              <List>
                <ListItem button selected={tabValue === 0} onClick={() => setTabValue(0)}>
                  <ListItemAvatar>
                    <Home />
                  </ListItemAvatar>
                  <ListItemText primary="Home" />
                </ListItem>
                
                <ListItem button selected={tabValue === 1} onClick={() => setTabValue(1)}>
                  <ListItemAvatar>
                    <Videocam />
                  </ListItemAvatar>
                  <ListItemText primary="Reels" />
                </ListItem>
                
                <ListItem button selected={tabValue === 2} onClick={() => setTabValue(2)}>
                  <ListItemAvatar>
                    <Badge badgeContent={3} color="error">
                      <MessageIcon />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText primary="Messages" />
                </ListItem>
                
                <ListItem button selected={tabValue === 3} onClick={() => setTabValue(3)}>
                  <ListItemAvatar>
                    <Badge badgeContent={unreadCount} color="error">
                      <Notifications />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText primary="Notifications" />
                </ListItem>
                
                <ListItem button selected={tabValue === 4} onClick={() => setTabValue(4)}>
                  <ListItemAvatar>
                    <Explore />
                  </ListItemAvatar>
                  <ListItemText primary="Recruitment" />
                </ListItem>
                
                <ListItem button onClick={() => handleViewProfile(user?.id || '')}>
                  <ListItemAvatar>
                    <AccountCircle />
                  </ListItemAvatar>
                  <ListItemText primary="Profile" />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={() => setCreatePostDialog(true)}
                    sx={{
                      bgcolor: '#00f5ff',
                      color: '#000',
                      '&:hover': { bgcolor: '#0080ff' },
                    }}
                  >
                    Create Post
                  </Button>
                </ListItem>
              </List>
            </Card>
          </Grid>
          
          {/* Main Content */}
          <Grid item xs={12} md={6}>
            {/* Tab 0: Home Feed */}
            {tabValue === 0 && (
              <>
                {/* Stories */}
                <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
                  <Box display="flex" gap={2} sx={{ overflowX: 'auto', pb: 1 }}>
                    {/* Add Story Button */}
                    <Box textAlign="center" sx={{ minWidth: 80 }}>
                      <Avatar
                        sx={{
                          width: 70,
                          height: 70,
                          border: '3px dashed rgba(0, 245, 255, 0.5)',
                          cursor: 'pointer',
                          mb: 1,
                        }}
                        onClick={() => setCreateStoryDialog(true)}
                      >
                        <AddCircleOutline sx={{ fontSize: 32, color: '#00f5ff' }} />
                      </Avatar>
                      <Typography variant="caption">Your Story</Typography>
                    </Box>
                    
                    {/* Stories */}
                    {stories.map(story => (
                      <Box key={story.id} textAlign="center" sx={{ minWidth: 80 }}>
                        <Avatar
                          src={story.userAvatar}
                          sx={{
                            width: 70,
                            height: 70,
                            border: '3px solid #00f5ff',
                            cursor: 'pointer',
                            mb: 1,
                          }}
                        />
                        <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
                          {story.userName}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
                
                {/* Posts Feed */}
                {posts.map(post => renderPost(post))}
                
                {posts.length === 0 && (
                  <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">
                      No posts yet. Be the first to share!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutline />}
                      onClick={() => setCreatePostDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Create Post
                    </Button>
                  </Card>
                )}
              </>
            )}
            
            {/* Tab 1: Reels */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
                  Sports Reels 🎬
                </Typography>
                <Grid container spacing={2}>
                  {reels.map((reel: any) => (
                    <Grid item xs={12} sm={6} key={reel.id}>
                      <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { transform: 'scale(1.02)' }, transition: 'all 0.3s' }}>
                        <Box
                          component="img"
                          src={reel.thumbnailUrl}
                          alt={reel.title}
                          sx={{ width: '100%', height: 300, objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Avatar src={reel.userAvatar} sx={{ width: 32, height: 32 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {reel.userName}
                            </Typography>
                          </Box>
                          <Typography variant="body2" mb={1}>
                            {reel.title}
                          </Typography>
                          <Box display="flex" gap={2}>
                            <Typography variant="caption" color="text.secondary">
                              👁️ {reel.views} views
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ❤️ {reel.likes.length} likes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ⏱️ {reel.duration}s
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Tab 2: Messages */}
            {tabValue === 2 && (
              <Card sx={{ borderRadius: 3, p: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
                  Messages 💬
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search messages..."
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <List>
                  {[
                    { name: 'Sarah Johnson', message: 'Great workout today! 💪', time: '2h ago', unread: 2, avatar: 'Sarah+Johnson', bg: '00f5ff' },
                    { name: 'Mike Chen', message: 'Thanks for the training tips!', time: '5h ago', unread: 0, avatar: 'Mike+Chen', bg: 'ff6b35' },
                    { name: 'Alex Rivera', message: 'See you at training tomorrow', time: '1d ago', unread: 1, avatar: 'Alex+Rivera', bg: '4ecdc4' },
                    { name: 'Priya Sharma', message: 'Can you share that workout plan?', time: '1d ago', unread: 3, avatar: 'Priya+Sharma', bg: 'ffe66d' },
                    { name: 'Rahul Kumar', message: 'Awesome performance! 🏆', time: '2d ago', unread: 0, avatar: 'Rahul+Kumar', bg: 'f72585' },
                    { name: 'Emma Wilson', message: 'Let\'s train together this week', time: '2d ago', unread: 1, avatar: 'Emma+Wilson', bg: '7209b7' },
                    { name: 'Jordan Smith', message: 'Check out my new PR!', time: '3d ago', unread: 0, avatar: 'Jordan+Smith', bg: '3a0ca3' },
                    { name: 'Aisha Patel', message: 'Thanks for the motivation 🙏', time: '3d ago', unread: 2, avatar: 'Aisha+Patel', bg: '4cc9f0' },
                    { name: 'Carlos Rodriguez', message: 'Great game yesterday!', time: '4d ago', unread: 0, avatar: 'Carlos+Rodriguez', bg: 'f72585' },
                    { name: 'Yuki Tanaka', message: 'When is the next session?', time: '4d ago', unread: 1, avatar: 'Yuki+Tanaka', bg: 'a8dadc' },
                    { name: 'SAI Recruitment', message: 'Your application has been received', time: '5d ago', unread: 0, avatar: 'SAI', bg: '00f5ff' },
                    { name: 'Coach Anderson', message: 'Excellent progress this month!', time: '5d ago', unread: 0, avatar: 'Coach+Anderson', bg: 'ff6b35' },
                    { name: 'Team Captain', message: 'Practice at 6 AM tomorrow', time: '6d ago', unread: 0, avatar: 'Team+Captain', bg: '4ecdc4' },
                    { name: 'Fitness Buddy', message: 'Ready for the challenge? 💪', time: '6d ago', unread: 1, avatar: 'Fitness+Buddy', bg: 'ffe66d' },
                    { name: 'Training Partner', message: 'Let\'s hit the gym!', time: '1w ago', unread: 0, avatar: 'Training+Partner', bg: '7209b7' },
                  ].map((msg, i) => (
                    <ListItem key={i} button sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(0, 245, 255, 0.1)' } }}>
                      <ListItemAvatar>
                        <Badge badgeContent={msg.unread} color="error">
                          <Avatar src={`https://ui-avatars.com/api/?name=${msg.avatar}&background=${msg.bg}&color=000`} />
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography fontWeight={msg.unread > 0 ? 'bold' : 'normal'}>{msg.name}</Typography>}
                        secondary={
                          <Typography variant="body2" color={msg.unread > 0 ? 'text.primary' : 'text.secondary'}>
                            {msg.message}
                          </Typography>
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {msg.time}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Card>
            )}
            
            {/* Tab 3: Notifications */}
            {tabValue === 3 && (
              <Card sx={{ borderRadius: 3, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    Notifications 🔔
                  </Typography>
                  <Button size="small" onClick={() => {
                    if (user) {
                      socialService.markAllNotificationsAsRead(user.id);
                      loadData();
                    }
                  }}>
                    Mark all as read
                  </Button>
                </Box>
                <List>
                  {notifications.map((notif: any) => (
                    <ListItem key={notif.id} sx={{ borderRadius: 2, mb: 1, bgcolor: notif.read ? 'transparent' : 'rgba(0, 245, 255, 0.1)' }}>
                      <ListItemAvatar>
                        <Avatar src={notif.fromUserAvatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography>
                            <strong>{notif.fromUserName}</strong> {notif.content}
                          </Typography>
                        }
                        secondary={new Date(notif.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                  {notifications.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                      No notifications yet
                    </Typography>
                  )}
                </List>
              </Card>
            )}
            
            {/* Tab 4: Recruitment Campaigns */}
            {tabValue === 4 && (
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
                  SAI Recruitment Campaigns 🏆
                </Typography>
                {campaigns.map((campaign: any) => (
                  <Card key={campaign.id} sx={{ mb: 3, borderRadius: 3 }}>
                    <Box
                      component="img"
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Chip
                        label={campaign.organization}
                        size="small"
                        sx={{ mb: 2, bgcolor: 'rgba(0, 245, 255, 0.2)', color: '#00f5ff' }}
                      />
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {campaign.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {campaign.description}
                      </Typography>
                      
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        Requirements:
                      </Typography>
                      <List dense>
                        {campaign.requirements.map((req: string, i: number) => (
                          <ListItem key={i} sx={{ py: 0.5 }}>
                            <Typography variant="body2">• {req}</Typography>
                          </ListItem>
                        ))}
                      </List>
                      
                      <Typography variant="subtitle2" fontWeight="bold" mb={1} mt={2}>
                        Benefits:
                      </Typography>
                      <List dense>
                        {campaign.benefits.map((benefit: string, i: number) => (
                          <ListItem key={i} sx={{ py: 0.5 }}>
                            <Typography variant="body2">✓ {benefit}</Typography>
                          </ListItem>
                        ))}
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={async () => {
                            if (user) {
                              await socialService.applyToCampaign(campaign.id, user.id);
                              loadData();
                            }
                          }}
                          disabled={campaign.applicants.includes(user?.id)}
                          sx={{
                            bgcolor: campaign.applicants.includes(user?.id) ? 'grey' : '#00f5ff',
                            color: '#000',
                          }}
                        >
                          {campaign.applicants.includes(user?.id) ? 'Applied ✓' : 'Apply Now'}
                        </Button>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {campaign.applicants.length} athletes applied
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
          
          {/* Right Sidebar - Suggestions */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 80, borderRadius: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Suggestions For You
              </Typography>
              
              <List>
                {suggestedUsers.map(profile => (
                  <ListItem key={profile.userId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={profile.avatar}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewProfile(profile.userId)}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {profile.displayName}
                          </Typography>
                          {profile.verified && (
                            <Verified sx={{ fontSize: 14, color: '#00f5ff' }} />
                          )}
                        </Box>
                      }
                      secondary={`${profile.followers.length} followers`}
                    />
                    <Button
                      size="small"
                      variant={following.has(profile.userId) ? 'outlined' : 'contained'}
                      onClick={() => handleFollow(profile.userId)}
                      startIcon={following.has(profile.userId) ? <PersonRemove /> : <PersonAdd />}
                    >
                      {following.has(profile.userId) ? 'Unfollow' : 'Follow'}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Container>
      
      {/* Create Post Dialog */}
      <Dialog
        open={createPostDialog}
        onClose={() => setCreatePostDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Post
          <IconButton
            onClick={() => setCreatePostDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            placeholder="Image URL (optional)"
            value={newPostMedia}
            onChange={(e) => setNewPostMedia(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ImageIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePostDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePost}
            disabled={!newPostContent.trim()}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Messages Dialog - Placeholder */}
      <Dialog
        open={messagesDialog}
        onClose={() => setMessagesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Messages
          <IconButton
            onClick={() => setMessagesDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Messages feature coming soon!
          </Typography>
        </DialogContent>
      </Dialog>
      
      {/* Profile Dialog */}
      <Dialog
        open={profileDialog}
        onClose={() => setProfileDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedProfile && (
          <>
            <DialogTitle>
              <IconButton
                onClick={() => setProfileDialog(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box textAlign="center" py={2}>
                <Avatar
                  src={selectedProfile.avatar}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                />
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={1}>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedProfile.displayName}
                  </Typography>
                  {selectedProfile.verified && (
                    <Verified sx={{ fontSize: 24, color: '#00f5ff' }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  @{selectedProfile.userName}
                </Typography>
                
                <Typography variant="body1" mb={3}>
                  {selectedProfile.bio}
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={4} mb={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {selectedProfile.postsCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Posts
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {selectedProfile.followers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Followers
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {selectedProfile.following.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Following
                    </Typography>
                  </Box>
                </Box>
                
                {user && selectedProfile.userId !== user.id && (
                  <Button
                    fullWidth
                    variant={following.has(selectedProfile.userId) ? 'outlined' : 'contained'}
                    onClick={() => handleFollow(selectedProfile.userId)}
                    startIcon={following.has(selectedProfile.userId) ? <PersonRemove /> : <PersonAdd />}
                  >
                    {following.has(selectedProfile.userId) ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EnhancedSocialPage;
