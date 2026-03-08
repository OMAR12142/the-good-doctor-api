const dotenv = require('dotenv');

// Load environment variables BEFORE anything else
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });

  // ─── Unhandled Rejection Handler ───────────────────────────────────────────────
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}

// ─── Uncaught Exception Handler ────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;