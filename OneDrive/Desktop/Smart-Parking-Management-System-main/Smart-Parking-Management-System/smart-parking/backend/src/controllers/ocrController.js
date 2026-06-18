const multer = require('multer');
const { recognizePlate } = require('../services/ocrService');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const scanPlate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const result = await recognizePlate(req.file.buffer, req.file.mimetype);

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.message || 'Could not read plate from image',
      });
    }

    if (req.io) {
      req.io.to(req.organizationId.toString()).emit('plateScanned', {
        plate: result.plate,
        confidence: result.confidence,
        allResults: result.allResults,
      });
    }

    res.json({
      success: true,
      data: {
        plate: result.plate,
        confidence: result.confidence,
        allResults: result.allResults,
        region: result.region,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { scanPlate, upload };