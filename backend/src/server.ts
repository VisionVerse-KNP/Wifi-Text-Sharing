import express from 'express';
import http from 'http';
import cors from 'cors';
import os from 'os';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers';
import { createFileRouter } from './fileRoutes';
import { createLinkPreviewRouter } from './linkPreviewRoutes';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './types';

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = [
  'https://localwifishare.netlify.app'
];

const app = express();

// Secure HTTP headers. CSP is relaxed for connect-src so the frontend (often
// on a different LAN host/port) can still reach this API + Socket.IO.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", '*'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

// Basic abuse protection for the plain HTTP API. Socket.IO events are
// separately rate-limited by keeping payload sizes small and validating/
// sanitizing every input in socketHandlers.ts.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Helper endpoint so the frontend/QR code can show the LAN address to share
app.get('/api/network-info', (_req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.push(entry.address);
      }
    });
  });
  res.json({ addresses, port: PORT });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Keep pings frequent for snappy "reconnecting/offline" detection on LAN
    pingInterval: 5000,
    pingTimeout: 5000,
  }
);

registerSocketHandlers(io);
app.use('/api', createFileRouter(io));
app.use('/api', createLinkPreviewRouter());

httpServer.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  const lanAddresses: string[] = [];
  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        lanAddresses.push(entry.address);
      }
    });
  });

  console.log(`\nWiFi Text Share backend running on port ${PORT}`);
  console.log('Reachable on your local network at:');
  lanAddresses.forEach((addr) => console.log(`  http://${addr}:${PORT}`));
  if (lanAddresses.length === 0) {
    console.log('  (no non-internal IPv4 interface found)');
  }
  console.log('');
});
