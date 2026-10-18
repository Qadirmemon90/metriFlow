import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Session, User, OrganizationMembership, Organization, IUser, IOrganizationMembership, IOrganization } from '../database/models/index.js';
import { AppError } from '../utils/errors.js';
import { AuthenticatedUser } from '@metriflow/contracts';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionDoc?: any;
      tenantId?: mongoose.Types.ObjectId;
      membership?: IOrganizationMembership;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let rawToken = req.cookies?.metriflow_session;
    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.substring(7);
    }

    if (!rawToken) {
      throw AppError.unauthorized('Authentication required. No session token provided.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await Session.findOne({
      sessionTokenHash: tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw AppError.unauthorized('Invalid, expired or revoked session.');
    }

    const [user, membership, org] = await Promise.all([
      User.findById(session.userId),
      OrganizationMembership.findById(session.membershipId),
      Organization.findById(session.tenantId),
    ]);

    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account not found or deactivated.');
    }

    if (!membership || !membership.isActive || membership.invitationStatus !== 'ACCEPTED') {
      throw AppError.unauthorized('Tenant membership is inactive or pending.');
    }

    if (!org || !org.isActive) {
      throw AppError.forbidden('Tenant organization is deactivated.');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: membership.role,
      orgId: org._id.toString(),
      orgName: org.name,
      branchId: membership.branchId?.toString(),
      warehouseId: membership.warehouseId?.toString(),
      isSuperAdmin: user.isSuperAdmin,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
    };

    req.tenantId = org._id as mongoose.Types.ObjectId;
    req.membership = membership;
    req.sessionDoc = session;

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let rawToken = req.cookies?.metriflow_session;
    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.substring(7);
    }

    if (!rawToken) {
      throw AppError.unauthorized('SuperAdmin authentication required.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await Session.findOne({
      sessionTokenHash: tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw AppError.unauthorized('Invalid or expired session.');
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive || !user.isSuperAdmin) {
      throw AppError.forbidden('Platform SuperAdmin privileges required.');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: 'PLATFORM_SUPER_ADMIN' as any,
      orgId: session.tenantId.toString(),
      orgName: 'Platform',
      isSuperAdmin: true,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
}
