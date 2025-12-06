import express from 'express';
import {
  getUsers,
  getUser,
  getMyProfile,
  updateUser,
  deleteUser,
  uploadProfilePhoto,
  followUser,
  unfollowUser,
  getUserFeed,
  searchUsers,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User feed and search
router.get('/feed', getUserFeed);
router.get('/search', searchUsers);

// Profile routes
router.get('/me', getMyProfile);
router.put('/upload-photo', upload.single('file'), uploadProfilePhoto);

// Follow/Unfollow routes
router.put('/follow/:id', followUser);
router.put('/unfollow/:id', unfollowUser);

// User CRUD routes
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

export default router;
