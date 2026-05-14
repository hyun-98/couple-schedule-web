const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    couple: user.couple || null,
  };
}

async function register({ email, password, name }) {
  if (!email || !password || !name) {
    throw new AppError('email, password, and name are required', 400);
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hash, name });
  const token = signToken(user._id.toString());
  return { token, user: toPublicUser(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString());
  user.password = undefined;
  return { token, user: toPublicUser(user) };
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toPublicUser(user);
}

module.exports = {
  register,
  login,
  getProfile,
  signToken,
};
