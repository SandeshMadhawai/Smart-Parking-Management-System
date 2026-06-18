const ParkingSlot = require('../models/ParkingSlot');
const ParkingArea = require('../models/ParkingArea');

// @route   GET /api/slots?areaId=&status=
const getSlots = async (req, res, next) => {
  try {
    const filter = { organizationId: req.organizationId, isActive: true };

    if (req.query.areaId) filter.areaId = req.query.areaId;
    if (req.query.status) filter.status = req.query.status;

    const slots = await ParkingSlot.find(filter)
      .populate('areaId', 'name')
      .populate({
        path: 'currentSessionId',
        select: 'vehicleNumber driverName entryTime expectedDurationHours',
      })
      .sort('slotNumber');

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/slots/by-area
// Returns slots grouped by area - for guard dashboard grid
const getSlotsByArea = async (req, res, next) => {
  try {
    const areas = await ParkingArea.find({ organizationId: req.organizationId, isActive: true }).sort('name');

    const result = await Promise.all(
      areas.map(async (area) => {
        const slots = await ParkingSlot.find({ areaId: area._id, isActive: true })
          .populate({
            path: 'currentSessionId',
            select: 'vehicleNumber driverName entryTime expectedDurationHours sessionToken',
          })
          .sort('slotNumber');

        return {
          area: area.toObject(),
          slots,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/slots
const createSlot = async (req, res, next) => {
  try {
    const { areaId, slotNumber, vehicleType, position } = req.body;

    // Verify area belongs to org
    const area = await ParkingArea.findOne({ _id: areaId, organizationId: req.organizationId });
    if (!area) {
      return res.status(404).json({ success: false, message: 'Parking area not found.' });
    }

    const slot = await ParkingSlot.create({
      organizationId: req.organizationId,
      areaId,
      slotNumber: slotNumber.toUpperCase(),
      vehicleType,
      position,
    });

    // Update area's total slot count
    await ParkingArea.findByIdAndUpdate(areaId, { $inc: { totalSlots: 1 } });

    res.status(201).json({ success: true, message: 'Slot created.', data: slot });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/slots/bulk
// Create multiple slots at once
const createSlotsBulk = async (req, res, next) => {
  try {
    const { areaId, prefix, count, vehicleType } = req.body;

    const area = await ParkingArea.findOne({ _id: areaId, organizationId: req.organizationId });
    if (!area) {
      return res.status(404).json({ success: false, message: 'Parking area not found.' });
    }

    const slots = [];
    for (let i = 1; i <= count; i++) {
      slots.push({
        organizationId: req.organizationId,
        areaId,
        slotNumber: `${prefix || area.name}-${i}`,
        vehicleType: vehicleType || 'any',
        position: { row: Math.ceil(i / 10), column: i % 10 || 10 },
      });
    }

    const created = await ParkingSlot.insertMany(slots, { ordered: false });
    await ParkingArea.findByIdAndUpdate(areaId, { $inc: { totalSlots: created.length } });

    res.status(201).json({
      success: true,
      message: `${created.length} slots created.`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/slots/:id
const updateSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    res.json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/slots/:id
const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });

    if (slot.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete an occupied slot.' });
    }

    slot.isActive = false;
    await slot.save();

    await ParkingArea.findByIdAndUpdate(slot.areaId, { $inc: { totalSlots: -1 } });

    res.json({ success: true, message: 'Slot deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSlots, getSlotsByArea, createSlot, createSlotsBulk, updateSlot, deleteSlot };
