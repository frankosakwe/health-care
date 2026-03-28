/**
 * Real-time Dashboard Routes
 * API endpoints for dashboard data and operations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/dashboard/metrics
 * Get current system metrics
 */
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    if (!global.realtimeBroadcaster) {
      return res.status(503).json({ 
        error: 'Real-time service not available',
        metrics: null 
      });
    }

    const metrics = global.realtimeBroadcaster.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('[Dashboard] Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/status
 * Get dashboard connection status
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      realtime: global.realtimeBroadcaster ? 'connected' : 'disconnected',
      monitoring: global.monitoringService?.isRunning ? 'active' : 'inactive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    if (global.realtimeBroadcaster) {
      status.activeConnections = global.realtimeBroadcaster.getConnectionCount();
    }

    res.json({ success: true, status });
  } catch (error) {
    console.error('[Dashboard] Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/events/claims
 * Get recent claim events
 */
router.get('/events/claims', authenticateToken, (req, res) => {
  try {
    if (!global.monitoringService) {
      return res.status(503).json({ error: 'Monitoring service not available' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;

    const emitter = global.monitoringService.getClaimsEmitter();
    const events = type ? 
      emitter.getEventsByType(type, limit) : 
      emitter.getEventHistory(limit);

    res.json({ success: true, events, count: events.length });
  } catch (error) {
    console.error('[Dashboard] Error fetching claim events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/events/payments
 * Get recent payment events
 */
router.get('/events/payments', authenticateToken, (req, res) => {
  try {
    if (!global.monitoringService) {
      return res.status(503).json({ error: 'Monitoring service not available' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;

    const emitter = global.monitoringService.getPaymentsEmitter();
    const events = type ? 
      emitter.getEventsByType(type, limit) : 
      emitter.getEventHistory(limit);

    res.json({ success: true, events, count: events.length });
  } catch (error) {
    console.error('[Dashboard] Error fetching payment events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/events/system
 * Get recent system events
 */
router.get('/events/system', authenticateToken, (req, res) => {
  try {
    if (!global.monitoringService) {
      return res.status(503).json({ error: 'Monitoring service not available' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;

    const emitter = global.monitoringService.getSystemEmitter();
    const events = type ? 
      emitter.getEventsByType(type, limit) : 
      emitter.getEventHistory(limit);

    res.json({ success: true, events, count: events.length });
  } catch (error) {
    console.error('[Dashboard] Error fetching system events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/health
 * Get overall system health
 */
router.get('/health', (req, res) => {
  try {
    if (!global.monitoringService) {
      return res.json({ 
        health: 'degraded',
        reason: 'Monitoring service not available',
        timestamp: new Date().toISOString()
      });
    }

    const metrics = global.monitoringService.getMetrics();
    const health = metrics.systemHealth >= 80 ? 'healthy' : 
                   metrics.systemHealth >= 50 ? 'degraded' : 'critical';

    res.json({
      health,
      systemHealth: metrics.systemHealth,
      errorRate: metrics.errorRate,
      avgResponseTime: metrics.avgResponseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Dashboard] Error checking health:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dashboard/refresh
 * Request dashboard data refresh
 */
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    if (!global.realtimeBroadcaster) {
      return res.status(503).json({ error: 'Real-time service not available' });
    }

    // Trigger refresh broadcast
    global.realtimeBroadcaster.broadcastSystemStatus({
      refreshRequested: true,
      requestedBy: req.user?.id,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Dashboard refresh triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Dashboard] Error refreshing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/connections
 * Get active WebSocket connections (admin only)
 */
router.get('/connections', authenticateToken, (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!global.realtimeBroadcaster) {
      return res.status(503).json({ error: 'Real-time service not available' });
    }

    const connections = global.realtimeBroadcaster.getAllConnections();
    res.json({ 
      success: true, 
      connections,
      count: connections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Dashboard] Error fetching connections:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get analytics data
 */
router.get('/analytics', authenticateToken, (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h'; // 24h, 7d, 30d
    const type = req.query.type || 'all'; // all, claims, payments

    // Placeholder for analytics aggregation
    const analytics = {
      timeframe,
      type,
      summary: {
        claimsProcessed: 0,
        claimsApproved: 0,
        claimsDenied: 0,
        paymentsProcessed: 0,
        paymentsSuccessful: 0,
        paymentsFailed: 0,
        revenue: 0,
        avgProcessingTime: 0
      },
      trends: [],
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('[Dashboard] Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
