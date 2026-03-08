const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const AppError = require('./AppError');

// ─── Cloudinary Configuration ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Cloudinary Storage Configuration ────────────────────────────────────────────
// Dynamically organize uploads into folders based on media type
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determine folder based on type from request body
    // Default to 'ClinicSaaS/Media' if type is not provided or invalid
    const type = req.body?.type;
    let folder = 'ClinicSaaS/Media'; // Default folder

    if (type === 'photo') {
      folder = 'ClinicSaaS/Patients/Photos';
    } else if (type === 'xray') {
      folder = 'ClinicSaaS/Patients/XRays';
    }

    // Generate unique filename: doctorId-timestamp
    const uniqueSuffix = `${req.user?.id || 'unknown'}-${Date.now()}`;

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: uniqueSuffix,
      resource_type: 'image',
    };
  },
});

// ─── File Filter ───────────────────────────────────────────────────────────────
// Accept only images (photos and x-rays are typically image formats)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg', // Some systems use 'image/jpg' instead of 'image/jpeg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        400
      ),
      false
    );
  }
};

// ─── Multer Instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
});

module.exports = upload;
