/**
 * MetriFlow Roles and Permissions Matrix
 */

export enum Role {
  OWNER_ADMIN = 'OWNER_ADMIN',
  SALES_DESK = 'SALES_DESK',
  ACCOUNTANT = 'ACCOUNTANT',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
  FIELD_SALESMAN = 'FIELD_SALESMAN',
  DELIVERY_STAFF = 'DELIVERY_STAFF',
  PLATFORM_SUPER_ADMIN = 'PLATFORM_SUPER_ADMIN',
}

export enum Permission {
  // Organization & Team
  ORG_SETTINGS_READ = 'ORG_SETTINGS_READ',
  ORG_SETTINGS_UPDATE = 'ORG_SETTINGS_UPDATE',
  TEAM_MANAGE = 'TEAM_MANAGE',
  AUDIT_LOG_READ = 'AUDIT_LOG_READ',

  // Master Data
  CATALOG_READ = 'CATALOG_READ',
  CATALOG_MANAGE = 'CATALOG_MANAGE',
  CUSTOMER_READ = 'CUSTOMER_READ',
  CUSTOMER_MANAGE = 'CUSTOMER_MANAGE',
  SUPPLIER_READ = 'SUPPLIER_READ',
  SUPPLIER_MANAGE = 'SUPPLIER_MANAGE',
  IMPORT_EXECUTE = 'IMPORT_EXECUTE',

  // Inventory & Warehousing
  INVENTORY_READ = 'INVENTORY_READ',
  GOODS_RECEIPT = 'GOODS_RECEIPT',
  STOCK_ADJUST = 'STOCK_ADJUST',

  // Sales Orders & Invoicing
  ORDER_READ = 'ORDER_READ',
  ORDER_CREATE_DRAFT = 'ORDER_CREATE_DRAFT',
  ORDER_CONFIRM = 'ORDER_CONFIRM',
  ORDER_DISPATCH = 'ORDER_DISPATCH',
  ORDER_CANCEL = 'ORDER_CANCEL',
  INVOICE_READ = 'INVOICE_READ',

  // Financials & Khata
  PAYMENT_COLLECT = 'PAYMENT_COLLECT', // Submit collection evidence
  PAYMENT_VERIFY = 'PAYMENT_VERIFY',   // Independent accountant verification
  LEDGER_READ = 'LEDGER_READ',
  RETURN_PROCESS = 'RETURN_PROCESS',
  EXPENSE_MANAGE = 'EXPENSE_MANAGE',
  REPORT_VIEW = 'REPORT_VIEW',

  // Field & Deliveries
  FIELD_ACTIVITIES = 'FIELD_ACTIVITIES',
  DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED',
  POD_CAPTURE = 'POD_CAPTURE',

  // Integrations & AI
  WHATSAPP_MANAGE = 'WHATSAPP_MANAGE',
  WHATSAPP_CHAT = 'WHATSAPP_CHAT',
  AI_DRAFT_REVIEW = 'AI_DRAFT_REVIEW',

  // Platform Administration
  PLATFORM_MANAGE = 'PLATFORM_MANAGE',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER_ADMIN]: [
    Permission.ORG_SETTINGS_READ,
    Permission.ORG_SETTINGS_UPDATE,
    Permission.TEAM_MANAGE,
    Permission.AUDIT_LOG_READ,
    Permission.CATALOG_READ,
    Permission.CATALOG_MANAGE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_MANAGE,
    Permission.SUPPLIER_READ,
    Permission.SUPPLIER_MANAGE,
    Permission.IMPORT_EXECUTE,
    Permission.INVENTORY_READ,
    Permission.GOODS_RECEIPT,
    Permission.STOCK_ADJUST,
    Permission.ORDER_READ,
    Permission.ORDER_CREATE_DRAFT,
    Permission.ORDER_CONFIRM,
    Permission.ORDER_DISPATCH,
    Permission.ORDER_CANCEL,
    Permission.INVOICE_READ,
    Permission.PAYMENT_COLLECT,
    Permission.PAYMENT_VERIFY,
    Permission.LEDGER_READ,
    Permission.RETURN_PROCESS,
    Permission.EXPENSE_MANAGE,
    Permission.REPORT_VIEW,
    Permission.FIELD_ACTIVITIES,
    Permission.DELIVERY_ASSIGNED,
    Permission.POD_CAPTURE,
    Permission.WHATSAPP_MANAGE,
    Permission.WHATSAPP_CHAT,
    Permission.AI_DRAFT_REVIEW,
  ],
  [Role.SALES_DESK]: [
    Permission.CATALOG_READ,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_MANAGE,
    Permission.INVENTORY_READ,
    Permission.ORDER_READ,
    Permission.ORDER_CREATE_DRAFT,
    Permission.ORDER_CONFIRM,
    Permission.INVOICE_READ,
    Permission.PAYMENT_COLLECT,
    Permission.WHATSAPP_CHAT,
    Permission.AI_DRAFT_REVIEW,
  ],
  [Role.ACCOUNTANT]: [
    Permission.CATALOG_READ,
    Permission.CUSTOMER_READ,
    Permission.SUPPLIER_READ,
    Permission.SUPPLIER_MANAGE,
    Permission.INVENTORY_READ,
    Permission.ORDER_READ,
    Permission.INVOICE_READ,
    Permission.PAYMENT_VERIFY,
    Permission.LEDGER_READ,
    Permission.RETURN_PROCESS,
    Permission.EXPENSE_MANAGE,
    Permission.REPORT_VIEW,
  ],
  [Role.WAREHOUSE_STAFF]: [
    Permission.CATALOG_READ,
    Permission.INVENTORY_READ,
    Permission.GOODS_RECEIPT,
    Permission.STOCK_ADJUST,
    Permission.ORDER_READ,
    Permission.ORDER_DISPATCH,
    Permission.RETURN_PROCESS,
  ],
  [Role.FIELD_SALESMAN]: [
    Permission.CATALOG_READ,
    Permission.CUSTOMER_READ,
    Permission.ORDER_CREATE_DRAFT,
    Permission.ORDER_READ,
    Permission.PAYMENT_COLLECT,
    Permission.FIELD_ACTIVITIES,
  ],
  [Role.DELIVERY_STAFF]: [
    Permission.ORDER_READ,
    Permission.DELIVERY_ASSIGNED,
    Permission.POD_CAPTURE,
    Permission.PAYMENT_COLLECT,
  ],
  [Role.PLATFORM_SUPER_ADMIN]: [
    Permission.PLATFORM_MANAGE,
  ],
};

export interface AssignmentScope {
  branchId?: string;
  warehouseId?: string;
  assignedSalesmanId?: string;
}
