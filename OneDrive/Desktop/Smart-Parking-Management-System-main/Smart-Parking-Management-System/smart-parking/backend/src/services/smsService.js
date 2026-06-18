const axios = require('axios');

const twilio = require('twilio');

const sendViaTwilio = async ({ to, message }) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${to}`,   // Twilio needs +91 prefix
  });

  console.log('📱 SMS sent via Twilio:', result.sid);
  return { success: true, messageId: result.sid, to };
};



const sendMockSMS = async ({ to, message }) => {
  await new Promise(r => setTimeout(r, 200));
  console.log('\n📱 [MOCK SMS]');
  console.log(`  To: ${to}`);
  console.log(`  Message: ${message}\n`);
  return { success: true, messageId: `MOCK_${Date.now()}`, to };
};

const sendSMS = async ({ to, message }) => {
  const cleanNumber = to.toString()
    .replace(/[\s\-\+]/g, '')
    .replace(/^91/, '')
    .slice(-10);

  if (cleanNumber.length !== 10) {
    console.warn(`⚠️  Invalid phone number: ${to}`);
    return { success: false, message: 'Invalid phone number' };
  }

  try {
    const hasTwilio = process.env.TWILIO_ACCOUNT_SID && 
                      process.env.TWILIO_ACCOUNT_SID !== 'ACxxxxxxx';
    
    if (hasTwilio) {
      return await sendViaTwilio({ to: cleanNumber, message });
    }
    return await sendMockSMS({ to: cleanNumber, message });
  } catch (error) {
    console.error('❌ SMS Error:', error.message);
    return { success: false, message: error.message };
  }
};

const sendParkingConfirmation = async ({
  mobileNumber,
  driverName,
  slotNumber,
  sessionToken,
  entryTime,
  baseUrl,
}) => {
  const sessionUrl = `${baseUrl}/${sessionToken}`;

  const formattedTime = new Date(entryTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const message =
    `ParkSmart: Parking confirmed!\n` +
    `Slot: ${slotNumber}\n` +
    `Entry: ${formattedTime}\n` +
    `View & Pay: ${sessionUrl}`;

  return sendSMS({ to: mobileNumber, message });
};

module.exports = { sendSMS, sendParkingConfirmation };