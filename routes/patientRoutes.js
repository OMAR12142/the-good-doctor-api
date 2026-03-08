const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const validate = require('../middleware/validate');
const {
  createPatientSchema,
  updatePatientSchema,
} = require('../validators/patientValidator');
const { protect } = require('../middleware/auth');

// All patient routes require authentication
router.use(protect);

router
  .route('/')
  .get(patientController.getAllPatients)
  .post(validate(createPatientSchema), patientController.createPatient);

router
  .route('/:id')
  .get(patientController.getPatientById)
  .patch(validate(updatePatientSchema), patientController.updatePatient)
  .delete(patientController.deletePatient);

module.exports = router;
