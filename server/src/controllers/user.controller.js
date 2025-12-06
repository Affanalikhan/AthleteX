import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.middleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate({
      path: 'posts',
      select: 'images likes comments createdAt',
      options: { sort: { createdAt: -1 } },
    })
    .populate('followers', 'username fullName profilePicture')
    .populate('following', 'username fullName profilePicture');

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if the user is private and the requester is not following
  if (
    user.isPrivate &&
    !user.followers.some(
      (follower) => follower._id.toString() === req.user.id
    ) &&
    req.user.id !== user._id.toString()
  ) {
    return next(
      new ErrorResponse('This account is private', 403)
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Get user profile
// @route   GET /api/v1/users/me
// @access  Private
export const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: 'posts',
      select: 'images likes comments createdAt',
      options: { sort: { createdAt: -1 } },
    })
    .populate('savedPosts')
    .populate('followers', 'username fullName profilePicture')
    .populate('following', 'username fullName profilePicture');

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  // Make sure user is user or admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this user`,
        401
      )
    );
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
export const deleteUser = asyncHandler(async (req, res, next) => {
  // Make sure user is user or admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this user`,
        401
      )
    );
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Upload profile picture
// @route   PUT /api/v1/users/upload-photo
// @access  Private
export const uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  const maxSize = process.env.MAX_FILE_UPLOAD * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}MB`,
        400
      )
    );
  }

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.tempFilePath, 'profile-photos');

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePicture: result.secure_url,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error(`Error uploading profile photo: ${err.message}`);
    return next(new ErrorResponse('Error uploading file', 500));
  }
});

// @desc    Follow a user
// @route   PUT /api/v1/users/follow/:id
// @access  Private
export const followUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse('You cannot follow yourself', 400));
  }

  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!userToFollow) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check if already following
  if (
    currentUser.following.some(
      (follow) => follow._id.toString() === req.params.id
    )
  ) {
    return next(new ErrorResponse('Already following this user', 400));
  }

  // Add to following list
  currentUser.following.unshift(userToFollow._id);
  await currentUser.save();

  // Add to followers list
  userToFollow.followers.unshift(currentUser._id);
  await userToFollow.save();

  // TODO: Create notification for the user being followed

  res.status(200).json({
    success: true,
    message: `You are now following ${userToFollow.username}`,
  });
});

// @desc    Unfollow a user
// @route   PUT /api/v1/users/unfollow/:id
// @access  Private
export const unfollowUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse('You cannot unfollow yourself', 400));
  }

  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!userToUnfollow) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check if already not following
  if (
    !currentUser.following.some(
      (follow) => follow._id.toString() === req.params.id
    )
  ) {
    return next(new ErrorResponse('You are not following this user', 400));
  }

  // Remove from following list
  currentUser.following = currentUser.following.filter(
    (follow) => follow._id.toString() !== req.params.id
  );
  await currentUser.save();

  // Remove from followers list
  userToUnfollow.followers = userToUnfollow.followers.filter(
    (follower) => follower._id.toString() !== req.user.id
  );
  await userToUnfollow.save();

  res.status(200).json({
    success: true,
    message: `You have unfollowed ${userToUnfollow.username}`,
  });
});

// @desc    Get user's feed (posts from users they follow)
// @route   GET /api/v1/users/feed
// @access  Private
export const getUserFeed = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const following = user.following;

  // Add current user to see their own posts in the feed
  following.push(user._id);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments({ user: { $in: following } });

  // Query for posts
  const posts = await Post.find({ user: { $in: following } })
    .populate('user', 'username fullName profilePicture')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'username fullName profilePicture',
      },
      options: { sort: { createdAt: -1 }, limit: 2 },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: posts.length,
    pagination,
    data: posts,
  });
});

// @desc    Search users
// @route   GET /api/v1/users/search
// @access  Private
export const searchUsers = asyncHandler(async (req, res, next) => {
  if (!req.query.q) {
    return next(new ErrorResponse('Please provide a search term', 400));
  }

  const users = await User.find({
    $or: [
      { username: { $regex: req.query.q, $options: 'i' } },
      { fullName: { $regex: req.query.q, $options: 'i' } },
    ],
  }).select('username fullName profilePicture');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
