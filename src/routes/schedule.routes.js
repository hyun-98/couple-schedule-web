const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const scheduleController = require('../controllers/schedule.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(scheduleController.list));
router.get('/:id', asyncHandler(scheduleController.getOne));
router.post('/', asyncHandler(scheduleController.create));
router.patch('/:id', asyncHandler(scheduleController.update));
router.delete('/:id', asyncHandler(scheduleController.remove));

module.exports = router;
