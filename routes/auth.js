const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const users = readData('users.json');
    const emailTaken = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    const usernameTaken = users.some((u) => u.username.toLowerCase() === username.toLowerCase());

    if (emailTaken) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    if (usernameTaken) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      bio: '',
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeData('users.json', users);

    req.session.userId = newUser.id;
    req.session.username = newUser.username;

    res.status(201).json({
      message: 'Account created successfully!',
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong during signup.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = readData('users.json');
    const user = users.find((u) => u.email === email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Logged in successfully!',
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong during login.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully!' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  const users = readData('users.json');
  const user = users.find((u) => u.id === req.session.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio || '',
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
    },
  });
});

module.exports = router;
