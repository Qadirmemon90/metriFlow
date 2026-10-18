import crypto from 'crypto';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import {
  Product,
  Customer,
  Supplier,
  StockBalance,
  Order,
  Invoice,
  Dispatch,
  PaymentCollection,
  Organization,
  User,
  OrganizationMembership,
} from '../src/database/models/index.js';
import { Role } from '@metriflow/contracts';

const app = createApp();

describe('End-to-End Browser-to-Database Wholesale Lifecycle', () => {
  let ownerToken: string;
  let accountantToken: string;
  let organizationId: string;
  let branchId: string;
  let warehouseId: string;
  let customerId: string;
  let supplierId: string;
  let productId: string;
  let orderId: string;
  let orderItemId: string;
  let invoiceId: string;
  let dispatchId: string;
  let collectionId: string;

  const ownerEmail = `e2e-owner-${Date.now()}@metriflow.pk`;
  const accountantEmail = `e2e-accountant-${Date.now()}@metriflow.pk`;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('STEP 1: Public Contact / Demo Inquiry Submission', async () => {
    const res = await request(app)
      .post('/api/v1/public/contact')
      .send({
        fullName: 'Haji Asad',
        companyName: 'Asad Wholesale Karachi',
        email: 'asad@asadwholesale.pk',
        phone: '+92 300 9876543',
        city: 'Karachi',
        message: 'Need wholesale inventory and khata migration from paper.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('STEP 2: Organization Signup & Owner Initialization', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        organizationName: 'Asad Wholesale Hardware',
        fullName: 'Haji Asad Ullah',
        email: ownerEmail,
        password: 'Password123!',
        phone: '+92 300 9876543',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.sessionToken).toBeDefined();
    ownerToken = res.body.data.sessionToken;
    organizationId = res.body.data.user.orgId;

    // Retrieve default branch & warehouse
    const branchRes = await request(app)
      .get('/api/v1/master-data/branches')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(branchRes.status).toBe(200);
    expect(branchRes.body.data.length).toBeGreaterThan(0);
    branchId = branchRes.body.data[0]._id;

    const whRes = await request(app)
      .get('/api/v1/master-data/warehouses')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(whRes.status).toBe(200);
    expect(whRes.body.data.length).toBeGreaterThan(0);
    warehouseId = whRes.body.data[0]._id;
  });

  it('STEP 3: Register Independent Accountant for Maker-Checker Verification', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        organizationName: 'Accountant Firm Org',
        fullName: 'Muneeb Accountant',
        email: accountantEmail,
        password: 'Password123!',
        phone: '+92 301 1122334',
      });

    expect(res.status).toBe(201);
    const accUser = await User.findOne({ email: accountantEmail });
    expect(accUser).toBeDefined();

    // Create membership in Asad Wholesale as ACCOUNTANT
    const accountantMembership = await OrganizationMembership.create({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      userId: accUser!._id,
      role: Role.ACCOUNTANT,
      branchId: new mongoose.Types.ObjectId(branchId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      invitationStatus: 'ACCEPTED',
      isActive: true,
    });

    // Create a session for accountant in Asad Wholesale
    const rawAccToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawAccToken).digest('hex');

    const Session = mongoose.model('Session');
    await Session.create({
      sessionTokenHash: tokenHash,
      userId: accUser!._id,
      tenantId: new mongoose.Types.ObjectId(organizationId),
      membershipId: accountantMembership._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    accountantToken = rawAccToken;
  });

  it('STEP 4: Master Data Setup — Products, Customers & Suppliers', async () => {
    // 1. Create Product: PKR 150 price ('15000'), cost PKR 100 ('10000')
    const prodRes = await request(app)
      .post('/api/v1/master-data/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        sku: 'SKU-BOLT-10MM',
        name: 'Hex Bolt Steel 10mm',
        category: 'Fasteners',
        baseUnit: 'Piece',
        defaultPricePaisa: '15000',
        costPricePaisa: '10000',
      });

    expect(prodRes.status).toBe(201);
    productId = prodRes.body.data._id;

    // 2. Create Customer with credit limit PKR 500,000 ('50000000')
    const custRes = await request(app)
      .post('/api/v1/master-data/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Al-Madina Hardware Badami Bagh',
        phone: '+92 321 4455667',
        city: 'Lahore',
        creditLimitPaisa: '50000000',
        creditDays: 30,
      });

    expect(custRes.status).toBe(201);
    customerId = custRes.body.data._id;

    // 3. Create Supplier
    const suppRes = await request(app)
      .post('/api/v1/master-data/suppliers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pakistan Steel Mills',
        phone: '+92 21 34567890',
        city: 'Karachi',
      });

    expect(suppRes.status).toBe(201);
    supplierId = suppRes.body.data._id;
  });

  it('STEP 5: Goods Receipt Note (GRN) — Receive 100 units at PKR 100 Cost', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/receive')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-grn-${Date.now()}`)
      .send({
        supplierId,
        warehouseId,
        items: [
          {
            productId,
            quantity: '100',
            unitCostPaisa: '10000',
          },
        ],
        idempotencyKey: `idem-grn-${Date.now()}`,
      });

    expect(res.status).toBe(201);

    // Verify stock balance: on-hand 100, available 100, WAC 100
    const bal = await StockBalance.findOne({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    expect(bal?.onHand).toBe(100);
    expect(bal!.onHand - bal!.reserved - bal!.quarantined).toBe(100);
    expect(bal?.movingAverageCostPaisa).toBe(10000);
  });

  it('STEP 6: Create & Confirm Wholesale Order (Atomic Stock Reservation)', async () => {
    // 1. Create draft order for 30 units @ PKR 150
    const createRes = await request(app)
      .post('/api/v1/orders/draft')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        customerId,
        warehouseId,
        items: [
          {
            productId,
            quantity: '30',
            unitPricePaisa: '15000',
          },
        ],
      });

    expect(createRes.status).toBe(201);
    orderId = createRes.body.data._id;
    orderItemId = createRes.body.data.items[0]._id;
    expect(createRes.body.data.status).toBe('DRAFT');

    // 2. Confirm order
    const confirmRes = await request(app)
      .post(`/api/v1/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-conf-${Date.now()}`)
      .send({
        expectedVersion: 1,
        idempotencyKey: `idem-conf-${Date.now()}`,
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.order.status).toBe('CONFIRMED');

    // Verify stock balance: on-hand 100, reserved 30, available 70
    const bal = await StockBalance.findOne({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    expect(bal?.onHand).toBe(100);
    expect(bal?.reserved).toBe(30);
    expect(bal!.onHand - bal!.reserved - bal!.quarantined).toBe(70);
  });

  it('STEP 7: Partial Dispatch & Invoice Generation — Ship 20 units', async () => {
    const dispatchRes = await request(app)
      .post('/api/v1/orders/dispatch')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-disp-${Date.now()}`)
      .send({
        orderId,
        warehouseId,
        items: [
          {
            orderItemId,
            dispatchQuantity: '20',
          },
        ],
        vehicleNumber: 'LES-20-4912',
        driverName: 'Muhammad Aslam',
        idempotencyKey: `idem-disp-${Date.now()}`,
      });

    expect(dispatchRes.status).toBe(201);
    dispatchId = dispatchRes.body.data.dispatch._id;
    invoiceId = dispatchRes.body.data.invoice._id;

    // Verify Stock: on-hand 80, reserved 10, available 70
    const bal = await StockBalance.findOne({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    expect(bal?.onHand).toBe(80);
    expect(bal?.reserved).toBe(10);
    expect(bal!.onHand - bal!.reserved - bal!.quarantined).toBe(70);

    // Verify Customer AR: PKR 3,000.00 (300,000 paisa)
    const cust = await Customer.findById(customerId);
    expect(cust?.currentBalancePaisa).toBe(300000);
  });

  it('STEP 8: Driver Delivery Runs & Proof of Delivery (POD) Capture', async () => {
    const deliveriesRes = await request(app)
      .get('/api/v1/field/deliveries')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(deliveriesRes.status).toBe(200);
    expect(deliveriesRes.body.data.length).toBeGreaterThan(0);
    const taskId = deliveriesRes.body.data[0]._id;

    const podRes = await request(app)
      .post(`/api/v1/field/deliveries/${taskId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-pod-${Date.now()}`)
      .send({
        recipientName: 'Tariq Mehmood (Stamp Received)',
        notes: 'Delivered in full',
        collectedAmountPaisa: '0',
        idempotencyKey: `idem-pod-${Date.now()}`,
      });

    expect(podRes.status).toBe(200);
    expect(podRes.body.data.task.status).toBe('DELIVERED');
  });

  it('STEP 9: Payment Collection & Maker-Checker Separation of Duties', async () => {
    // 1. Owner submits collection of PKR 1,000 (100,000 paisa)
    const collectRes = await request(app)
      .post('/api/v1/finance/collections')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-col-${Date.now()}`)
      .send({
        customerId,
        amountPaisa: '100000',
        method: 'CHEQUE',
        referenceNumber: 'CHQ-98124',
        idempotencyKey: `idem-col-${Date.now()}`,
      });

    expect(collectRes.status).toBe(201);
    collectionId = collectRes.body.data.collection._id;

    // 2. Owner attempts to verify own collection -> REJECTED (Separation of Duties)
    const selfVerifyRes = await request(app)
      .post(`/api/v1/finance/collections/${collectionId}/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-v-self-${Date.now()}`)
      .send({
        status: 'VERIFIED',
        idempotencyKey: `idem-v-self-${Date.now()}`,
      });

    expect([400, 403]).toContain(selfVerifyRes.status);

    // 3. Independent Accountant verifies collection -> SUCCESS
    const verifyRes = await request(app)
      .post(`/api/v1/finance/collections/${collectionId}/verify`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .set('Idempotency-Key', `idem-v-acc-${Date.now()}`)
      .send({
        status: 'VERIFIED',
        idempotencyKey: `idem-v-acc-${Date.now()}`,
      });

    expect(verifyRes.status).toBe(200);

    // Customer balance reduced from 3,000 to 2,000
    const cust = await Customer.findById(customerId);
    expect(cust?.currentBalancePaisa).toBe(200000);
  });

  it('STEP 10: Cancel Remainder of Order — Releases Reservations Cleanly', async () => {
    const cancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel-remainder`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-can-${Date.now()}`)
      .send({
        reason: 'Customer cancelled remaining 10 units',
        idempotencyKey: `idem-can-${Date.now()}`,
      });

    expect(cancelRes.status).toBe(200);

    // Stock state: on-hand 80, reserved 0, available 80
    const bal = await StockBalance.findOne({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    expect(bal?.onHand).toBe(80);
    expect(bal?.reserved).toBe(0);
    expect(bal!.onHand - bal!.reserved - bal!.quarantined).toBe(80);
  });

  it('STEP 11: Customer Return (Sellable) — Restocks at WAC & Credits Khata', async () => {
    const returnRes = await request(app)
      .post('/api/v1/finance/returns')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', `idem-ret-${Date.now()}`)
      .send({
        customerId,
        warehouseId,
        originalInvoiceId: invoiceId,
        reason: 'Customer returned excess units',
        items: [
          {
            productId,
            quantity: '5',
            unitCreditPaisa: '15000',
            restockSellable: true,
          },
        ],
        idempotencyKey: `idem-ret-${Date.now()}`,
      });

    expect(returnRes.status).toBe(201);

    // Stock on-hand restores from 80 to 85
    const bal = await StockBalance.findOne({
      tenantId: new mongoose.Types.ObjectId(organizationId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    expect(bal?.onHand).toBe(85);
    expect(bal!.onHand - bal!.reserved - bal!.quarantined).toBe(85);

    // Customer balance reduced from 2,000 to 1,250 (credited 5 @ 150 = 750)
    const cust = await Customer.findById(customerId);
    expect(cust?.currentBalancePaisa).toBe(125000);
  });

  it('STEP 12: Deterministic Profit & Loss and Customer Khata Reports', async () => {
    // 1. Profit & Loss report
    const reportRes = await request(app)
      .get('/api/v1/reports/profit-and-loss')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(reportRes.status).toBe(200);
    const report = reportRes.body.data;

    // Invoiced 20 @ 150 = 3,000; Returned 5 @ 150 = 750 => Net Sales = 2,250
    expect(report.revenue.netSalesPaisa).toBe(225000);
    // Issue cost: (20 - 5) @ 100 = 1,500
    expect(report.costOfGoodsSold.netCogsPaisa).toBe(150000);
    // Gross Profit: 2,250 - 1,500 = 750
    expect(report.grossProfitPaisa).toBe(75000);

    // 2. Customer Khata statement
    const khataRes = await request(app)
      .get(`/api/v1/reports/khata/${customerId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(khataRes.status).toBe(200);
    expect(khataRes.body.data.customer.currentBalancePaisa).toBe(125000);
    expect(khataRes.body.data.transactions.length).toBeGreaterThan(0);
  });
});
