// Social Service - Instagram-like functionality
import { User } from '../models';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[]; // Array of user IDs who liked
  comments: Comment[];
  timestamp: Date;
  location?: string;
  tags: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: string[];
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: Date;
  expiresAt: Date;
  views: string[]; // Array of user IDs who viewed
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  mediaUrl?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
}

export interface UserProfile {
  userId: string;
  userName: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: string[];
  following: string[];
  postsCount: number;
  verified: boolean;
}

export interface Reel {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  likes: string[];
  comments: Comment[];
  views: number;
  timestamp: Date;
  tags: string[];
  duration: number; // in seconds
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'recruitment';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  content: string;
  postId?: string;
  timestamp: Date;
  read: boolean;
}

export interface RecruitmentCampaign {
  id: string;
  title: string;
  description: string;
  organization: string;
  imageUrl: string;
  deadline: Date;
  requirements: string[];
  benefits: string[];
  contactEmail: string;
  applicants: string[];
  status: 'active' | 'closed';
  timestamp: Date;
}

class SocialService {
  private readonly POSTS_KEY = 'athletex_social_posts';
  private readonly STORIES_KEY = 'athletex_social_stories';
  private readonly MESSAGES_KEY = 'athletex_social_messages';
  private readonly PROFILES_KEY = 'athletex_social_profiles';
  private readonly CONVERSATIONS_KEY = 'athletex_social_conversations';
  private readonly REELS_KEY = 'athletex_social_reels';
  private readonly NOTIFICATIONS_KEY = 'athletex_social_notifications';
  private readonly CAMPAIGNS_KEY = 'athletex_recruitment_campaigns';

  // ============ POSTS ============
  
  async createPost(userId: string, userName: string, userAvatar: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video'): Promise<SocialPost> {
    const post: SocialPost = {
      id: this.generateId(),
      userId,
      userName,
      userAvatar,
      content,
      mediaUrl,
      mediaType,
      likes: [],
      comments: [],
      timestamp: new Date(),
      tags: this.extractTags(content),
    };

    const posts = await this.getPosts();
    posts.unshift(post);
    this.savePosts(posts);
    
    return post;
  }

  getPosts(): SocialPost[] {
    try {
      const stored = localStorage.getItem(this.POSTS_KEY);
      return stored ? JSON.parse(stored).map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
        likes: Array.isArray(p.likes) ? p.likes : [],
        comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
          likes: Array.isArray(c.likes) ? c.likes : []
        })) : [],
        tags: Array.isArray(p.tags) ? p.tags : []
      })) : this.getDefaultPosts();
    } catch {
      return this.getDefaultPosts();
    }
  }

  async getPostById(postId: string): Promise<SocialPost | null> {
    const posts = this.getPosts();
    return posts.find(p => p.id === postId) || null;
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post) {
      const likeIndex = post.likes.indexOf(userId);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1); // Unlike
      } else {
        post.likes.push(userId); // Like
      }
      this.savePosts(posts);
    }
  }

  async addComment(postId: string, userId: string, userName: string, userAvatar: string, content: string): Promise<Comment> {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post) {
      const comment: Comment = {
        id: this.generateId(),
        userId,
        userName,
        userAvatar,
        content,
        timestamp: new Date(),
        likes: [],
      };
      
      post.comments.push(comment);
      this.savePosts(posts);
      return comment;
    }
    
    throw new Error('Post not found');
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const posts = this.getPosts();
    const filteredPosts = posts.filter(p => !(p.id === postId && p.userId === userId));
    this.savePosts(filteredPosts);
  }

  // ============ STORIES ============
  
  async createStory(userId: string, userName: string, userAvatar: string, mediaUrl: string, mediaType: 'image' | 'video'): Promise<Story> {
    const story: Story = {
      id: this.generateId(),
      userId,
      userName,
      userAvatar,
      mediaUrl,
      mediaType,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      views: [],
    };

    const stories = this.getStories();
    stories.unshift(story);
    this.saveStories(stories);
    
    return story;
  }

  getStories(): Story[] {
    try {
      const stored = localStorage.getItem(this.STORIES_KEY);
      const stories = stored ? JSON.parse(stored).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
        expiresAt: new Date(s.expiresAt)
      })) : this.getDefaultStories();
      
      // Filter out expired stories
      const now = new Date();
      return stories.filter((s: Story) => s.expiresAt > now);
    } catch {
      return this.getDefaultStories();
    }
  }

  async viewStory(storyId: string, userId: string): Promise<void> {
    const stories = this.getStories();
    const story = stories.find(s => s.id === storyId);
    
    if (story && !story.views.includes(userId)) {
      story.views.push(userId);
      this.saveStories(stories);
    }
  }

  // ============ MESSAGES ============
  
  async sendMessage(senderId: string, receiverId: string, content: string, mediaUrl?: string): Promise<Message> {
    const message: Message = {
      id: this.generateId(),
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
      read: false,
      mediaUrl,
    };

    const messages = this.getMessages();
    messages.push(message);
    this.saveMessages(messages);
    
    // Update conversation
    await this.updateConversation(senderId, receiverId, message);
    
    return message;
  }

  getMessages(): Message[] {
    try {
      const stored = localStorage.getItem(this.MESSAGES_KEY);
      return stored ? JSON.parse(stored).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })) : [];
    } catch {
      return [];
    }
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    const messages = this.getMessages();
    return messages.filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const stored = localStorage.getItem(this.CONVERSATIONS_KEY);
      const conversations = stored ? JSON.parse(stored).map((c: any) => ({
        ...c,
        lastMessage: {
          ...c.lastMessage,
          timestamp: new Date(c.lastMessage.timestamp)
        }
      })) : [];
      
      return conversations.filter((c: Conversation) => 
        c.participants.includes(userId)
      ).sort((a: Conversation, b: Conversation) => 
        b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
      );
    } catch {
      return [];
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    const messages = this.getMessages();
    const message = messages.find(m => m.id === messageId);
    
    if (message) {
      message.read = true;
      this.saveMessages(messages);
    }
  }

  // ============ FOLLOW SYSTEM ============
  
  async followUser(followerId: string, followingId: string): Promise<void> {
    const profiles = this.getProfiles();
    
    const followerProfile = profiles.find(p => p.userId === followerId);
    const followingProfile = profiles.find(p => p.userId === followingId);
    
    if (followerProfile && followingProfile) {
      if (!followerProfile.following.includes(followingId)) {
        followerProfile.following.push(followingId);
      }
      if (!followingProfile.followers.includes(followerId)) {
        followingProfile.followers.push(followerId);
      }
      this.saveProfiles(profiles);
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const profiles = this.getProfiles();
    
    const followerProfile = profiles.find(p => p.userId === followerId);
    const followingProfile = profiles.find(p => p.userId === followingId);
    
    if (followerProfile && followingProfile) {
      followerProfile.following = followerProfile.following.filter(id => id !== followingId);
      followingProfile.followers = followingProfile.followers.filter(id => id !== followerId);
      this.saveProfiles(profiles);
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const profiles = this.getProfiles();
    const followerProfile = profiles.find(p => p.userId === followerId);
    return followerProfile ? followerProfile.following.includes(followingId) : false;
  }

  // ============ USER PROFILES ============
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profiles = this.getProfiles();
    return profiles.find(p => p.userId === userId) || null;
  }

  async createOrUpdateProfile(user: User): Promise<UserProfile> {
    const profiles = this.getProfiles();
    let profile = profiles.find(p => p.userId === user.id);
    
    if (!profile) {
      profile = {
        userId: user.id,
        userName: user.displayName || user.email.split('@')[0],
        displayName: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=00f5ff&color=000`,
        bio: 'Athlete on AthleteX 🏃‍♂️',
        followers: [],
        following: [],
        postsCount: 0,
        verified: false,
      };
      profiles.push(profile);
    }
    
    this.saveProfiles(profiles);
    return profile;
  }

  async getSuggestedUsers(userId: string, limit: number = 5): Promise<UserProfile[]> {
    const profiles = this.getProfiles();
    const currentProfile = profiles.find(p => p.userId === userId);
    
    if (!currentProfile) return [];
    
    return profiles
      .filter(p => 
        p.userId !== userId && 
        !currentProfile.following.includes(p.userId)
      )
      .slice(0, limit);
  }

  // ============ REELS ============
  
  async createReel(userId: string, userName: string, userAvatar: string, title: string, videoUrl: string, thumbnailUrl: string, duration: number): Promise<Reel> {
    const reel: Reel = {
      id: this.generateId(),
      userId,
      userName,
      userAvatar,
      title,
      videoUrl,
      thumbnailUrl,
      likes: [],
      comments: [],
      views: 0,
      timestamp: new Date(),
      tags: this.extractTags(title),
      duration,
    };

    const reels = this.getReels();
    reels.unshift(reel);
    this.saveReels(reels);
    
    return reel;
  }

  getReels(): Reel[] {
    try {
      const stored = localStorage.getItem(this.REELS_KEY);
      return stored ? JSON.parse(stored).map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        likes: Array.isArray(r.likes) ? r.likes : [],
        comments: Array.isArray(r.comments) ? r.comments : [],
        tags: Array.isArray(r.tags) ? r.tags : []
      })) : this.getDefaultReels();
    } catch {
      return this.getDefaultReels();
    }
  }

  async likeReel(reelId: string, userId: string): Promise<void> {
    const reels = this.getReels();
    const reel = reels.find(r => r.id === reelId);
    
    if (reel) {
      const likeIndex = reel.likes.indexOf(userId);
      if (likeIndex > -1) {
        reel.likes.splice(likeIndex, 1);
      } else {
        reel.likes.push(userId);
      }
      this.saveReels(reels);
    }
  }

  async viewReel(reelId: string): Promise<void> {
    const reels = this.getReels();
    const reel = reels.find(r => r.id === reelId);
    
    if (reel) {
      reel.views++;
      this.saveReels(reels);
    }
  }

  // ============ NOTIFICATIONS ============
  
  async createNotification(userId: string, type: Notification['type'], fromUserId: string, fromUserName: string, fromUserAvatar: string, content: string, postId?: string): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      type,
      fromUserId,
      fromUserName,
      fromUserAvatar,
      content,
      postId,
      timestamp: new Date(),
      read: false,
    };

    const notifications = this.getNotifications(userId);
    notifications.unshift(notification);
    this.saveNotifications(userId, notifications);
    
    return notification;
  }

  getNotifications(userId: string): Notification[] {
    try {
      const stored = localStorage.getItem(`${this.NOTIFICATIONS_KEY}_${userId}`);
      return stored ? JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })) : [];
    } catch {
      return [];
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = this.getNotifications(userId);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      this.saveNotifications(userId, notifications);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = this.getNotifications(userId);
    notifications.forEach(n => n.read = true);
    this.saveNotifications(userId, notifications);
  }

  getUnreadNotificationCount(userId: string): number {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  // ============ RECRUITMENT CAMPAIGNS ============
  
  async createCampaign(campaign: Omit<RecruitmentCampaign, 'id' | 'applicants' | 'timestamp'>): Promise<RecruitmentCampaign> {
    const newCampaign: RecruitmentCampaign = {
      ...campaign,
      id: this.generateId(),
      applicants: [],
      timestamp: new Date(),
    };

    const campaigns = this.getCampaigns();
    campaigns.unshift(newCampaign);
    this.saveCampaigns(campaigns);
    
    return newCampaign;
  }

  getCampaigns(): RecruitmentCampaign[] {
    try {
      const stored = localStorage.getItem(this.CAMPAIGNS_KEY);
      return stored ? JSON.parse(stored).map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp),
        deadline: new Date(c.deadline)
      })) : this.getDefaultCampaigns();
    } catch {
      return this.getDefaultCampaigns();
    }
  }

  async applyToCampaign(campaignId: string, userId: string): Promise<void> {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign && !campaign.applicants.includes(userId)) {
      campaign.applicants.push(userId);
      this.saveCampaigns(campaigns);
    }
  }

  async hasApplied(campaignId: string, userId: string): Promise<boolean> {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.applicants.includes(userId) : false;
  }

  // ============ HELPER METHODS ============
  
  private async updateConversation(senderId: string, receiverId: string, message: Message): Promise<void> {
    const conversations = await this.getConversations(senderId);
    let conversation = conversations.find(c => 
      c.participants.includes(senderId) && c.participants.includes(receiverId)
    );
    
    if (!conversation) {
      conversation = {
        id: this.generateId(),
        participants: [senderId, receiverId],
        lastMessage: message,
        unreadCount: 1,
      };
      conversations.push(conversation);
    } else {
      conversation.lastMessage = message;
      conversation.unreadCount++;
    }
    
    this.saveConversations(conversations);
  }

  private extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  private generateId(): string {
    return 'social_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Storage methods
  private savePosts(posts: SocialPost[]): void {
    localStorage.setItem(this.POSTS_KEY, JSON.stringify(posts));
  }

  private saveStories(stories: Story[]): void {
    localStorage.setItem(this.STORIES_KEY, JSON.stringify(stories));
  }

  private saveMessages(messages: Message[]): void {
    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
  }

  private saveConversations(conversations: Conversation[]): void {
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
  }

  private getProfiles(): UserProfile[] {
    try {
      const stored = localStorage.getItem(this.PROFILES_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultProfiles();
    } catch {
      return this.getDefaultProfiles();
    }
  }

  private saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
  }

  private saveReels(reels: Reel[]): void {
    localStorage.setItem(this.REELS_KEY, JSON.stringify(reels));
  }

  private saveNotifications(userId: string, notifications: Notification[]): void {
    localStorage.setItem(`${this.NOTIFICATIONS_KEY}_${userId}`, JSON.stringify(notifications));
  }

  private saveCampaigns(campaigns: RecruitmentCampaign[]): void {
    localStorage.setItem(this.CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }

  // Default data
  private getDefaultPosts(): SocialPost[] {
    const posts = [
      { userId: 'user_demo_1', userName: 'Sarah Johnson', bg: '00f5ff', color: '000', content: 'Just smashed my 5K PR in the 10km! 🏃‍♀️ 11:18 seconds - feeling unstoppable! Months of hard training finally paid off. Next goal: sub-11! #PersonalRecord #RunnerLife', hours: 3, likes: 12, comments: 2 },
      { userId: 'user_demo_2', userName: 'Mike Chen', bg: 'ff6b35', color: 'fff', content: '💪 Recovery day wisdom: Your body builds strength during rest, not just during training. Today\'s agenda: yoga, massage, proper nutrition, and 8+ hours of sleep. Tomorrow we go again! #RecoveryDay #Mindfulness #Training', hours: 5, likes: 8, comments: 1 },
      { userId: 'user_demo_3', userName: 'Alex Rivera', bg: '4ecdc4', color: '000', content: 'Pool session complete! 🏊‍♂️ 5km swim in 1:24:30. Working on my butterfly technique - it\'s coming together nicely. Olympic trials here I come! #Swimming #Olympics #Training', hours: 7, likes: 15, comments: 3 },
      { userId: 'user_demo_4', userName: 'Priya Sharma', bg: 'ffe66d', color: '000', content: 'Morning yoga flow complete 🧘‍♀️ Starting the day with sun salutations and meditation sets the perfect tone. Remember: flexibility is not just physical, it\'s mental too! #Yoga #Mindfulness #MorningRoutine', hours: 9, likes: 24, comments: 5 },
      { userId: 'user_demo_5', userName: 'Rahul Kumar', bg: 'f72585', color: 'fff', content: 'Net practice today! 🏏 Worked on my cover drives and pull shots. Coach says I\'m ready for the upcoming tournament. Let\'s bring it home! #Cricket #Training #MumbaiIndians', hours: 11, likes: 19, comments: 4 },
      { userId: 'user_demo_6', userName: 'Emma Watson', bg: '7209b7', color: 'fff', content: 'Game day! 🏀 We won 78-65! Had my best game with 23 points and 8 assists. Team chemistry is on point this season. #Basketball #GameDay #Victory', hours: 13, likes: 31, comments: 7 },
      { userId: 'user_demo_7', userName: 'David Lee', bg: '3a0ca3', color: 'fff', content: 'Coaching session with the U-19 squad ⚽ These kids have incredible potential! Proud to see them implementing the tactics we\'ve been working on. Future stars in the making! #Football #Coaching #YouthDevelopment', hours: 15, likes: 17, comments: 3 },
      { userId: 'user_demo_8', userName: 'Ananya Patel', bg: 'f72585', color: 'fff', content: 'Tournament prep mode activated! 🏸 Practicing my smashes and drop shots. National championship next month - time to show what I\'ve got! #Badminton #NationalChampionship #Training', hours: 17, likes: 22, comments: 6 },
      { userId: 'user_demo_9', userName: 'James Wilson', bg: '4361ee', color: 'fff', content: 'Teaching the next generation 🎾 Nothing beats seeing a student nail that perfect serve after weeks of practice. This is why I coach! #Tennis #Coaching #Passion', hours: 19, likes: 14, comments: 2 },
      { userId: 'user_demo_10', userName: 'Sneha Reddy', bg: 'f72585', color: 'fff', content: 'Floor routine practice! 🤸‍♀️ Nailed my triple twist today! Commonwealth Games preparation is intense but I\'m loving every moment. #Gymnastics #CommonwealthGames #Training', hours: 21, likes: 28, comments: 8 },
      { userId: 'user_demo_11', userName: 'Carlos Rodriguez', bg: 'ff006e', color: 'fff', content: 'Sparring session complete 🥊 8 rounds of intense work. My footwork is getting sharper every day. Title fight in 6 weeks - I\'m ready! #Boxing #Welterweight #Champion', hours: 23, likes: 20, comments: 4 },
      { userId: 'user_demo_12', userName: 'Aisha Khan', bg: '8338ec', color: 'fff', content: 'Long run Sunday! 🏃‍♀️ 32km in the books. Boston Marathon training is no joke but I\'m hitting all my targets. The grind continues! #Marathon #BostonMarathon #Running', hours: 25, likes: 26, comments: 5 },
      { userId: 'user_demo_13', userName: 'Tom Anderson', bg: '3a86ff', color: 'fff', content: 'Century ride done! 🚴 100km with 1200m elevation gain. Legs are burning but the views were worth it. Tour de France dreams alive! #Cycling #CenturyRide #Endurance', hours: 27, likes: 18, comments: 3 },
      { userId: 'user_demo_14', userName: 'Meera Singh', bg: 'fb5607', color: 'fff', content: 'Team practice! 🏑 Working on our penalty corners and defensive formations. World Cup qualifiers coming up - we\'re ready to represent India! #Hockey #IndianTeam #WorldCup', hours: 29, likes: 33, comments: 9 },
      { userId: 'user_demo_15', userName: 'Lucas Brown', bg: '06ffa5', color: '000', content: 'Beach volleyball tournament! 🏐 We made it to the finals! The sand, the sun, the competition - this is what I live for. Championship match tomorrow! #BeachVolleyball #Tournament #Finals', hours: 31, likes: 25, comments: 6 },
    ];

    return posts.map((p, i) => ({
      id: `post_${i + 1}`,
      userId: p.userId,
      userName: p.userName,
      userAvatar: `https://ui-avatars.com/api/?name=${p.userName.replace(' ', '+')}&background=${p.bg}&color=${p.color}`,
      content: p.content,
      likes: Array.from({ length: p.likes }, (_, j) => `user_demo_${(j % 15) + 1}`).filter(id => id !== p.userId),
      comments: Array.from({ length: p.comments }, (_, j) => ({
        id: `comment_${i}_${j}`,
        userId: `user_demo_${((i + j + 1) % 15) + 1}`,
        userName: posts[(i + j + 1) % 15].userName,
        userAvatar: `https://ui-avatars.com/api/?name=${posts[(i + j + 1) % 15].userName.replace(' ', '+')}&background=${posts[(i + j + 1) % 15].bg}&color=${posts[(i + j + 1) % 15].color}`,
        content: ['Great work! 💪', 'Inspiring! 🔥', 'Keep it up! 👏', 'Amazing progress!', 'You got this! 💯', 'Incredible! 🌟', 'Beast mode! 🦁', 'Respect! 🙌'][j % 8],
        timestamp: new Date(Date.now() - (p.hours - 1) * 60 * 60 * 1000),
        likes: [],
      })),
      timestamp: new Date(Date.now() - p.hours * 60 * 60 * 1000),
      tags: p.content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [],
    }));
  }

  private getDefaultStories(): Story[] {
    const users = [
      { id: 'user_demo_1', name: 'Sarah Johnson', bg: '00f5ff', color: '000' },
      { id: 'user_demo_2', name: 'Mike Chen', bg: 'ff6b35', color: 'fff' },
      { id: 'user_demo_3', name: 'Alex Rivera', bg: '4ecdc4', color: '000' },
      { id: 'user_demo_4', name: 'Priya Sharma', bg: 'ffe66d', color: '000' },
      { id: 'user_demo_5', name: 'Rahul Kumar', bg: 'f72585', color: 'fff' },
      { id: 'user_demo_6', name: 'Emma Watson', bg: '7209b7', color: 'fff' },
      { id: 'user_demo_7', name: 'David Lee', bg: '3a0ca3', color: 'fff' },
      { id: 'user_demo_8', name: 'Ananya Patel', bg: 'f72585', color: 'fff' },
      { id: 'user_demo_9', name: 'James Wilson', bg: '4361ee', color: 'fff' },
      { id: 'user_demo_10', name: 'Sneha Reddy', bg: 'f72585', color: 'fff' },
    ];

    const storyImages = [
      'photo-1571019613454-1cb2f99b2d8b', // Running
      'photo-1534438327276-14e5300c3a48', // Gym
      'photo-1544367567-0f2fcb009e0b', // Yoga
      'photo-1546519638-68e109498ffc', // Basketball
      'photo-1519315901367-f34ff9154487', // Swimming
      'photo-1579952363873-27f3bade9f55', // Football
      'photo-1540747913346-19e32dc3e97e', // Cricket
      'photo-1626224583764-f87db24ac4ea', // Badminton
      'photo-1554068865-24cecd4e34b8', // Tennis
      'photo-1549719386-74dfcbf7dbed', // Boxing
    ];

    return users.map((user, i) => ({
      id: `story_${i + 1}`,
      userId: user.id,
      userName: user.name,
      userAvatar: `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=${user.bg}&color=${user.color}`,
      mediaUrl: `https://images.unsplash.com/${storyImages[i]}?w=400&h=700&fit=crop`,
      mediaType: 'image' as const,
      timestamp: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + (24 - i) * 60 * 60 * 1000),
      views: [],
    }));
  }

  private getDefaultProfiles(): UserProfile[] {
    const profiles = [
      { id: 'user_demo_1', userName: 'sarah_johnson', displayName: 'Sarah Johnson', bg: '00f5ff', color: '000', bio: 'Runner | Fitness Enthusiast | 5K PR: 18:45 🏃‍♀️', posts: 45, verified: true },
      { id: 'user_demo_2', userName: 'mike_chen', displayName: 'Mike Chen', bg: 'ff6b35', color: 'fff', bio: 'CrossFit Athlete | Nutrition Coach 💪', posts: 32, verified: false },
      { id: 'user_demo_3', userName: 'alex_rivera', displayName: 'Alex Rivera', bg: '4ecdc4', color: '000', bio: 'Swimmer | Olympic Aspirant | 🏊‍♂️ Training Hard', posts: 28, verified: true },
      { id: 'user_demo_4', userName: 'priya_sharma', displayName: 'Priya Sharma', bg: 'ffe66d', color: '000', bio: 'Yoga Instructor | Mindfulness Coach 🧘‍♀️', posts: 67, verified: true },
      { id: 'user_demo_5', userName: 'rahul_kumar', displayName: 'Rahul Kumar', bg: 'f72585', color: 'fff', bio: 'Cricket Player | Mumbai Indians Academy 🏏', posts: 54, verified: false },
      { id: 'user_demo_6', userName: 'emma_watson', displayName: 'Emma Watson', bg: '7209b7', color: 'fff', bio: 'Basketball Pro | WNBA Prospect 🏀', posts: 41, verified: true },
      { id: 'user_demo_7', userName: 'david_lee', displayName: 'David Lee', bg: '3a0ca3', color: 'fff', bio: 'Football Coach | UEFA Licensed ⚽', posts: 89, verified: true },
      { id: 'user_demo_8', userName: 'ananya_patel', displayName: 'Ananya Patel', bg: 'f72585', color: 'fff', bio: 'Badminton Champion | National Player 🏸', posts: 36, verified: false },
      { id: 'user_demo_9', userName: 'james_wilson', displayName: 'James Wilson', bg: '4361ee', color: 'fff', bio: 'Tennis Coach | Former ATP Player 🎾', posts: 72, verified: true },
      { id: 'user_demo_10', userName: 'sneha_reddy', displayName: 'Sneha Reddy', bg: 'f72585', color: 'fff', bio: 'Gymnast | Commonwealth Games Medalist 🤸‍♀️', posts: 58, verified: true },
      { id: 'user_demo_11', userName: 'carlos_rodriguez', displayName: 'Carlos Rodriguez', bg: 'ff006e', color: 'fff', bio: 'Boxing Champion | Welterweight 🥊', posts: 43, verified: false },
      { id: 'user_demo_12', userName: 'aisha_khan', displayName: 'Aisha Khan', bg: '8338ec', color: 'fff', bio: 'Marathon Runner | Boston Qualifier 🏃‍♀️', posts: 91, verified: true },
      { id: 'user_demo_13', userName: 'tom_anderson', displayName: 'Tom Anderson', bg: '3a86ff', color: 'fff', bio: 'Cyclist | Tour de France Enthusiast 🚴', posts: 64, verified: false },
      { id: 'user_demo_14', userName: 'meera_singh', displayName: 'Meera Singh', bg: 'fb5607', color: 'fff', bio: 'Hockey Player | Indian National Team 🏑', posts: 47, verified: true },
      { id: 'user_demo_15', userName: 'lucas_brown', displayName: 'Lucas Brown', bg: '06ffa5', color: '000', bio: 'Volleyball Pro | Beach Volleyball 🏐', posts: 39, verified: false },
    ];

    return profiles.map((p, i) => ({
      userId: p.id,
      userName: p.userName,
      displayName: p.displayName,
      avatar: `https://ui-avatars.com/api/?name=${p.displayName.replace(' ', '+')}&background=${p.bg}&color=${p.color}`,
      bio: p.bio,
      followers: profiles.slice(0, Math.floor(Math.random() * 8) + 2).map(u => u.id).filter(id => id !== p.id),
      following: profiles.slice(0, Math.floor(Math.random() * 10) + 3).map(u => u.id).filter(id => id !== p.id),
      postsCount: p.posts,
      verified: p.verified,
    }));
  }

  private getDefaultReels(): Reel[] {
    const reelsData = [
      { title: '5K Training Tips 🏃‍♀️', tags: ['running', 'fitness'], views: 12340, duration: 45, thumb: 'photo-1571019613454-1cb2f99b2d8b' },
      { title: 'Perfect Form Deadlift 💪', tags: ['strength', 'training'], views: 25670, duration: 30, thumb: 'photo-1534438327276-14e5300c3a48' },
      { title: 'Morning Yoga Flow 🧘', tags: ['yoga', 'flexibility'], views: 34210, duration: 60, thumb: 'photo-1544367567-0f2fcb009e0b' },
      { title: 'Basketball Dribbling Drills 🏀', tags: ['basketball', 'skills'], views: 18900, duration: 40, thumb: 'photo-1546519638-68e109498ffc' },
      { title: 'Swimming Technique Masterclass 🏊', tags: ['swimming', 'technique'], views: 21500, duration: 55, thumb: 'photo-1519315901367-f34ff9154487' },
      { title: 'Football Agility Training ⚽', tags: ['football', 'agility'], views: 29800, duration: 35, thumb: 'photo-1579952363873-27f3bade9f55' },
      { title: 'Cricket Batting Tips 🏏', tags: ['cricket', 'batting'], views: 31200, duration: 50, thumb: 'photo-1540747913346-19e32dc3e97e' },
      { title: 'Badminton Smash Tutorial 🏸', tags: ['badminton', 'smash'], views: 16700, duration: 38, thumb: 'photo-1626224583764-f87db24ac4ea' },
      { title: 'Tennis Serve Perfection 🎾', tags: ['tennis', 'serve'], views: 22400, duration: 42, thumb: 'photo-1554068865-24cecd4e34b8' },
      { title: 'Boxing Workout Routine 🥊', tags: ['boxing', 'workout'], views: 27600, duration: 48, thumb: 'photo-1549719386-74dfcbf7dbed' },
      { title: 'Cycling Endurance Training 🚴', tags: ['cycling', 'endurance'], views: 19300, duration: 52, thumb: 'photo-1541625602330-2277a4c46182' },
      { title: 'Volleyball Spike Technique 🏐', tags: ['volleyball', 'spike'], views: 15800, duration: 36, thumb: 'photo-1612872087720-bb876e2e67d1' },
      { title: 'Hockey Stick Handling 🏑', tags: ['hockey', 'skills'], views: 14200, duration: 44, thumb: 'photo-1515703407324-5f753afd8be8' },
      { title: 'Kabaddi Raiding Tactics 🤼', tags: ['kabaddi', 'tactics'], views: 28900, duration: 46, thumb: 'photo-1530549387789-4c1017266635' },
      { title: 'Athletics Sprint Start 🏃', tags: ['athletics', 'sprint'], views: 24100, duration: 33, thumb: 'photo-1552674605-db6ffd4facb5' },
      { title: 'Gymnastics Floor Routine 🤸', tags: ['gymnastics', 'routine'], views: 32500, duration: 58, thumb: 'photo-1518611012118-696072aa579a' },
      { title: 'Martial Arts Kata 🥋', tags: ['martial-arts', 'kata'], views: 20700, duration: 54, thumb: 'photo-1555597673-b21d5c935865' },
      { title: 'Weightlifting Clean & Jerk 🏋️', tags: ['weightlifting', 'technique'], views: 26300, duration: 41, thumb: 'photo-1517836357463-d25dfeac3438' },
      { title: 'Table Tennis Spin Serve 🏓', tags: ['tabletennis', 'serve'], views: 17900, duration: 37, thumb: 'photo-1534158914592-062992fbe900' },
      { title: 'Rock Climbing Techniques 🧗', tags: ['climbing', 'technique'], views: 23800, duration: 49, thumb: 'photo-1522163182402-834f871fd851' },
    ];

    return reelsData.map((reel, i) => ({
      id: `reel_${i + 1}`,
      userId: `user_demo_${(i % 5) + 1}`,
      userName: ['Sarah Johnson', 'Mike Chen', 'Alex Rivera', 'Priya Sharma', 'Rahul Kumar'][i % 5],
      userAvatar: `https://ui-avatars.com/api/?name=${['Sarah+Johnson', 'Mike+Chen', 'Alex+Rivera', 'Priya+Sharma', 'Rahul+Kumar'][i % 5]}&background=${['00f5ff', 'ff6b35', '4ecdc4', 'ffe66d', 'f72585'][i % 5]}&color=${['000', 'fff', '000', '000', 'fff'][i % 5]}`,
      title: reel.title + ' #' + reel.tags.join(' #'),
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: `https://images.unsplash.com/${reel.thumb}?w=400`,
      likes: [],
      comments: [],
      views: reel.views,
      timestamp: new Date(Date.now() - (i + 1) * 2 * 60 * 60 * 1000),
      tags: reel.tags,
      duration: reel.duration,
    }));
  }

  private getDefaultCampaigns(): RecruitmentCampaign[] {
    const states = [
      { name: 'Andhra Pradesh', city: 'Visakhapatnam' },
      { name: 'Arunachal Pradesh', city: 'Itanagar' },
      { name: 'Assam', city: 'Guwahati' },
      { name: 'Bihar', city: 'Patna' },
      { name: 'Chhattisgarh', city: 'Raipur' },
      { name: 'Goa', city: 'Panaji' },
      { name: 'Gujarat', city: 'Ahmedabad' },
      { name: 'Haryana', city: 'Panchkula' },
      { name: 'Himachal Pradesh', city: 'Shimla' },
      { name: 'Jharkhand', city: 'Ranchi' },
      { name: 'Karnataka', city: 'Bengaluru' },
      { name: 'Kerala', city: 'Thiruvananthapuram' },
      { name: 'Madhya Pradesh', city: 'Bhopal' },
      { name: 'Maharashtra', city: 'Mumbai' },
      { name: 'Manipur', city: 'Imphal' },
      { name: 'Meghalaya', city: 'Shillong' },
      { name: 'Mizoram', city: 'Aizawl' },
      { name: 'Nagaland', city: 'Kohima' },
      { name: 'Odisha', city: 'Bhubaneswar' },
      { name: 'Punjab', city: 'Chandigarh' },
      { name: 'Rajasthan', city: 'Jaipur' },
      { name: 'Sikkim', city: 'Gangtok' },
      { name: 'Tamil Nadu', city: 'Chennai' },
      { name: 'Telangana', city: 'Hyderabad' },
      { name: 'Tripura', city: 'Agartala' },
      { name: 'Uttar Pradesh', city: 'Lucknow' },
      { name: 'Uttarakhand', city: 'Dehradun' },
      { name: 'West Bengal', city: 'Kolkata' },
      { name: 'Delhi', city: 'New Delhi' },
    ];

    const campaigns: RecruitmentCampaign[] = [
      {
        id: 'campaign_national',
        title: 'National Team Hunt 2024 - All India',
        description: 'Sports Authority of India is conducting recruitment campaign across 29 states. Regional trials to showcase your talent and training programs!',
        organization: 'Sports Authority of India (SAI)',
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        requirements: [
          'Age: 16-25 years',
          'Valid ID proof',
          'Medical fitness certificate',
          'Previous sports achievements'
        ],
        benefits: [
          'Professional coaching',
          'State-of-the-art facilities',
          'Monthly stipend ₹25,000',
          'National/International exposure'
        ],
        contactEmail: 'recruitment@sai.gov.in',
        applicants: [],
        status: 'active',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    // Add state-specific campaigns
    states.forEach((state, i) => {
      campaigns.push({
        id: `campaign_${state.name.toLowerCase().replace(/\s+/g, '_')}`,
        title: `${state.name} State Sports Recruitment 2024`,
        description: `Talent hunt program in ${state.name}. Trials will be conducted in ${state.city}. Join us to represent ${state.name} at national level competitions!`,
        organization: `${state.name} Sports Authority`,
        imageUrl: `https://images.unsplash.com/photo-${1461896836934 + i * 1000000}?w=600`,
        deadline: new Date(Date.now() + (30 + i * 2) * 24 * 60 * 60 * 1000),
        requirements: [
          `Resident of ${state.name}`,
          'Age: 14-23 years',
          'Valid ID proof',
          'School/College certificate',
          'Basic fitness level'
        ],
        benefits: [
          'State-level coaching',
          'Competition opportunities',
          'Monthly allowance ₹15,000',
          'Sports equipment provided',
          'Accommodation support'
        ],
        contactEmail: `sports@${state.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
        applicants: [],
        status: 'active',
        timestamp: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      });
    });

    // Add Khelo India
    campaigns.push({
      id: 'campaign_khelo_india',
      title: 'Khelo India Youth Games 2024',
      description: 'Talent identification program across India. Showcase your talent and get selected for training programs!',
      organization: 'Khelo India',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      requirements: [
        'Age: 12-18 years',
        'School enrollment certificate',
        'Parental consent',
        'Basic fitness level'
      ],
      benefits: [
        'Free training',
        'Competition opportunities',
        'Scholarship programs',
        'Career guidance'
      ],
      contactEmail: 'info@kheloindia.gov.in',
      applicants: [],
      status: 'active',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    });

    return campaigns;
  }
}

const socialService = new SocialService();
export default socialService;
