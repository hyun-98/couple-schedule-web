const coupleService = require('../services/couple.service');

async function me(req, res) {
  const { couple } = await coupleService.getCoupleForUser(req.userId);
  res.json({ couple });
}

async function createInvite(req, res) {
  const result = await coupleService.createInvite(req.userId);
  res.status(201).json(result);
}

async function join(req, res) {
  const couple = await coupleService.joinWithCode(req.userId, req.body.inviteCode);
  res.json({ couple });
}

module.exports = {
  me,
  createInvite,
  join,
};
