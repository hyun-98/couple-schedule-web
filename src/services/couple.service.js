const Couple = require('../models/Couple');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateInviteCode } = require('../utils/inviteCode');

async function getCoupleForUser(userId) {
  const user = await User.findById(userId).populate({
    path: 'couple',
    populate: [
      { path: 'user1', select: 'email name' },
      { path: 'user2', select: 'email name' },
    ],
  });
  if (!user || !user.couple) {
    return { user, couple: null };
  }
  return { user, couple: user.couple };
}

async function createInvite(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.couple) {
    const existing = await Couple.findById(user.couple);
    if (!existing) {
      user.couple = null;
      await user.save();
    } else if (existing.status === 'active') {
      throw new AppError('Already matched with a partner', 400);
    } else if (existing.status === 'pending' && existing.user1.equals(user._id)) {
      return {
        inviteCode: existing.inviteCode,
        status: existing.status,
        message: 'Existing invite is still valid',
      };
    } else {
      throw new AppError('Invalid couple state for this user', 400);
    }
  }

  const inviteCode = generateInviteCode(8);
  const couple = await Couple.create({
    user1: user._id,
    user2: null,
    inviteCode,
    status: 'pending',
  });

  user.couple = couple._id;
  await user.save();

  return {
    inviteCode: couple.inviteCode,
    status: couple.status,
    coupleId: couple.id,
  };
}

async function joinWithCode(userId, inviteCode) {
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new AppError('inviteCode is required', 400);
  }

  const code = inviteCode.trim().toUpperCase();
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const couple = await Couple.findOne({ inviteCode: code, status: 'pending' });
  if (!couple) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  if (couple.user1.equals(user._id)) {
    throw new AppError('You cannot join your own invite', 400);
  }

  if (user.couple && !user.couple.equals(couple._id)) {
    throw new AppError(
      'Already linked to another couple. Resolve that relationship before joining a new one.',
      400
    );
  }

  couple.user2 = user._id;
  couple.status = 'active';
  couple.inviteCode = undefined;
  await couple.save();

  user.couple = couple._id;
  await user.save();

  await couple.populate([
    { path: 'user1', select: 'email name' },
    { path: 'user2', select: 'email name' },
  ]);
  return couple;
}

module.exports = {
  getCoupleForUser,
  createInvite,
  joinWithCode,
};
