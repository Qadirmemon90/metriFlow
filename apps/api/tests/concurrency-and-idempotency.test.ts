import mongoose from 'mongoose';
import request from 'supertest';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { createApp } from '../src/app.js';
import {
  Organization,
  User,
  OrganizationMembership,
  Session,
  Branch,
  Warehouse,
  Product,
  Customer,
  StockBalance,
  Order,
  PaymentCollection,
} from '../src/database/models/index.js';
import { Role, OrderStatus } from '@metriflow/contracts';
import { salesService } from '../src/services/sales.service.js';
import { financeService } from '../src/services/finance.service.js';
import crypto from 'crypto';

describe('Concurrency, Invariants and Idempotency', () => {
  let app: any;
  let tenantId: mongoose.Types.ObjectId;
  let token: string;
  let actorId: string;
  let warehouseId: string;
  let productId: string;
  let customerId: string;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    const org = await Organization.create({
      name: 'Concurrency Test Wholesalers',
      slug: `conc-${Date.now()}`,
    });
    tenantId = org._id as mongoose.Types.ObjectId;

    const user = await User.create({
      email: `conc-user-${Date.now()}@metriflow.pk`,
      fullName: 'Concurrency Test User',
      passwordHash: 'dummy',
    });
    actorId = user._id.toString();

    const mem = await OrganizationMembership.create({
      tenantId,
      userId: user._id,
      role: Role.OWNER_ADMIN,
      invitationStatus: 'ACCEPTED',
    });

    token = crypto.randomBytes(32).toString('hex');
    await Session.create({
      sessionTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      userId: user._id,
      tenantId,
      membershipId: mem._id,
      expiresAt: new Date(Date.now() + 3600000),
    });

    const branch = await Branch.create({
      tenantId,
      name: 'Branch 1',
      code: 'B1',
      city: 'Karachi',
    });

    const wh = await Warehouse.create({
      tenantId,
      branchId: branch._id,
      name: 'WH 1',
      code: 'W1',
    });
    warehouseId = wh._id.toString();

    const prod = await Product.create({
      tenantId,
      sku: `CONC-SKU-${Date.now()}`,
      name: 'Limited Stock Item',
      category: 'Electronics',
      defaultPricePaisa: 50000,
      costPricePaisa: 30000,
    });
    productId = prod._id.toString();

    // Stock balance: exactly 10 units onHand
    await StockBalance.create({
      tenantId,
      warehouseId,
      productId: prod._id,
      onHand: 10,
      reserved: 0,
      quarantined: 0,
      movingAverageCostPaisa: 30000,
      totalValuePaisa: 300000,
    });

    const cust = await Customer.create({
      tenantId,
      name: 'High Volume Buyer',
      phone: '+923001239999',
      city: 'Karachi',
      creditLimitPaisa: 5000000, // PKR 50,000 credit limit
      creditDays: 15,
      currentBalancePaisa: 0,
    });
    customerId = cust._id.toString();
  });

  afterAll(async () => {
    await Promise.all([
      Organization.deleteOne({ _id: tenantId }),
      Product.deleteMany({ tenantId }),
      Customer.deleteMany({ tenantId }),
      StockBalance.deleteMany({ tenantId }),
      Order.deleteMany({ tenantId }),
      Session.deleteMany({ tenantId }),
    ]);
    await disconnectDatabase();
  });

  test('Oversell Prevention: 20 competing confirmations against 10 available units', async () => {
    // Create 20 draft orders of 1 unit each
    const orderIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const draft = await salesService.createDraftOrder(
        tenantId,
        {
          customerId,
          warehouseId,
          items: [{ productId, quantity: '1', unit: 'Piece', unitPricePaisa: '50000', discountPaisa: '0' }],
        },
        actorId
      );
      orderIds.push(draft._id.toString());
    }

    // Launch all 20 confirm requests simultaneously
    const results = await Promise.allSettled(
      orderIds.map((oid) =>
        salesService.confirmOrder(
          tenantId,
          oid,
          { expectedVersion: 1, idempotencyKey: `conc-idem-${oid}` },
          actorId
        )
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 10 must succeed, and exactly 10 must be rejected
    expect(succeeded.length).toBe(10);
    expect(rejected.length).toBe(10);

    // Verify stock balance invariant: onHand = 10, reserved = 10, available = 0
    const finalBalance = await StockBalance.findOne({
      tenantId,
      warehouseId,
      productId,
    });
    expect(finalBalance!.onHand).toBe(10);
    expect(finalBalance!.reserved).toBe(10);
    expect(finalBalance!.onHand - finalBalance!.reserved - finalBalance!.quarantined).toBe(0);
  });

  test('Idempotency Replay: 10 repeated identical requests produce 1 business effect', async () => {
    const idempotencyKey = `replay-test-key-${Date.now()}`;
    const payload = {
      customerId,
      amountPaisa: '50000',
      method: 'CASH',
      idempotencyKey,
    };

    // First request
    const firstRes = await request(app)
      .post('/api/v1/finance/collections')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)
      .expect(201);

    const firstReceiptId = firstRes.body.data.collection._id;

    // Repeat 5 times with exact same idempotency key
    for (let i = 0; i < 5; i++) {
      const repeatRes = await request(app)
        .post('/api/v1/finance/collections')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload)
        .expect(201);

      expect(repeatRes.body.data.collection._id).toBe(firstReceiptId);
    }

    // Only 1 document was created in DB
    const count = await PaymentCollection.countDocuments({
      tenantId,
      'receiptNumber': firstRes.body.data.collection.receiptNumber,
    });
    expect(count).toBe(1);
  });

  test('Idempotency Conflict: Same key with different payload returns 409 Conflict', async () => {
    const conflictKey = `conflict-key-${Date.now()}`;
    const initialPayload = {
      customerId,
      amountPaisa: '10000',
      method: 'CASH',
      idempotencyKey: conflictKey,
    };

    await request(app)
      .post('/api/v1/finance/collections')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', conflictKey)
      .send(initialPayload)
      .expect(201);

    // Same key, different amount
    const alteredPayload = {
      customerId,
      amountPaisa: '999999',
      method: 'CASH',
      idempotencyKey: conflictKey,
    };

    const conflictRes = await request(app)
      .post('/api/v1/finance/collections')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', conflictKey)
      .send(alteredPayload)
      .expect(409);

    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
  });

  test('Separation of Duties: Collector cannot verify their own collection', async () => {
    // Collector submits collection
    const sub = await financeService.submitCollection(
      tenantId,
      {
        customerId,
        amountPaisa: '15000',
        method: 'CASH' as any,
        idempotencyKey: `sep-idem-${Date.now()}`,
      },
      actorId // Collected by actorId
    );

    // Attempt verification with the same actorId
    await expect(
      financeService.verifyPayment(
        tenantId,
        sub.collection._id.toString(),
        { status: 'VERIFIED', idempotencyKey: `sep-verify-${Date.now()}` },
        actorId // Same actor attempts verification
      )
    ).rejects.toThrow('A collector cannot verify their own collection.');
  });
});
