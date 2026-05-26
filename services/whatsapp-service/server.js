'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// WhatsApp client
// ---------------------------------------------------------------------------

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  },
});

let isReady = false;

client.on('qr', (qr) => {
  console.log('\n=========================================');
  console.log('  WhatsApp QR Code — scan to link device');
  console.log('  Open WhatsApp -> Linked Devices -> Link a Device');
  console.log('=========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nWaiting for scan...\n');
});

client.on('authenticated', () => {
  console.log('[WhatsApp] Session authenticated — saving locally');
});

client.on('ready', () => {
  isReady = true;
  console.log('[WhatsApp] Client is ready — messages can be sent');
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('[WhatsApp] Client disconnected:', reason);
  // Attempt reconnect after 5 s
  setTimeout(() => {
    console.log('[WhatsApp] Attempting to reconnect...');
    client.initialize().catch((err) => console.error('[WhatsApp] Reconnect failed:', err));
  }, 5000);
});

client.on('auth_failure', (msg) => {
  console.error('[WhatsApp] Authentication failure:', msg);
  isReady = false;
});

console.log('[WhatsApp] Initializing client...');
client.initialize().catch((err) => {
  console.error('[WhatsApp] Failed to initialize:', err);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Express API
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

/** Health check */
app.get('/health', (_req, res) => {
  res.json({ status: isReady ? 'ready' : 'initializing' });
});

/**
 * POST /send
 * Body: { number: "917201874841", message: "Hello" }
 */
app.post('/send', async (req, res) => {
  const { number, message } = req.body ?? {};

  if (!number || !message) {
    return res.status(400).json({ success: false, error: 'number and message are required' });
  }

  if (!isReady) {
    console.warn('[WhatsApp] Send attempted before client ready — number:', number);
    return res.status(503).json({ success: false, error: 'WhatsApp client not ready' });
  }

  const chatId = `${number}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    console.log(`[WhatsApp] Message sent to ${number}`);
    return res.json({ success: true });
  } catch (err) {
    console.error(`[WhatsApp] Failed to send message to ${number}:`, err?.message ?? err);
    return res.status(500).json({ success: false, error: err?.message ?? 'Send failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[WhatsApp Service] HTTP API listening on port ${PORT}`);
});
