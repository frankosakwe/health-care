const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const telemedicineRoutes = require('./routes/telemedicine');
const fraudDetectionRoutes = require('./routes/fraudDetection');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to actual frontend URL
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const DB_PATH = path.join(__dirname, 'database', 'healthcare.sqlite');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/fraud', fraudDetectionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io initialization for Telemedicine signaling
const TelemedicineService = require('./services/telemedicineService');
const telemedicineService = new TelemedicineService(io);
telemedicineService.initialize();

io.on('connection', (socket) => {

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database init
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Database initialized');
      resolve();
    });
  });
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    server.listen(3000, () => {
      console.log('Server running on port 3000');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };