const express = require('express');
const router = express.Router();
const SocialPost = require('../models/SocialPost');

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const posts = await SocialPost.findAll(limit);
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get posts by user ID
router.get('/posts/user/:userId', async (req, res) => {
  try {
    const posts = await SocialPost.findByUserId(req.params.userId);
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new post
router.post('/posts', async (req, res) => {
  try {
    const post = await SocialPost.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update post
router.put('/posts/:id', async (req, res) => {
  try {
    const updated = await SocialPost.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const post = await SocialPost.findById(req.params.id);
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    await SocialPost.addLike(req.params.id, userId);
    const post = await SocialPost.findById(req.params.id);
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unlike post
router.delete('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    await SocialPost.removeLike(req.params.id, userId);
    const post = await SocialPost.findById(req.params.id);
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add comment
router.post('/posts/:id/comments', async (req, res) => {
  try {
    await SocialPost.addComment(req.params.id, req.body);
    const post = await SocialPost.findById(req.params.id);
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    const deleted = await SocialPost.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
