const express = require('express');
const router = express.Router();
const { scanPlate, upload } = require('../controllers/ocrController');
const { protect } = require('../middleware/auth');

router.post('/scan', protect, upload.single('image'), scanPlate);

module.exports = router;