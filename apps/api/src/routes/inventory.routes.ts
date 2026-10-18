import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.post(
  '/receive',
  requirePermission(Permission.GOODS_RECEIPT),
  requireIdempotency(),
  (req, res, next) => inventoryController.receiveGoods(req, res, next)
);

router.post(
  '/adjust',
  requirePermission(Permission.STOCK_ADJUST),
  requireIdempotency(),
  (req, res, next) => inventoryController.adjustStock(req, res, next)
);

router.get(
  '/levels/:warehouseId/:productId',
  requirePermission(Permission.INVENTORY_READ),
  (req, res, next) => inventoryController.getStockLevel(req, res, next)
);

export const inventoryRoutes = router;
