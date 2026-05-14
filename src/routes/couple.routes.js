const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const coupleController = require('../controllers/couple.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', asyncHandler(coupleController.me));
router.post('/invite', asyncHandler(coupleController.createInvite));
router.post('/join', asyncHandler(coupleController.join));

module.exports = router;
