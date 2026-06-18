require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const testOCR = async () => {
  const token = "7ca720e0f4302259db65b0727be585f0f4164da7";

  console.log('🔄 Sending image to Plate Recognizer...\n');

  const formData = new FormData();
  formData.append('upload', fs.createReadStream('./test-car.jpg'));
  formData.append('regions', 'in');

  try {
    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log('✅ Raw API Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.results?.length > 0) {
      const plate = response.data.results[0].plate.toUpperCase();
      const confidence = Math.round(response.data.results[0].score * 100);
      console.log(`\n🚗 Plate detected: ${plate}`);
      console.log(`📊 Confidence: ${confidence}%`);
    } else {
      console.log('\n⚠️  No plate detected. Try a clearer image.');
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Invalid token.');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
};

testOCR();