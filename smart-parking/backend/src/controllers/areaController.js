const ParkingArea = require('../models/ParkingArea');
const ParkingSlot = require('../models/ParkingSlot');

// @route   GET /api/areas
const getAreas = async (req, res, next) => {
  try {
    const areas = await ParkingArea.find({ organizationId: req.organizationId, isActive: true }).sort('name');

    // Attach slot stats per area
    const areasWithStats = await Promise.all(
      areas.map(async (area) => {
        const [total, available, occupied] = await Promise.all([
          ParkingSlot.countDocuments({ areaId: area._id, isActive: true }),
          ParkingSlot.countDocuments({ areaId: area._id, isActive: true, status: 'available' }),
          ParkingSlot.countDocuments({ areaId: area._id, isActive: true, status: 'occupied' }),
        ]);
        return { ...area.toObject(), stats: { total, available, occupied } };
      })
    );

    res.json({ success: true, data: areasWithStats });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/areas
const createArea = async (req, res, next) => {
  try {
    const { name, description, vehicleTypes, pricing, floor } = req.body;

    const area = await ParkingArea.create({
      organizationId: req.organizationId,
      name: name.toUpperCase(),
      description,
      vehicleTypes,
      pricing,
      floor,
    });

    res.status(201).json({ success: true, message: 'Parking area created.', data: area });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/areas/:id
const updateArea = async (req, res, next) => {
  try {
    const area = await ParkingArea.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!area) return res.status(404).json({ success: false, message: 'Area not found.' });

    res.json({ success: true, message: 'Area updated.', data: area });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/areas/:id
const deleteArea = async (req, res, next) => {
  try {
    // Check for active sessions in this area
    const ParkingSession = require('../models/ParkingSession');
    const activeSession = await ParkingSession.findOne({
      areaId: req.params.id,
      status: 'active',
    });
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete area with active parking sessions.',
      });
    }

    await ParkingArea.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { isActive: false }
    );

    await ParkingSlot.updateMany({ areaId: req.params.id }, { isActive: false });

    res.json({ success: true, message: 'Area deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAreas, createArea, updateArea, deleteArea };
