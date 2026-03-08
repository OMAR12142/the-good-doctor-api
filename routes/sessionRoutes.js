const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const validate = require('../middleware/validate');
const {
  createSessionSchema,
  updateSessionSchema,
} = require('../validators/sessionValidator');
const { protect } = require('../middleware/auth');

// All session routes require authentication
router.use(protect);

router.post('/', validate(createSessionSchema), sessionController.createSession);

// Get all sessions for a specific patient (treatment history)
router.get('/patient/:patientId', sessionController.getPatientSessions);

// Update a specific session
router.patch('/:id', validate(updateSessionSchema), sessionController.updateSession);

module.exports = router;
