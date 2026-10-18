import crypto from 'crypto';
import request from 'supertest';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { createApp } from '../src/app.js';
import { config } from '../src/config/index.js';
import { WhatsAppConnection, WhatsAppMessage, Organization } from '../src/database/models/index.js';
import { WhatsAppConnectionStatus } from '@metriflow/contracts';
import { getRedisClient } from '../src/database/redis.js';
import mongoose from 'mongoose';

describe('Webhooks, Health and Integration Verification', () => {
  let app: any;
  let tenantId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    const org = await Organization.create({
      name: 'Integration Test Org',
      slug: `int-test-${Date.now()}`,
    });
    tenantId = org._id as mongoose.Types.ObjectId;

    await WhatsAppConnection.create({
      tenantId,
      wabaId: 'test_waba_123',
      phoneNumberId: 'test_phone_id_456',
      displayPhoneNumber: '+923001234567',
      status: WhatsAppConnectionStatus.CONNECTED,
      accessTokenEncrypted: 'mock-encrypted-token',
    });
  });

  afterAll(async () => {
    await Organization.deleteOne({ _id: tenantId });
    await WhatsAppConnection.deleteMany({ tenantId });
    await WhatsAppMessage.deleteMany({ tenantId });
    getRedisClient().disconnect();
    await disconnectDatabase();
  });

  test('Health check endpoint returns status UP', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('Readiness check returns READY when DB & Redis connected', async () => {
    const res = await request(app).get('/ready').expect(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.database).toBe('CONNECTED');
    expect(res.body.redis).toBe('CONNECTED');
  });

  test('Meta WhatsApp Webhook GET Challenge verification', async () => {
    const challenge = 'test_challenge_code_999';
    const res = await request(app)
      .get(`/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${config.WHATSAPP_WEBHOOK_VERIFY_TOKEN}&hub.challenge=${challenge}`)
      .expect(200);

    expect(res.text).toBe(challenge);

    // Mismatched token rejected
    await request(app)
      .get(`/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=${challenge}`)
      .expect(403);
  });

  test('Meta WhatsApp Inbound Message Event and Deduplication', async () => {
    const providerMessageId = `wam_test_${Date.now()}`;
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'test_waba_123',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+923001234567',
                  phone_number_id: 'test_phone_id_456',
                },
                messages: [
                  {
                    from: '+923009876543',
                    id: providerMessageId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: {
                      body: 'Bhai please send 10 bags of flour',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', config.META_APP_SECRET)
      .update(rawBody)
      .digest('hex');

    // First delivery
    const res1 = await request(app)
      .post('/api/v1/integrations/whatsapp/webhook')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    expect(res1.body.eventStatus).toBe('EVENT_RECEIVED');

    // Duplicate webhook delivery with exact same providerMessageId
    const res2 = await request(app)
      .post('/api/v1/integrations/whatsapp/webhook')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    expect(res2.body.eventStatus).toBe('EVENT_RECEIVED');

    // Verify only 1 message document was stored
    const count = await WhatsAppMessage.countDocuments({
      tenantId,
      providerMessageId,
    });
    expect(count).toBe(1);
  });
});
