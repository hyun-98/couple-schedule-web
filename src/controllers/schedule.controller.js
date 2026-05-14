const scheduleService = require('../services/schedule.service');

async function list(req, res) {
  const schedules = await scheduleService.listSchedules(req.userId);
  res.json({ schedules });
}

async function getOne(req, res) {
  const schedule = await scheduleService.getSchedule(req.userId, req.params.id);
  res.json({ schedule });
}

async function create(req, res) {
  const schedule = await scheduleService.createSchedule(req.userId, req.body);
  res.status(201).json({ schedule });
}

async function update(req, res) {
  const schedule = await scheduleService.updateSchedule(req.userId, req.params.id, req.body);
  res.json({ schedule });
}

async function remove(req, res) {
  const result = await scheduleService.deleteSchedule(req.userId, req.params.id);
  res.json(result);
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
