import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Handle new WebSocket connection
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 * @param {Map} activeConnections - Map of active connections
 */
export const handleConnection = async (socket, io, activeConnections) => {
  let userId = null;
  let user = null;

  try {
    // Authenticate user
    const token = socket.handshake.auth.token;
    
    if (!token) {
      throw new Error('Authentication error: No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;

    // Get user from database
    user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('Authentication error: User not found');
    }

    // Add user to active connections
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);

    // Join user to their own room for direct messaging
    socket.join(`user_${userId}`);

    // Log connection
    logger.info(`User connected: ${user.username} (${socket.id})`);

    // Handle disconnect
    socket.on('disconnect', () => {
      handleDisconnect(socket, userId, activeConnections);
    });

    // Handle typing events
    socket.on('typing', (data) => {
      handleTyping(socket, userId, data, io);
    });

    // Handle stop typing events
    socket.on('stop_typing', (data) => {
      handleStopTyping(socket, userId, data, io);
    });

    // Handle message read events
    socket.on('message_read', (data) => {
      handleMessageRead(socket, userId, data, io);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error (${socket.id}): ${error.message}`);
    });

    // Notify user that they are connected
    socket.emit('connected', {
      userId: user._id,
      username: user.username,
      message: 'Successfully connected to WebSocket server',
    });

  } catch (error) {
    logger.error(`WebSocket connection error (${socket.id}): ${error.message}`);
    socket.emit('error', {
      message: 'Authentication failed',
      error: error.message,
    });
    socket.disconnect(true);
  }
};

/**
 * Handle WebSocket disconnection
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} userId - User ID
 * @param {Map} activeConnections - Map of active connections
 */
const handleDisconnect = (socket, userId, activeConnections) => {
  if (userId && activeConnections.has(userId)) {
    const userSockets = activeConnections.get(userId);
    userSockets.delete(socket.id);

    if (userSockets.size === 0) {
      activeConnections.delete(userId);
    }
  }

  logger.info(`User disconnected: ${socket.id}`);
};

/**
 * Handle typing events
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} userId - User ID
 * @param {Object} data - Typing data
 * @param {Server} io - Socket.IO server instance
 */
const handleTyping = (socket, userId, data, io) => {
  const { conversationId } = data;
  if (!conversationId) return;

  // Emit to all users in the conversation except the sender
  socket.to(`conversation_${conversationId}`).emit('typing', {
    userId,
    conversationId,
  });
};

/**
 * Handle stop typing events
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} userId - User ID
 * @param {Object} data - Stop typing data
 * @param {Server} io - Socket.IO server instance
 */
const handleStopTyping = (socket, userId, data, io) => {
  const { conversationId } = data;
  if (!conversationId) return;

  // Emit to all users in the conversation except the sender
  socket.to(`conversation_${conversationId}`).emit('stop_typing', {
    userId,
    conversationId,
  });
};

/**
 * Handle message read events
 * @param {Socket} socket - Socket.IO socket instance
 * @param {string} userId - User ID
 * @param {Object} data - Message read data
 * @param {Server} io - Socket.IO server instance
 */
const handleMessageRead = (socket, userId, data, io) => {
  const { messageId, conversationId } = data;
  if (!messageId || !conversationId) return;

  // Emit to all users in the conversation
  io.to(`conversation_${conversationId}`).emit('message_read', {
    messageId,
    conversationId,
    userId,
    readAt: new Date(),
  });
};

/**
 * Send notification to a user
 * @param {string} userId - Recipient user ID
 * @param {Object} notification - Notification data
 * @param {Server} io - Socket.IO server instance
 * @param {Map} activeConnections - Map of active connections
 */
export const sendNotification = (userId, notification, io, activeConnections) => {
  if (!activeConnections.has(userId)) return;

  const userSockets = activeConnections.get(userId);
  userSockets.forEach((socketId) => {
    io.to(socketId).emit('notification', notification);
  });
};

/**
 * Send message to a user or conversation
 * @param {string} type - Message type ('direct' or 'conversation')
 * @param {string} targetId - Recipient user ID or conversation ID
 * @param {Object} message - Message data
 * @param {Server} io - Socket.IO server instance
 * @param {Map} activeConnections - Map of active connections
 */
export const sendMessage = (type, targetId, message, io, activeConnections) => {
  const room = type === 'direct' ? `user_${targetId}` : `conversation_${targetId}`;
  
  // Emit to the specific room
  io.to(room).emit('message', message);
  
  // If it's a direct message and the recipient is not online, you might want to store it
  if (type === 'direct' && !activeConnections.has(targetId)) {
    // Store the message for later delivery
    // This would be handled by your database and notification system
  }
};
