# 🅿️ ParkSmart — Smart Parking Management System

A production-ready, multi-tenant SaaS parking management platform for colleges, malls, and societies.
Built with React + Vite, Node.js + Express, MongoDB, and Socket.IO.

---

## 📁 Full Project Structure

```
smart-parking/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register/login org & guards
│   │   │   ├── areaController.js    # Parking area CRUD
│   │   │   ├── slotController.js    # Slot CRUD + bulk create
│   │   │   ├── sessionController.js # Entry, checkout, analytics
│   │   │   └── userController.js    # Guard account management
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT protect + role guards
│   │   │   └── errorHandler.js      # Global error + 404 handler
│   │   ├── models/
│   │   │   ├── Organization.js      # Org schema (multi-tenant root)
│   │   │   ├── User.js              # Guards & admin staff
│   │   │   ├── ParkingArea.js       # Zones A, B, C
│   │   │   ├── ParkingSlot.js       # Individual slots A-1, B-5
│   │   │   └── ParkingSession.js    # Active/completed sessions
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── areas.js
│   │   │   ├── slots.js
│   │   │   ├── sessions.js
│   │   │   └── users.js
│   │   ├── services/
│   │   │   └── smsService.js        # Mock SMS (swap for Twilio/MSG91)
│   │   ├── utils/
│   │   │   └── seeder.js            # Sample data seeder
│   │   └── server.js                # Express + Socket.IO entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Axios instance + interceptors
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Layout.jsx       # Sidebar + mobile nav
│   │   │       ├── Modal.jsx        # Reusable modal
│   │   │       └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── admin/
│   │   │   │   ├── AdminLogin.jsx   # Login + Register org
│   │   │   │   ├── AdminDashboard.jsx  # Analytics + charts
│   │   │   │   ├── AdminAreas.jsx   # Zone management
│   │   │   │   ├── AdminSlots.jsx   # Slot grid management
│   │   │   │   ├── AdminSessions.jsx   # Session history table
│   │   │   │   ├── AdminGuards.jsx  # Guard account management
│   │   │   │   └── AdminSettings.jsx   # Org profile + pricing
│   │   │   ├── guard/
│   │   │   │   ├── GuardLogin.jsx
│   │   │   │   ├── GuardDashboard.jsx  # ⭐ CORE: Slot grid + entry
│   │   │   │   └── GuardSessions.jsx   # Active sessions list
│   │   │   └── owner/
│   │   │       └── SessionView.jsx  # QR scan page for vehicle owners
│   │   ├── store/
│   │   │   ├── authStore.js         # Zustand auth state
│   │   │   └── socketStore.js       # Socket.IO connection
│   │   ├── utils/
│   │   │   └── helpers.js           # Date, currency, duration utils
│   │   ├── App.jsx                  # All routes
│   │   ├── main.jsx
│   │   └── index.css                # Tailwind + custom components
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) OR MongoDB Atlas URI
- npm or yarn

---

### Step 1 — Clone & Install

```bash
# Install backend deps
cd smart-parking/backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

---

### Step 2 — Configure Backend

```bash
cd smart-parking/backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_parking
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
QR_BASE_URL=http://localhost:5173/session
```

> For MongoDB Atlas: replace URI with your connection string.

---

### Step 3 — Seed Sample Data

```bash
cd smart-parking/backend
npm run seed
```

Output:
```
✅ Connected to MongoDB
🏢 Created org: Tech Park Mall
👮 Created guards: Ramesh Kumar, Suresh Patil
🅿️  Created areas: A, B, C
🚗 Created 30 parking slots

LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN:  admin@techparkmall.com / admin123
GUARD:  guard1@techparkmall.com / guard123
```

---

### Step 4 — Start Backend

```bash
cd smart-parking/backend
npm run dev
# → API running at http://localhost:5000
```

---

### Step 5 — Start Frontend

```bash
cd smart-parking/frontend
npm run dev
# → App running at http://localhost:5173
```

---

## 🔑 Login URLs

| Role | URL | Credentials |
|------|-----|-------------|
| Admin | http://localhost:5173/admin/login | admin@techparkmall.com / admin123 |
| Guard | http://localhost:5173/guard/login | guard1@techparkmall.com / guard123 |
| Vehicle Owner | http://localhost:5173/session/:token | (scan QR) |

---

## 🔌 REST API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/org/register` | Public | Register new organization |
| POST | `/api/auth/org/login` | Public | Organization login |
| POST | `/api/auth/guard/login` | Public | Guard/staff login |
| GET | `/api/auth/me` | JWT | Get current user |
| PUT | `/api/auth/org/profile` | Admin | Update org profile |

### Areas
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/areas` | JWT | List all areas with stats |
| POST | `/api/areas` | Admin | Create area |
| PUT | `/api/areas/:id` | Admin | Update area |
| DELETE | `/api/areas/:id` | Admin | Soft delete area |

### Slots
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slots` | JWT | List slots (filter by areaId, status) |
| GET | `/api/slots/by-area` | JWT | Slots grouped by area (guard grid) |
| POST | `/api/slots` | Admin | Create single slot |
| POST | `/api/slots/bulk` | Admin | Bulk create slots |
| PUT | `/api/slots/:id` | Admin | Update slot |
| DELETE | `/api/slots/:id` | Admin | Soft delete slot |

### Sessions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sessions/public/:token` | Public | Get session by QR token |
| PUT | `/api/sessions/public/:token/checkout` | Public | Owner self-checkout |
| GET | `/api/sessions` | JWT | List sessions (paginated) |
| GET | `/api/sessions/analytics` | JWT | Dashboard analytics |
| POST | `/api/sessions` | JWT | Create session (vehicle entry) |
| PUT | `/api/sessions/:id/checkout` | JWT | Guard manual checkout |

### Users (Guards)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all guards |
| POST | `/api/users` | Admin | Create guard account |
| PUT | `/api/users/:id` | Admin | Update guard |
| DELETE | `/api/users/:id` | Admin | Deactivate guard |

---

## 🗄️ Database Schema

### Organization
```js
{
  name, email, password (hashed), phone, address,
  type: enum[college, mall, society, hospital, office, other],
  pricing: { baseDurationHours, basePrice, extraHourPrice, currency },
  upiId, isActive
}
```

### User (Guards)
```js
{
  organizationId, name, email, password (hashed),
  phone, role: enum[admin, guard],
  assignedGate, isActive
}
```

### ParkingArea
```js
{
  organizationId, name (A/B/C), description,
  vehicleTypes, floor, totalSlots,
  pricing: { baseDurationHours, basePrice, extraHourPrice }  // overrides org
}
```

### ParkingSlot
```js
{
  organizationId, areaId, slotNumber (A-1),
  status: enum[available, occupied, reserved, maintenance],
  vehicleType, currentSessionId, isActive
}
```

### ParkingSession
```js
{
  organizationId, slotId, areaId, createdBy,
  sessionToken (UUID, unique),
  vehicleNumber, driverName, mobileNumber, vehicleType,
  entryTime, exitTime, expectedDurationHours, actualDurationHours,
  pricing: { baseDurationHours, basePrice, extraHourPrice },
  baseAmount, extraAmount, totalAmount,
  status: enum[active, completed, cancelled],
  paymentStatus: enum[pending, paid, waived],
  qrCodeDataUrl
}
```

---

## 💡 Billing Logic

```
Total = basePrice                           (if duration ≤ baseDurationHours)
Total = basePrice + (extraHours × extraHourPrice)  (if duration > baseDurationHours)

extraHours = ceil(actualHours - baseDurationHours)
```

**Example** (org defaults: 3h base = ₹40, extra = ₹20/hr):
- 2 hours → ₹40
- 3 hours → ₹40
- 4.5 hours → ₹40 + 2×₹20 = ₹80
- 7 hours → ₹40 + 4×₹20 = ₹120

---

## 🔄 Vehicle Flow (End-to-End)

```
1. Guard opens dashboard → sees color-coded slot grid
2. Guard clicks GREEN slot → entry form opens
3. Guard fills: vehicle number, driver name, mobile, expected duration
4. System creates session → generates QR code
5. QR sent via SMS to driver's mobile (mock in dev)
6. Slot turns RED in real-time (WebSocket broadcast)

7. Vehicle owner scans QR → sees slot/time/charges on mobile
8. Live timer counts up on owner's screen
9. Owner clicks "Pay via UPI" → UPI QR shown
10. Owner scans UPI QR, pays, clicks "Confirm Payment"
11. Session marked complete → slot turns GREEN in real-time
```

---

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart_parking
JWT_SECRET=change_this_to_something_random_and_long
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
QR_BASE_URL=http://localhost:5173/session
SMS_API_KEY=mock_key
SMS_API_URL=https://mock-sms.example.com
```

---

## 🚀 Production Deployment

### Backend (e.g., Railway / Render / DigitalOcean)
```bash
npm start
# Set NODE_ENV=production in environment
# Set MONGODB_URI to Atlas URI
# Set FRONTEND_URL to your deployed frontend URL
```

### Frontend (e.g., Vercel / Netlify)
```bash
npm run build
# Set VITE_API_URL if not using Vite proxy
# Deploy dist/ folder
```

### Update vite.config.js for production:
```js
// If frontend and backend are on different domains:
// In src/api/axios.js, change baseURL:
baseURL: import.meta.env.VITE_API_URL || '/api'
```

---

## 🔌 Replace Mock SMS with Real Provider

### Twilio (recommended)
```bash
npm install twilio
```

In `src/services/smsService.js`:
```js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const sendSMS = async ({ to, message }) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: `+91${to}`,  // adjust country code
  });
};
```

### MSG91 (India)
```js
const axios = require('axios');
const sendSMS = async ({ to, message }) => {
  return axios.post('https://api.msg91.com/api/sendhttp.php', null, {
    params: { authkey: process.env.MSG91_KEY, mobiles: to, message, route: 4, sender: 'PKSMRT' }
  });
};
```

---

## 🔮 Future Improvements

| Feature | Description |
|---------|-------------|
| Monthly passes | Pre-paid parking subscriptions |
| License plate OCR | Auto-detect vehicle number via camera |
| Pre-booking | Reserve slots in advance via app |
| PDF receipts | Auto-email receipts on checkout |
| Overstay alerts | SMS guard when expected time exceeded |
| Multi-gate support | Multiple entry/exit points per area |
| Mobile app | React Native guard app for field use |
| Reports export | CSV/PDF export of session history |
| Stripe/Razorpay | Direct online payment gateway |
| CCTV integration | Camera feed per slot for verification |

---

## 🧪 Sample API Calls (curl)

```bash
# Register org
curl -X POST http://localhost:5000/api/auth/org/register \
  -H "Content-Type: application/json" \
  -d '{"name":"My Mall","email":"admin@mall.com","password":"admin123","type":"mall"}'

# Login
curl -X POST http://localhost:5000/api/auth/org/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techparkmall.com","password":"admin123"}'

# Get analytics (with token)
curl http://localhost:5000/api/sessions/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get slot grid
curl http://localhost:5000/api/slots/by-area \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand + Context |
| Charts | Recharts |
| QR Code | qrcode + qrcode.react |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Real-time | Socket.IO |
| Security | Helmet + Rate Limiting |
| SMS | Mock (swap Twilio/MSG91) |

---

*Built with ❤️ — Production-ready Smart Parking SaaS*
