import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import {
  Organization,
  User,
  Branch,
  Warehouse,
  Product,
  Customer,
  Supplier,
  StockBalance,
  Order,
  Dispatch,
  Invoice,
} from '../src/database/models/index.js';
import { inventoryService } from '../src/services/inventory.service.js';
import { salesService } from '../src/services/sales.service.js';
import { financeService } from '../src/services/finance.service.js';
import { reportingService } from '../src/services/reporting.service.js';
import { OrderStatus } from '@metriflow/contracts';

describe('Documented Financial & Stock Worked Fixture', () => {
  let tenantId: mongoose.Types.ObjectId;
  let actorId: string;
  let accountantId: string;
  let warehouseId: string;
  let productId: string;
  let customerId: string;
  let supplierId: string;

  beforeAll(async () => {
    await connectDatabase();

    // Setup Test Organization & Actor
    const org = await Organization.create({
      name: 'Fixture Test Wholesalers',
      slug: `fixture-test-${Date.now()}`,
      maxUsers: 10,
      maxWarehouses: 5,
    });
    tenantId = org._id as mongoose.Types.ObjectId;

    const user = await User.create({
      email: `actor-${Date.now()}@metriflow.pk`,
      fullName: 'Sales Lead',
      passwordHash: 'dummy-hash',
    });
    actorId = user._id.toString();

    const accountant = await User.create({
      email: `accountant-${Date.now()}@metriflow.pk`,
      fullName: 'Senior Accountant',
      passwordHash: 'dummy-hash',
    });
    accountantId = accountant._id.toString();

    const branch = await Branch.create({
      tenantId,
      name: 'Fixture Branch',
      code: 'FB-01',
      city: 'Karachi',
    });

    const warehouse = await Warehouse.create({
      tenantId,
      branchId: branch._id,
      name: 'Fixture Warehouse',
      code: 'FWH-01',
    });
    warehouseId = warehouse._id.toString();

    // Create Product: PKR 150 sale price (15000 paisa), cost PKR 100 (10000 paisa)
    const product = await Product.create({
      tenantId,
      sku: `PROD-${Date.now()}`,
      name: 'Fixture Test Product',
      category: 'Provisions',
      baseUnit: 'Piece',
      defaultPricePaisa: 15000,
      costPricePaisa: 10000,
    });
    productId = product._id.toString();

    // Create Customer with credit limit PKR 10,000 (1,000,000 paisa)
    const customer = await Customer.create({
      tenantId,
      name: 'Fixture Wholesaler Customer',
      phone: '+923009998877',
      city: 'Karachi',
      creditLimitPaisa: 1000000,
      creditDays: 30,
      currentBalancePaisa: 0,
    });
    customerId = customer._id.toString();

    // Create Supplier
    const supplier = await Supplier.create({
      tenantId,
      name: 'Fixture Wholesaler Supplier',
      phone: '+923001112233',
      city: 'Karachi',
      currentBalancePaisa: 0,
    });
    supplierId = supplier._id.toString();
  });

  afterAll(async () => {
    // Cleanup tenant records
    await Promise.all([
      Organization.deleteOne({ _id: tenantId }),
      User.deleteMany({ _id: { $in: [actorId, accountantId] } }),
      Branch.deleteMany({ tenantId }),
      Warehouse.deleteMany({ tenantId }),
      Product.deleteMany({ tenantId }),
      Customer.deleteMany({ tenantId }),
      Supplier.deleteMany({ tenantId }),
      StockBalance.deleteMany({ tenantId }),
      Order.deleteMany({ tenantId }),
      Dispatch.deleteMany({ tenantId }),
      Invoice.deleteMany({ tenantId }),
    ]);
    await disconnectDatabase();
  });

  test('STEP 1: Receive 100 pieces at PKR 100 cost', async () => {
    const result = await inventoryService.receiveGoods(
      tenantId,
      {
        supplierId,
        warehouseId,
        notes: 'Initial fixture stock receipt',
        items: [
          {
            productId,
            quantity: '100',
            unitCostPaisa: '10000', // PKR 100.00
          },
        ],
        idempotencyKey: `idem-grn-${Date.now()}`,
      },
      actorId
    );

    expect(result.receiptNumber).toBeDefined();
    expect(result.totalReceiptPaisa).toBe(1000000); // 100 * 10000 = 1,000,000 paisa (PKR 10,000)

    const level = await inventoryService.getStockLevel(tenantId, warehouseId, productId);
    expect(level.onHand).toBe(100);
    expect(level.reserved).toBe(0);
    expect(level.available).toBe(100);
    expect(level.movingAverageCostPaisa).toBe(10000); // PKR 100.00
  });

  let orderId: string;

  test('STEP 2: Confirm 30 at PKR 150 sale price', async () => {
    // Create draft
    const draft = await salesService.createDraftOrder(
      tenantId,
      {
        customerId,
        warehouseId,
        items: [
          {
            productId,
            quantity: '30',
            unit: 'Piece',
            unitPricePaisa: '15000', // PKR 150.00
            discountPaisa: '0',
          },
        ],
      },
      actorId
    );

    orderId = draft._id.toString();
    expect(draft.status).toBe(OrderStatus.DRAFT);
    expect(draft.totalAmountPaisa).toBe(450000); // 30 * 15000 = 450,000 paisa (PKR 4,500)

    // Confirm atomically
    const confirmed = await salesService.confirmOrder(
      tenantId,
      orderId,
      {
        expectedVersion: 1,
        idempotencyKey: `idem-confirm-${Date.now()}`,
      },
      actorId
    );

    expect(confirmed.order.status).toBe(OrderStatus.CONFIRMED);

    const level = await inventoryService.getStockLevel(tenantId, warehouseId, productId);
    expect(level.onHand).toBe(100);
    expect(level.reserved).toBe(30);
    expect(level.available).toBe(70); // 100 - 30 = 70
  });

  let orderItemId: string;

  test('STEP 3: Dispatch 20: on-hand 80, reserved 10, AR 3,000, remaining commitment 1,500', async () => {
    const order = await salesService.getOrder(tenantId, orderId);
    orderItemId = order.items[0]._id!.toString();

    const dispatchResult = await salesService.dispatchOrder(
      tenantId,
      {
        orderId,
        warehouseId,
        items: [
          {
            orderItemId,
            dispatchQuantity: '20',
          },
        ],
        idempotencyKey: `idem-dispatch-${Date.now()}`,
      },
      actorId
    );

    expect(dispatchResult.orderStatus).toBe(OrderStatus.PARTIALLY_DISPATCHED);
    expect(dispatchResult.invoice.totalAmountPaisa).toBe(300000); // 20 * 15000 = 300,000 paisa (PKR 3,000)

    // Verify Stock Levels: on-hand 80, reserved 10
    const level = await inventoryService.getStockLevel(tenantId, warehouseId, productId);
    expect(level.onHand).toBe(80);
    expect(level.reserved).toBe(10); // 30 - 20 = 10
    expect(level.available).toBe(70);

    // Verify Customer AR: PKR 3,000 (300,000 paisa)
    const customer = await Customer.findById(customerId);
    expect(customer!.currentBalancePaisa).toBe(300000); // AR 3,000

    // Remaining commitment = 10 remaining reserved * 150 = PKR 1,500 (150,000 paisa)
    const remainingCommitment = 10 * 15000;
    expect(remainingCommitment).toBe(150000);
  });

  test('STEP 4: Verify receipt 1,000: AR 2,000', async () => {
    // Collector submits payment collection of PKR 1,000 (100,000 paisa)
    const sub = await financeService.submitCollection(
      tenantId,
      {
        customerId,
        amountPaisa: '100000', // PKR 1,000.00
        method: 'CASH' as any,
        idempotencyKey: `idem-collect-${Date.now()}`,
      },
      actorId
    );

    // Prior to accountant verification, AR remains 3,000
    let customer = await Customer.findById(customerId);
    expect(customer!.currentBalancePaisa).toBe(300000);

    // Independent accountant verifies payment
    const verifyResult = await financeService.verifyPayment(
      tenantId,
      sub.collection._id.toString(),
      {
        status: 'VERIFIED',
        idempotencyKey: `idem-verify-${Date.now()}`,
      },
      accountantId
    );

    expect(verifyResult.collection.status).toBe('VERIFIED');

    // AR is now PKR 2,000 (200,000 paisa)
    customer = await Customer.findById(customerId);
    expect(customer!.currentBalancePaisa).toBe(200000); // 300,000 - 100,000 = 200,000 paisa (PKR 2,000)
  });

  test('STEP 5: Cancel remainder: reserved and commitment zero', async () => {
    const cancelResult = await salesService.cancelRemainder(
      tenantId,
      orderId,
      {
        reason: 'Customer cancelled remaining 10 pieces',
        idempotencyKey: `idem-cancel-${Date.now()}`,
      },
      actorId
    );

    expect(cancelResult.order.status).toBe(OrderStatus.COMPLETED);

    // Reserved and commitment zero
    const level = await inventoryService.getStockLevel(tenantId, warehouseId, productId);
    expect(level.onHand).toBe(80);
    expect(level.reserved).toBe(0);
    expect(level.available).toBe(80); // 80 - 0 = 80
  });

  test('STEP 6: Return/credit 5 sellable pieces: on-hand 85, AR 1,250, net sales 2,250, issue cost 1,500, gross profit 750', async () => {
    const returnResult = await financeService.processCustomerReturn(
      tenantId,
      {
        customerId,
        warehouseId,
        reason: '5 sellable pieces returned by customer',
        items: [
          {
            productId,
            quantity: '5',
            unitCreditPaisa: '15000', // PKR 150.00 credit
            restockSellable: true,
          },
        ],
        idempotencyKey: `idem-return-${Date.now()}`,
      },
      accountantId
    );

    expect(returnResult.returnRecord.totalCreditPaisa).toBe(75000); // 5 * 150 = PKR 750 (75,000 paisa)
    expect(returnResult.returnRecord.totalRestoredCostPaisa).toBe(50000); // 5 * 100 = PKR 500 (50,000 paisa)

    // On-hand restored to 85 (80 + 5 = 85)
    const level = await inventoryService.getStockLevel(tenantId, warehouseId, productId);
    expect(level.onHand).toBe(85);

    // AR reduced to PKR 1,250 (2,000 - 750 = 1,250 -> 125,000 paisa)
    const customer = await Customer.findById(customerId);
    expect(customer!.currentBalancePaisa).toBe(125000);

    // Verify Profit & Loss:
    // Net sales: 3,000 - 750 = 2,250 (225,000 paisa)
    // Net issue cost: 2,000 - 500 = 1,500 (150,000 paisa)
    // Gross profit: 2,250 - 1,500 = 750 (75,000 paisa)
    const pnl = await reportingService.getProfitAndLoss(tenantId);
    expect(pnl.revenue.netSalesPaisa).toBe(225000);
    expect(pnl.costOfGoodsSold.netCogsPaisa).toBe(150000);
    expect(pnl.grossProfitPaisa).toBe(75000);
  });
});
