import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { User, Organization, OrganizationMembership, Branch, Warehouse } from './models/index.js';
import { Role } from '@metriflow/contracts';
import { config } from '../config/index.js';

export async function seedDatabase() {
  await connectDatabase();
  console.log('[Seed] Seeding platform super admin and initial data...');

  // 1. Super Admin
  let superAdmin = await User.findOne({ email: config.SUPER_ADMIN_EMAIL });
  if (!superAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(config.SUPER_ADMIN_PASSWORD, salt);

    superAdmin = await User.create({
      email: config.SUPER_ADMIN_EMAIL,
      fullName: config.SUPER_ADMIN_NAME,
      passwordHash: hash,
      isSuperAdmin: true,
      emailVerified: true,
    });
    console.log(`[Seed] SuperAdmin created: ${config.SUPER_ADMIN_EMAIL}`);
  } else {
    console.log(`[Seed] SuperAdmin already exists: ${config.SUPER_ADMIN_EMAIL}`);
  }

  // 2. Default Seed Organization
  let demoOrg = await Organization.findOne({ slug: 'demo-wholesalers' });
  if (!demoOrg) {
    demoOrg = await Organization.create({
      name: 'Demo Wholesalers Karachi',
      slug: 'demo-wholesalers',
      city: 'Karachi',
      phone: '+923001234567',
      email: 'demo@metriflow.pk',
      maxUsers: 5,
      maxWarehouses: 2,
    });

    const branch = await Branch.create({
      tenantId: demoOrg._id,
      name: 'Main Market Branch',
      code: 'MM-KHI',
      city: 'Karachi',
      isDefault: true,
    });

    const warehouse = await Warehouse.create({
      tenantId: demoOrg._id,
      branchId: branch._id,
      name: 'Central Warehouse SITE',
      code: 'CWH-01',
      isDefault: true,
    });

    await OrganizationMembership.create({
      tenantId: demoOrg._id,
      userId: superAdmin._id,
      role: Role.OWNER_ADMIN,
      branchId: branch._id,
      warehouseId: warehouse._id,
      invitationStatus: 'ACCEPTED',
    });

    console.log('[Seed] Demo Wholesalers organization seeded.');
  }

  console.log('[Seed] Database seed completed successfully.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => disconnectDatabase())
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
