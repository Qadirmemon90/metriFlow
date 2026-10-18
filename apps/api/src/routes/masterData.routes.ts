import { Router } from 'express';
import { masterDataController } from '../controllers/masterData.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

// Branches & Warehouses
router.post(
  '/branches',
  requirePermission(Permission.ORG_SETTINGS_UPDATE),
  (req, res, next) => masterDataController.createBranch(req, res, next)
);
router.get(
  '/branches',
  requirePermission(Permission.CATALOG_READ),
  (req, res, next) => masterDataController.listBranches(req, res, next)
);

router.post(
  '/warehouses',
  requirePermission(Permission.ORG_SETTINGS_UPDATE),
  (req, res, next) => masterDataController.createWarehouse(req, res, next)
);
router.get(
  '/warehouses',
  requirePermission(Permission.CATALOG_READ),
  (req, res, next) => masterDataController.listWarehouses(req, res, next)
);

// Products
router.post(
  '/products',
  requirePermission(Permission.CATALOG_MANAGE),
  (req, res, next) => masterDataController.createProduct(req, res, next)
);
router.get(
  '/products',
  requirePermission(Permission.CATALOG_READ),
  (req, res, next) => masterDataController.listProducts(req, res, next)
);
router.delete(
  '/products/:id',
  requirePermission(Permission.CATALOG_MANAGE),
  (req, res, next) => masterDataController.archiveProduct(req, res, next)
);

// Customers
router.post(
  '/customers',
  requirePermission(Permission.CUSTOMER_MANAGE),
  (req, res, next) => masterDataController.createCustomer(req, res, next)
);
router.get(
  '/customers',
  requirePermission(Permission.CUSTOMER_READ),
  (req, res, next) => masterDataController.listCustomers(req, res, next)
);
router.delete(
  '/customers/:id',
  requirePermission(Permission.CUSTOMER_MANAGE),
  (req, res, next) => masterDataController.archiveCustomer(req, res, next)
);

// Suppliers
router.post(
  '/suppliers',
  requirePermission(Permission.SUPPLIER_MANAGE),
  (req, res, next) => masterDataController.createSupplier(req, res, next)
);
router.get(
  '/suppliers',
  requirePermission(Permission.SUPPLIER_READ),
  (req, res, next) => masterDataController.listSuppliers(req, res, next)
);

// CSV Import
router.post(
  '/imports/preview',
  requirePermission(Permission.IMPORT_EXECUTE),
  (req, res, next) => masterDataController.previewImport(req, res, next)
);

export const masterDataRoutes = router;
