const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'text/markdown',
  'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

router.post('/', optionalAuth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploaded = await Promise.all(req.files.map(async (file) => {
      const isImage = file.mimetype.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: 'mirrasync',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: isImage ? 'image' : 'file',
        width: result.width,
        height: result.height,
      };
    }));

    res.json({ files: uploaded });
  } catch (err) {
    console.error('Upload error:', err);
    if (err.message?.includes('File type not allowed')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

module.exports = router;
