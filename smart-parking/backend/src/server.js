require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const areaRoutes = require('./routes/areas');
const slotRoutes = require('./routes/slots');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('joinOrg', (orgId) => {
    socket.join(orgId);
    console.log(`   Socket ${socket.id} joined org room: ${orgId}`);
  });
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

connectDB();

app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Smart Parking API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ocr', ocrRoutes);
app.use(cors({
  origin: ['https://smart-parking-management-system-nine.vercel.app'],
  credentials: true
}));

const bookingRoutes = require('./routes/bookings');
const vehicleUserRoutes = require('./routes/vehicleUsers');

app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicle-users', vehicleUserRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Smart Parking Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = { app, server, io };