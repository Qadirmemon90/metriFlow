import mongoose from 'mongoose';
import request from 'supertest';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { createApp } from '../src/app.js';
import {
  Organization,
  User,
  OrganizationMembership,
  Session,
  Product,
  Customer,
} from '../src/database/models/index.js';
import { Role } from '@metriflow/contracts';
import crypto from 'crypto';

describe('Strict Two-Company Tenant Isolation', () => {
  let app: any;
  let tenantAId: mongoose.Types.ObjectId;
  let tenantBId: mongoose.Types.ObjectId;
  let tokenA: string;
  let tokenB: string;
  let productBId: string;
  let customerBId: string;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    // 1. Company A Setup
    const orgA = await Organization.create({
      name: 'Company Alpha Wholesalers',
      slug: `company-a-${Date.now()}`,
    });
    tenantAId = orgA._id as mongoose.Types.ObjectId;

    const userA = await User.create({
      email: `user-a-${Date.now()}@alpha.pk`,
      fullName: 'Alpha Admin',
      passwordHash: 'dummy',
    });

    const memA = await OrganizationMembership.create({
      tenantId: tenantAId,
      userId: userA._id,
      role: Role.OWNER_ADMIN,
      invitationStatus: 'ACCEPTED',
    });

    tokenA = crypto.randomBytes(32).toString('hex');
    await Session.create({
      sessionTokenHash: crypto.createHash('sha256').update(tokenA).digest('hex'),
      userId: userA._id,
      tenantId: tenantAId,
      membershipId: memA._id,
      expiresAt: new Date(Date.now() + 3600000),
    });

    // 2. Company B Setup
    const orgB = await Organization.create({
      name: 'Company Beta Wholesalers',
      slug: `company-b-${Date.now()}`,
    });
    tenantBId = orgB._id as mongoose.Types.ObjectId;

    const userB = await User.create({
      email: `user-b-${Date.now()}@beta.pk`,
      fullName: 'Beta Admin',
      passwordHash: 'dummy',
    });

    const memB = await OrganizationMembership.create({
      tenantId: tenantBId,
      userId: userB._id,
      role: Role.OWNER_ADMIN,
      invitationStatus: 'ACCEPTED',
    });

    tokenB = crypto.randomBytes(32).toString('hex');
    await Session.create({
      sessionTokenHash: crypto.createHash('sha256').update(tokenB).digest('hex'),
      userId: userB._id,
      tenantId: tenantBId,
      membershipId: memB._id,
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Create Company B records
    const prodB = await Product.create({
      tenantId: tenantBId,
      sku: 'SKU-BETA-CONFIDENTIAL',
      name: 'Secret Beta Formula',
      category: 'Special',
      defaultPricePaisa: 99900,
    });
    productBId = prodB._id.toString();

    const custB = await Customer.create({
      tenantId: tenantBId,
      name: 'Confidential Beta Client',
      phone: '+923000000000',
      city: 'Lahore',
    });
    customerBId = custB._id.toString();
  });

  afterAll(async () => {
    await Promise.all([
      Organization.deleteMany({ _id: { $in: [tenantAId, tenantBId] } }),
      Product.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Customer.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Session.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
    ]);
    await disconnectDatabase();
  });

  test('Company A cannot see Company B products in catalog list', async () => {
    const res = await request(app)
      .get('/api/v1/master-data/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const items = res.body.data.items;
    const foundBeta = items.some((p: any) => p.sku === 'SKU-BETA-CONFIDENTIAL');
    expect(foundBeta).toBe(false);
  });

  test('Company A cannot see Company B customers in customer list', async () => {
    const res = await request(app)
      .get('/api/v1/master-data/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const items = res.body.data.items;
    const foundBeta = items.some((c: any) => c.name === 'Confidential Beta Client');
    expect(foundBeta).toBe(false);
  });

  test('Company A cannot archive or mutate Company B product by ID', async () => {
    const res = await request(app)
      .delete(`/api/v1/master-data/products/${productBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('Company A cannot access Company B private storage files', async () => {
    const res = await request(app)
      .get(`/api/v1/storage/presigned-download?key=tenants/${tenantBId}/invoices/confidential.pdf`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
