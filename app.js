const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']); 

const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Route imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Clinic API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// ─── Global Error Handler (must be last) ───────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
