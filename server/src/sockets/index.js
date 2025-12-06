import logger from '../utils/logger.js';
import { handleConnection } from './connection.handler.js';

// WebSocket event types
export const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  NOTIFICATION: 'notification',
  MESSAGE: 'message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  MESSAGE_READ: 'message_read',
  NEW_POST: 'new_post',
  LIKE_POST: 'like_post',
  COMMENT_POST: 'comment_post',
  FOLLOW_USER: 'follow_user',
  ERROR: 'error',
};

// Active connections
const activeConnections = new Map();

/**
 * Setup WebSocket server
 * @param {Server} io - Socket.IO server instance
 */
const setupWebSocket = (io) => {
  io.on(WS_EVENTS.CONNECTION, (socket) => {
    handleConnection(socket, io, activeConnections);
  });

  // Handle server shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing WebSocket server...');
    io.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });

  logger.info('WebSocket server initialized');
};

export default setupWebSocket;
