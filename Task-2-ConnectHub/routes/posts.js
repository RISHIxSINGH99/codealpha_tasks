const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

function formatPost(post, currentUserId) {
  const comments = (post.comments || []).map((c) => ({
    id: c.id,
    userId: c.userId,
    username: c.username,
    content: c.content,
    createdAt: c.createdAt,
  }));

  return {
    id: post.id,
    content: post.content,
    username: post.username,
    userId: post.userId,
    likeCount: (post.likes || []).length,
    likedByMe: (post.likes || []).includes(currentUserId),
    commentCount: comments.length,
    comments,
    createdAt: post.createdAt,
  };
}

router.get('/', requireLogin, (req, res) => {
  try {
    const posts = readData('posts.json');
    const sorted = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const formatted = sorted.map((post) => formatPost(post, req.session.userId));
    res.json({ posts: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Could not load posts.' });
  }
});

router.post('/', requireLogin, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const posts = readData('posts.json');
    const newPost = {
      id: uuidv4(),
      userId: req.session.userId,
      username: req.session.username,
      content: content.trim(),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    posts.push(newPost);
    writeData('posts.json', posts);

    res.status(201).json({
      message: 'Post created!',
      post: formatPost(newPost, req.session.userId),
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not create post.' });
  }
});

router.post('/:id/like', requireLogin, (req, res) => {
  try {
    const posts = readData('posts.json');
    const post = posts.find((p) => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.likes) post.likes = [];
    const userId = req.session.userId;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);
    }

    writeData('posts.json', posts);

    res.json({
      message: alreadyLiked ? 'Like removed.' : 'Post liked!',
      likeCount: post.likes.length,
      likedByMe: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not update like.' });
  }
});

router.get('/:id/comments', requireLogin, (req, res) => {
  try {
    const posts = readData('posts.json');
    const post = posts.find((p) => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comments = (post.comments || []).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Could not load comments.' });
  }
});

router.post('/:id/comments', requireLogin, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const posts = readData('posts.json');
    const post = posts.find((p) => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.comments) post.comments = [];

    const newComment = {
      id: uuidv4(),
      userId: req.session.userId,
      username: req.session.username,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    writeData('posts.json', posts);

    res.status(201).json({
      message: 'Comment added!',
      comment: newComment,
      commentCount: post.comments.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not add comment.' });
  }
});

module.exports = router;
