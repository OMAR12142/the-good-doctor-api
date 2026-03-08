const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  updateMeSchema,
} = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, validate(updateMeSchema), authController.updateMe);

module.exports = router;
