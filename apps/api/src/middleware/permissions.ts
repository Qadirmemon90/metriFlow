import { Request, Response, NextFunction } from 'express';
import { Permission, ROLE_PERMISSIONS } from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required.'));
    }

    const userRole = req.user.role;
    const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasAll = permissions.every((perm) => allowedPermissions.includes(perm));
    if (!hasAll) {
      return next(
        AppError.forbidden(
          `Access denied. Role ${userRole} lacks required permission(s): ${permissions.join(', ')}`
        )
      );
    }

    // Assignment scope check: if user is restricted to a branch or warehouse
    if (req.user.warehouseId) {
      const requestedWarehouseId = req.body?.warehouseId || req.query?.warehouseId || req.params?.warehouseId;
      if (requestedWarehouseId && requestedWarehouseId !== req.user.warehouseId) {
        return next(
          AppError.forbidden(
            `Access denied. You are restricted to warehouse ${req.user.warehouseId} and cannot operate on warehouse ${requestedWarehouseId}.`
          )
        );
      }
    }

    if (req.user.branchId) {
      const requestedBranchId = req.body?.branchId || req.query?.branchId || req.params?.branchId;
      if (requestedBranchId && requestedBranchId !== req.user.branchId) {
        return next(
          AppError.forbidden(
            `Access denied. You are restricted to branch ${req.user.branchId} and cannot operate on branch ${requestedBranchId}.`
          )
        );
      }
    }

    next();
  };
}
