const Schedule = require('../models/Schedule');
const Couple = require('../models/Couple');
const User = require('../models/User');
const AppError = require('../utils/AppError');

async function assertActiveCoupleMember(userId) {
  const user = await User.findById(userId);
  if (!user || !user.couple) {
    throw new AppError('You must be in an active couple to manage schedules', 403);
  }

  const couple = await Couple.findById(user.couple);
  if (!couple || couple.status !== 'active') {
    throw new AppError('Couple must be active (partner must accept invite)', 403);
  }

  const isMember =
    couple.user1.equals(user._id) || (couple.user2 && couple.user2.equals(user._id));
  if (!isMember) {
    throw new AppError('Not a member of this couple', 403);
  }

  return { user, couple };
}

function assertDateOrder(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('startAt and endAt must be valid dates', 400);
  }
  if (end < start) {
    throw new AppError('endAt must be after startAt', 400);
  }
}

async function listSchedules(userId) {
  const { couple } = await assertActiveCoupleMember(userId);
  return Schedule.find({ couple: couple._id }).sort({ startAt: 1 }).lean();
}

async function getSchedule(userId, scheduleId) {
  const { couple } = await assertActiveCoupleMember(userId);
  const schedule = await Schedule.findOne({ _id: scheduleId, couple: couple._id });
  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }
  return schedule;
}

async function createSchedule(userId, payload) {
  const { user, couple } = await assertActiveCoupleMember(userId);
  const { title, description, startAt, endAt } = payload;

  if (!title || !startAt || !endAt) {
    throw new AppError('title, startAt, and endAt are required', 400);
  }

  assertDateOrder(startAt, endAt);

  return Schedule.create({
    couple: couple._id,
    title,
    description: description ?? '',
    startAt,
    endAt,
    createdBy: user._id,
  });
}

async function updateSchedule(userId, scheduleId, payload) {
  const { couple } = await assertActiveCoupleMember(userId);
  const schedule = await Schedule.findOne({ _id: scheduleId, couple: couple._id });
  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  const { title, description, startAt, endAt } = payload;
  if (title !== undefined) schedule.title = title;
  if (description !== undefined) schedule.description = description;
  if (startAt !== undefined) schedule.startAt = startAt;
  if (endAt !== undefined) schedule.endAt = endAt;

  assertDateOrder(schedule.startAt, schedule.endAt);

  await schedule.save();
  return schedule;
}

async function deleteSchedule(userId, scheduleId) {
  const { couple } = await assertActiveCoupleMember(userId);
  const result = await Schedule.deleteOne({ _id: scheduleId, couple: couple._id });
  if (result.deletedCount === 0) {
    throw new AppError('Schedule not found', 404);
  }
  return { deleted: true };
}

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
