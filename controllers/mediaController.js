const Media = require('../models/Media');
const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('cloudinary').v2;

// ─── Upload Media ──────────────────────────────────────────────────────────────
exports.uploadMedia = catchAsync(async (req, res, next) => {
  const { patientId, type, description } = req.body;

  // Verify the patient belongs to this doctor
  const patient = await Patient.findOne({
    _id: patientId,
    doctorId: req.user.id,
  });

  if (!patient) {
    return next(
      new AppError('No patient found with that ID for your account.', 404)
    );
  }

  // Ensure a file was uploaded via Multer
  if (!req.file) {
    return next(new AppError('Please upload a file.', 400));
  }

  // With multer-storage-cloudinary, req.file.path contains the Cloudinary URL
  // req.file.public_id contains the Cloudinary public ID (includes folder path)
  // We extract the public_id from the URL when deleting (see deleteMedia function)
  const fileUrl = req.file.path; // This is the secure Cloudinary URL

  const media = await Media.create({
    doctorId: req.user.id, // Multi-tenancy: inject from auth middleware
    patientId,
    type,
    fileUrl,
    description,
  });

  res.status(201).json({
    status: 'success',
    data: { media },
  });
});

// ─── Get Patient Media (Filterable by Type) ────────────────────────────────────
exports.getPatientMedia = catchAsync(async (req, res, next) => {
  const { patientId } = req.params;

  // Verify the patient belongs to this doctor
  const patient = await Patient.findOne({
    _id: patientId,
    doctorId: req.user.id,
  });

  if (!patient) {
    return next(
      new AppError('No patient found with that ID for your account.', 404)
    );
  }

  // Build filter — always scoped to doctor
  const filter = {
    doctorId: req.user.id, // Multi-tenancy: strict scoping
    patientId,
  };

  // Optional: filter by type (photo or xray)
  if (req.query.type) {
    if (!['photo', 'xray'].includes(req.query.type)) {
      return next(
        new AppError('Invalid media type. Must be "photo" or "xray".', 400)
      );
    }
    filter.type = req.query.type;
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    Media.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Media.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: media.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: { media },
  });
});

// ─── Delete Media ──────────────────────────────────────────────────────────────
exports.deleteMedia = catchAsync(async (req, res, next) => {
  const media = await Media.findOne({
    _id: req.params.id,
    doctorId: req.user.id, // Multi-tenancy: strict scoping
  });

  if (!media) {
    return next(new AppError('No media found with that ID.', 404));
  }

  // Extract public_id from Cloudinary URL for deletion
  // Cloudinary URLs format: 
  //   https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
  //   or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
  // The public_id includes the full folder path (e.g., "ClinicSaaS/Patients/Photos/doctorId-timestamp")
  try {
    const fileUrl = media.fileUrl;
    
    // Extract public_id from URL path
    // Pattern matches: /upload/ followed by optional version (v1234567890/), then folder/public_id, then extension
    // The public_id includes the full folder path (e.g., "ClinicSaaS/Patients/Photos/doctorId-timestamp")
    const urlMatch = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    
    if (urlMatch && urlMatch[1]) {
      const publicId = urlMatch[1];
      
      // Delete from Cloudinary
      // The public_id includes the folder path, so we can use it directly
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } else {
      // Fallback: If URL parsing fails, log warning but continue with DB deletion
      console.warn(
        `Could not extract public_id from Cloudinary URL: ${fileUrl}. Proceeding with database deletion only.`
      );
    }
  } catch (cloudinaryError) {
    // Log Cloudinary deletion error but don't fail the request
    // The file might have already been deleted, the URL format might be different,
    // or there might be network issues. We still want to delete from the database.
    console.error('Error deleting file from Cloudinary:', cloudinaryError.message);
    // Continue with database deletion even if Cloudinary deletion fails
  }

  // Delete from MongoDB (always execute, even if Cloudinary deletion failed)
  await Media.findByIdAndDelete(media._id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
