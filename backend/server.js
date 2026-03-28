const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const JobProcessor = require('./services/jobProcessor');

// Initialize job processor
const jobProcessor = new JobProcessor();

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const medicalRecordsRoutes = require('./routes/medicalRecords');
const transformedPatientsRoutes = require('./routes/transformedPatients');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/transformed-patients', transformedPatientsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      jobProcessor: jobProcessor.isRunning,
      transformations: true
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle audit alert subscriptions
  socket.on('subscribe_audit_alerts', (data) => {
    const { alertTypes = [], severities = [] } = data;
    if (auditMonitoringService) {
      auditMonitoringService.subscribeToAlerts(socket, alertTypes, severities);
    }
  });

  socket.on('unsubscribe_audit_alerts', () => {
    if (auditMonitoringService) {
      auditMonitoringService.unsubscribeFromAlerts(socket.id);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

app.use(errorHandler);

// Database initialization
async function initializeDatabase() {
  // This would typically initialize your database connection
  console.log('Database initialized');
}

async function startServer() {
  try {
    await initializeDatabase();

    // Initialize job processor
    await jobProcessor.initialize();

    // Initialize audit monitoring service (if available)
    let auditMonitoringService = null;
    try {
      const AuditMonitoringService = require('./services/auditMonitoringService');
      auditMonitoringService = new AuditMonitoringService(io);
    } catch (error) {
      console.warn('Audit monitoring service not available:', error.message);
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
      console.log(`HL7/FHIR API available at http://localhost:${PORT}/api/hl7-fhir`);
      console.log(`Audit API available at http://localhost:${PORT}/api/audit`);
      console.log('Real-time audit monitoring enabled');
      console.log('Background job processing enabled');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await jobProcessor.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await jobProcessor.shutdown();
  process.exit(0);
});

startServer();

module.exports = { app, io, jobProcessor };
