const axios = require('axios');
const FormData = require('form-data');

const recognizePlate = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    const formData = new FormData();

    // FastAPI expects the field name: "file"
    formData.append('file', imageBuffer, {
      filename: 'plate.jpg',
      contentType: mimeType,
    });

    // FastAPI AI Engine
    const aiEngineUrl =
      process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

    const response = await axios.post(
      `${aiEngineUrl}/api/ai/plate-recognition`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    const result = response.data;

    // No plate detected
    if (!result.success || !result.plate_number) {
      return {
        success: false,
        plate: null,
        confidence: 0,
        message: result.message || 'No plate detected',
      };
    }

    // Convert AI confidence:
    // 0.9019 → 90
    const confidence = Math.round(result.confidence * 100);

    return {
      success: true,
      plate: result.plate_number
        .toUpperCase()
        .replace(/\s+/g, ''),
      confidence,
      region: 'in',
      bbox: result.bbox || null,
      allResults: [
        {
          plate: result.plate_number
            .toUpperCase()
            .replace(/\s+/g, ''),
          confidence,
        },
      ],
    };
  } catch (error) {
    console.error(
      'AI OCR Error:',
      error.response?.data || error.message
    );

    return {
      success: false,
      plate: null,
      confidence: 0,
      message:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'AI OCR service error',
    };
  }
};

module.exports = { recognizePlate };
