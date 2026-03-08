const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const validate = require('../middleware/validate');
const { uploadMediaSchema } = require('../validators/mediaValidator');
const { protect } = require('../middleware/auth');
const upload = require('../utils/multerConfig');

// All media routes require authentication
router.use(protect);

// Upload media — Multer processes the file first, then Joi validates text fields
router.post(
  '/',
  upload.single('file'),
  validate(uploadMediaSchema),
  mediaController.uploadMedia
);

// Get media for a specific patient (filterable via ?type=photo or ?type=xray)
router.get('/patient/:patientId', mediaController.getPatientMedia);

// Delete media
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
