const axios = require('axios');
const FormData = require('form-data');

const recognizePlate = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    const formData = new FormData();
    formData.append('upload', imageBuffer, {
      filename: 'plate.jpg',
      contentType: mimeType,
    });
    formData.append('regions', 'in');

    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      formData,
      {
        headers: {
          Authorization: `Token ${process.env.PLATE_RECOGNIZER_TOKEN}`,
          ...formData.getHeaders(),
        },
        timeout: 10000,
      }
    );

    const results = response.data.results;

    if (!results || results.length === 0) {
      return { success: false, plate: null, confidence: 0, message: 'No plate detected' };
    }

    const best = results[0];
    const plate = best.plate.toUpperCase().replace(/\s+/g, '');
    const confidence = Math.round(best.score * 100);

    return {
      success: true,
      plate,
      confidence,
      region: best.region?.code || null,
      allResults: results.map(r => ({
        plate: r.plate.toUpperCase(),
        confidence: Math.round(r.score * 100),
      })),
    };
  } catch (error) {
    console.error('OCR Error:', error.response?.data || error.message);
    return {
      success: false,
      plate: null,
      confidence: 0,
      message: error.response?.data?.detail || 'OCR service error',
    };
  }
};

module.exports = { recognizePlate };