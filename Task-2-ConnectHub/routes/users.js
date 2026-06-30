const express = require('express');
const { readData, writeData } = require('../utils/dataStore');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

function findUser(users, identifier) {
  return users.find(
    (u) => u.id === identifier || u.username.toLowerCase() === identifier.toLowerCase()
  );
}

function getProfileStats(userId, users, posts) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const followers = user.followers || [];
  const following = user.following || [];
  const totalPosts = posts.filter((p) => p.userId === userId).length;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio || '',
    totalPosts,
    followersCount: followers.length,
    followingCount: following.length,
    createdAt: user.createdAt,
  };
}

router.get('/:identifier', requireLogin, (req, res) => {
  try {
    const users = readData('users.json');
    const posts = readData('posts.json');
    const user = findUser(users, req.params.identifier);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const profile = getProfileStats(user.id, users, posts);
    const isOwnProfile = req.session.userId === user.id;
    const isFollowing = (user.followers || []).includes(req.session.userId);

    res.json({
      profile: {
        ...profile,
        isOwnProfile,
        isFollowing,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

router.get('/:identifier/posts', requireLogin, (req, res) => {
  try {
    const users = readData('users.json');
    const posts = readData('posts.json');
    const user = findUser(users, req.params.identifier);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userPosts = posts
      .filter((p) => p.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((post) => ({
        id: post.id,
        content: post.content,
        username: post.username,
        userId: post.userId,
        likeCount: (post.likes || []).length,
        likedByMe: (post.likes || []).includes(req.session.userId),
        commentCount: (post.comments || []).length,
        createdAt: post.createdAt,
      }));

    res.json({ posts: userPosts });
  } catch (error) {
    res.status(500).json({ error: 'Could not load user posts.' });
  }
});

router.put('/bio', requireLogin, (req, res) => {
  try {
    const { bio } = req.body;
    const users = readData('users.json');
    const user = users.find((u) => u.id === req.session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.bio = (bio || '').trim().slice(0, 160);
    writeData('users.json', users);

    res.json({ message: 'Bio updated!', bio: user.bio });
  } catch (error) {
    res.status(500).json({ error: 'Could not update bio.' });
  }
});

router.post('/:id/follow', requireLogin, (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.session.userId;

    if (targetId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const users = readData('users.json');
    const currentUser = users.find((u) => u.id === currentUserId);
    const targetUser = users.find((u) => u.id === targetId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    if (currentUser.following.includes(targetId)) {
      return res.status(400).json({ error: 'Already following this user.' });
    }

    currentUser.following.push(targetId);
    targetUser.followers.push(currentUserId);
    writeData('users.json', users);

    res.json({
      message: 'User followed!',
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      isFollowing: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not follow user.' });
  }
});

router.post('/:id/unfollow', requireLogin, (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.session.userId;

    const users = readData('users.json');
    const currentUser = users.find((u) => u.id === currentUserId);
    const targetUser = users.find((u) => u.id === targetId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    if (!currentUser.following.includes(targetId)) {
      return res.status(400).json({ error: 'You are not following this user.' });
    }

    currentUser.following = currentUser.following.filter((id) => id !== targetId);
    targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
    writeData('users.json', users);

    res.json({
      message: 'User unfollowed.',
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      isFollowing: false,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not unfollow user.' });
  }
});

module.exports = router;
