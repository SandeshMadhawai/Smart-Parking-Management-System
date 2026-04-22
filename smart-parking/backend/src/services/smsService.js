const sendMockSMS = async ({ to, message }) => {
  await new Promise(r => setTimeout(r, 200));
  console.log('\n📱 [MOCK SMS]');
  console.log(`  To: ${to}`);
  console.log(`  Message: ${message}\n`);
  return { success: true, messageId: `MOCK_${Date.now()}`, to };
};

const sendViaTwilio = async ({ to, message }) => {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: `+91${to}`,
  });

  console.log('📱 SMS sent via Twilio:', result.sid);
  return { success: true, messageId: result.sid, to };
};

const sendSMS = async ({ to, message }) => {
  const provider = process.env.SMS_PROVIDER || 'mock';

  // Clean number — remove +91, spaces, dashes, keep last 10 digits
  const cleanNumber = to.toString()
    .replace(/[\s\-\+]/g, '')
    .replace(/^91/, '')
    .slice(-10);

  if (cleanNumber.length !== 10) {
    console.warn(`⚠️  Invalid phone number: ${to}`);
    return { success: false, message: 'Invalid phone number' };
  }

  try {
    if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
      return await sendViaTwilio({ to: cleanNumber, message });
    }
    return await sendMockSMS({ to: cleanNumber, message });
  } catch (error) {
    console.error('SMS Error:', error.message);
    // Fallback to mock so parking session still works even if SMS fails
    console.log('⚠️  SMS failed, falling back to mock');
    return sendMockSMS({ to: cleanNumber, message });
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