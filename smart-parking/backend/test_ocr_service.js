const fs = require('fs');
const path = require('path');

const { recognizePlate } = require('./src/services/ocrService');

async function testOCR() {
  try {
    const imagePath = path.join(
      __dirname,
      '..',
      'ai-engine',
      'tests',
      'images',
      'test_car.jpeg'
    );

    console.log('Image:', imagePath);

    const imageBuffer = fs.readFileSync(imagePath);

    console.log('Image loaded successfully');
    console.log('Sending image to AI Engine...');

    const result = await recognizePlate(
      imageBuffer,
      'image/jpeg'
    );

    console.log('\n========== OCR RESULT ==========');
    console.log(result);
    console.log('=================================');
  } catch (error) {
    console.error('OCR test failed:', error);
  }
}

testOCR();
