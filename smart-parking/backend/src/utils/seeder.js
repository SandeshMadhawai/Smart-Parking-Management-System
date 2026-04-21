require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');
const ParkingArea = require('../models/ParkingArea');
const ParkingSlot = require('../models/ParkingSlot');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      ParkingArea.deleteMany({}),
      ParkingSlot.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create organization
    const org = await Organization.create({
      name: 'Tech Park Mall',
      email: 'admin@techparkmall.com',
      password: 'admin123',
      phone: '9876543210',
      address: '123 Tech Street, Bangalore',
      type: 'mall',
      upiId: 'techparkmall@upi',
      pricing: {
        baseDurationHours: 3,
        basePrice: 40,
        extraHourPrice: 20,
        currency: 'INR',
      },
    });
    console.log(`🏢 Created org: ${org.name}`);

    // Create security guards
    const guard1 = await User.create({
      organizationId: org._id,
      name: 'Ramesh Kumar',
      email: 'guard1@techparkmall.com',
      password: 'guard123',
      phone: '9876543211',
      role: 'guard',
      assignedGate: 'Gate A',
    });

    const guard2 = await User.create({
      organizationId: org._id,
      name: 'Suresh Patil',
      email: 'guard2@techparkmall.com',
      password: 'guard123',
      phone: '9876543212',
      role: 'guard',
      assignedGate: 'Gate B',
    });
    console.log(`👮 Created guards: ${guard1.name}, ${guard2.name}`);

    // Create parking areas
    const areaA = await ParkingArea.create({
      organizationId: org._id,
      name: 'A',
      description: 'Ground Floor - Near Main Entrance',
      vehicleTypes: ['car'],
      floor: 'Ground Floor',
    });

    const areaB = await ParkingArea.create({
      organizationId: org._id,
      name: 'B',
      description: 'First Floor - Near Food Court',
      vehicleTypes: ['car', 'bike'],
      floor: 'First Floor',
    });

    const areaC = await ParkingArea.create({
      organizationId: org._id,
      name: 'C',
      description: 'Basement - Bike Parking',
      vehicleTypes: ['bike'],
      floor: 'Basement',
      pricing: {
        baseDurationHours: 3,
        basePrice: 20,
        extraHourPrice: 10,
      },
    });
    console.log(`🅿️  Created areas: A, B, C`);

    // Create slots for area A (10 slots)
    const aSlots = [];
    for (let i = 1; i <= 10; i++) {
      aSlots.push({
        organizationId: org._id,
        areaId: areaA._id,
        slotNumber: `A-${i}`,
        vehicleType: 'car',
        position: { row: Math.ceil(i / 5), column: ((i - 1) % 5) + 1 },
      });
    }
    await ParkingSlot.insertMany(aSlots);
    await ParkingArea.findByIdAndUpdate(areaA._id, { totalSlots: 10 });

    // Create slots for area B (8 slots)
    const bSlots = [];
    for (let i = 1; i <= 8; i++) {
      bSlots.push({
        organizationId: org._id,
        areaId: areaB._id,
        slotNumber: `B-${i}`,
        vehicleType: i <= 5 ? 'car' : 'bike',
        position: { row: Math.ceil(i / 4), column: ((i - 1) % 4) + 1 },
      });
    }
    await ParkingSlot.insertMany(bSlots);
    await ParkingArea.findByIdAndUpdate(areaB._id, { totalSlots: 8 });

    // Create slots for area C (12 bike slots)
    const cSlots = [];
    for (let i = 1; i <= 12; i++) {
      cSlots.push({
        organizationId: org._id,
        areaId: areaC._id,
        slotNumber: `C-${i}`,
        vehicleType: 'bike',
        position: { row: Math.ceil(i / 6), column: ((i - 1) % 6) + 1 },
      });
    }
    await ParkingSlot.insertMany(cSlots);
    await ParkingArea.findByIdAndUpdate(areaC._id, { totalSlots: 12 });

    console.log(`🚗 Created 30 parking slots`);

    console.log('\n✅ Seeding complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Email: admin@techparkmall.com');
    console.log('  Password: admin123');
    console.log('  URL: http://localhost:5173/admin/login');
    console.log('');
    console.log('GUARD:');
    console.log('  Email: guard1@techparkmall.com');
    console.log('  Password: guard123');
    console.log('  URL: http://localhost:5173/guard/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
