// Mock SMS Service
// Replace with Twilio, MSG91, or any real provider in production

const sendSMS = async ({ to, message }) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log('\n📱 [MOCK SMS SERVICE]');
  console.log(`  To: ${to}`);
  console.log(`  Message: ${message}`);
  console.log('  Status: Sent (mock)\n');

  // Return mock response
  return {
    success: true,
    messageId: `MOCK_${Date.now()}`,
    to,
    status: 'delivered',
  };
};

const sendParkingConfirmation = async ({ mobileNumber, driverName, slotNumber, sessionToken, entryTime, baseUrl }) => {
  const sessionUrl = `${baseUrl}/${sessionToken}`;
  const formattedTime = new Date(entryTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const message =
    `Hi ${driverName}! Your parking is confirmed.\n` +
    `Slot: ${slotNumber}\n` +
    `Entry: ${formattedTime}\n` +
    `View/Pay: ${sessionUrl}\n` +
    `Smart Parking System`;

  return sendSMS({ to: mobileNumber, message });
};

module.exports = { sendSMS, sendParkingConfirmation };
