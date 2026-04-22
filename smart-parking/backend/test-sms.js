require('dotenv').config();

const testTwilio = async () => {
  console.log('SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
  console.log('Provider:', process.env.SMS_PROVIDER);

  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const msg = await client.messages.create({
      body: 'ParkSmart test! SMS is working perfectly for your project.',
      from: process.env.TWILIO_PHONE,
      to: '+918380898957',
    });

    console.log('\n✅ SMS sent! SID:', msg.sid);
    console.log('Check your phone now!');
  } catch (err) {
    console.log('\n❌ Error:', err.message);
  }
};

testTwilio();