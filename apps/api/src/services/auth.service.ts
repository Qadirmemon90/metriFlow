import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import mongoose from 'mongoose';
import {
  User,
  Organization,
  OrganizationMembership,
  Session,
  Branch,
  Warehouse,
  AuditLog,
} from '../database/models/index.js';
import {
  SignupInput,
  LoginInput,
  InviteMemberInput,
  AcceptInviteInput,
  ResetPasswordRequestInput,
  ResetPasswordConfirmInput,
  Role,
  AuthenticatedUser,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { withTransaction } from '../database/connection.js';
import { config } from '../config/index.js';

export class AuthService {
  async signup(input: SignupInput, traceId: string) {
    return withTransaction(async (session) => {
      const existingUser = await User.findOne({ email: input.email }).session(session);
      if (existingUser) {
        throw AppError.conflict('An account with this email address already exists.');
      }

      const slug = input.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      const org = new Organization({
        name: input.organizationName,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: input.phone,
        email: input.email,
        maxUsers: 2,
        maxWarehouses: 1,
      });
      await org.save({ session });

      // Default Branch & Warehouse
      const branch = new Branch({
        tenantId: org._id,
        name: 'Head Office',
        code: 'HQ',
        city: 'Karachi',
        isDefault: true,
      });
      await branch.save({ session });

      const warehouse = new Warehouse({
        tenantId: org._id,
        branchId: branch._id,
        name: 'Main Warehouse',
        code: 'WH-01',
        isDefault: true,
      });
      await warehouse.save({ session });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = new User({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await user.save({ session });

      const membership = new OrganizationMembership({
        tenantId: org._id,
        userId: user._id,
        role: Role.OWNER_ADMIN,
        branchId: branch._id,
        warehouseId: warehouse._id,
        invitationStatus: 'ACCEPTED',
      });
      await membership.save({ session });

      // Create session
      const rawSessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

      const newSession = new Session({
        sessionTokenHash,
        userId: user._id,
        tenantId: org._id,
        membershipId: membership._id,
        expiresAt: new Date(Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000),
      });
      await newSession.save({ session });

      await AuditLog.create(
        [
          {
            tenantId: org._id,
            actorId: user._id,
            actorEmail: user.email,
            action: 'ORGANIZATION_CREATED',
            entityType: 'Organization',
            entityId: org._id.toString(),
            traceId,
            metadata: { orgName: org.name, slug: org.slug },
          },
        ],
        { session }
      );

      // Async email
      emailService.sendVerificationEmail(user.email, user.fullName, verificationToken).catch((err) => {
        console.error('[AuthService] Verification email failed:', err);
      });

      const authenticatedUser: AuthenticatedUser = {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: Role.OWNER_ADMIN,
        orgId: org._id.toString(),
        orgName: org.name,
        branchId: branch._id.toString(),
        warehouseId: warehouse._id.toString(),
        isSuperAdmin: false,
        mfaEnabled: false,
        emailVerified: false,
      };

      return {
        sessionToken: rawSessionToken,
        user: authenticatedUser,
      };
    });
  }

  async login(input: LoginInput, traceId: string) {
    const user = await User.findOne({ email: input.email });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    if (user.mfaEnabled) {
      if (!input.totpCode) {
        throw AppError.badRequest('MFA TOTP code required.', 'MFA_REQUIRED');
      }
      const isValidTotp = authenticator.check(input.totpCode, user.mfaSecret || '');
      if (!isValidTotp) {
        throw AppError.unauthorized('Invalid MFA verification code.');
      }
    }

    // Resolve tenant membership
    const membership = await OrganizationMembership.findOne({
      userId: user._id,
      isActive: true,
      invitationStatus: 'ACCEPTED',
    }).populate('tenantId');

    if (!membership && !user.isSuperAdmin) {
      throw AppError.forbidden('No active organization membership found.');
    }

    const org = membership ? (membership.tenantId as any) : null;
    if (org && !org.isActive) {
      throw AppError.forbidden('Organization account is suspended or inactive.');
    }

    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

    const newSession = await Session.create({
      sessionTokenHash,
      userId: user._id,
      tenantId: org ? org._id : new mongoose.Types.ObjectId(),
      membershipId: membership ? membership._id : new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000),
    });

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      tenantId: org?._id,
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      traceId,
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: membership ? membership.role : (Role.PLATFORM_SUPER_ADMIN as any),
      orgId: org ? org._id.toString() : 'platform',
      orgName: org ? org.name : 'MetriFlow Platform',
      branchId: membership?.branchId?.toString(),
      warehouseId: membership?.warehouseId?.toString(),
      isSuperAdmin: user.isSuperAdmin,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
    };

    return {
      sessionToken: rawSessionToken,
      user: authenticatedUser,
    };
  }

  async logout(sessionToken: string) {
    if (!sessionToken) return;
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    await Session.updateOne({ sessionTokenHash: tokenHash }, { isRevoked: true });
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw AppError.badRequest('Invalid or expired verification token.');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  async requestPasswordReset(input: ResetPasswordRequestInput) {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      // Don't leak existence
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    emailService.sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      console.error('[AuthService] Reset password email failed:', err);
    });

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async confirmPasswordReset(input: ResetPasswordConfirmInput) {
    const user = await User.findOne({
      passwordResetToken: input.token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw AppError.badRequest('Invalid or expired password reset token.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing sessions
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async inviteMember(tenantId: mongoose.Types.ObjectId, inviterUser: AuthenticatedUser, input: InviteMemberInput) {
    const org = await Organization.findById(tenantId);
    if (!org) throw AppError.notFound('Organization not found.');

    const currentCount = await OrganizationMembership.countDocuments({
      tenantId,
      isActive: true,
      invitationStatus: { $in: ['ACCEPTED', 'PENDING'] },
    });

    if (currentCount >= org.maxUsers) {
      throw AppError.forbidden(
        `Plan user limit reached (${org.maxUsers} max). Please upgrade your subscription.`
      );
    }

    let user = await User.findOne({ email: input.email });
    const inviteToken = crypto.randomBytes(32).toString('hex');

    if (!user) {
      // Create stub user
      const placeholderPass = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(placeholderPass, 10);
      user = new User({
        email: input.email,
        fullName: input.fullName,
        passwordHash: hash,
        emailVerified: false,
      });
      await user.save();
    }

    const existingMembership = await OrganizationMembership.findOne({
      tenantId,
      userId: user._id,
    });

    if (existingMembership && existingMembership.isActive) {
      throw AppError.conflict('User is already a member of this organization.');
    }

    const membership = new OrganizationMembership({
      tenantId,
      userId: user._id,
      role: input.role,
      branchId: input.branchId ? new mongoose.Types.ObjectId(input.branchId) : undefined,
      warehouseId: input.warehouseId ? new mongoose.Types.ObjectId(input.warehouseId) : undefined,
      invitationStatus: 'PENDING',
      invitationToken: inviteToken,
      invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: new mongoose.Types.ObjectId(inviterUser.id),
    });
    await membership.save();

    emailService.sendInvitationEmail(input.email, inviterUser.fullName, org.name, inviteToken).catch((err) => {
      console.error('[AuthService] Invite email failed:', err);
    });

    return {
      message: 'Invitation sent successfully.',
      invitationToken: inviteToken,
    };
  }

  async acceptInvite(input: AcceptInviteInput) {
    const membership = await OrganizationMembership.findOne({
      invitationToken: input.token,
      invitationStatus: 'PENDING',
      invitationExpires: { $gt: new Date() },
    });

    if (!membership) {
      throw AppError.badRequest('Invalid or expired invitation token.');
    }

    const user = await User.findById(membership.userId);
    if (!user) throw AppError.notFound('User not found.');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.password, salt);
    user.fullName = input.fullName;
    user.emailVerified = true;
    await user.save();

    membership.invitationStatus = 'ACCEPTED';
    membership.invitationToken = undefined;
    membership.invitationExpires = undefined;
    await membership.save();

    return { message: 'Invitation accepted. You can now log in.' };
  }

  async setupMfa(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found.');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'MetriFlow', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  async verifyAndEnableMfa(userId: string, secret: string, code: string) {
    const isValid = authenticator.check(code, secret);
    if (!isValid) {
      throw AppError.badRequest('Invalid verification code. Please check your authenticator app.');
    }

    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User not found.');

    user.mfaEnabled = true;
    user.mfaSecret = secret;
    await user.save();

    return { message: 'MFA successfully enabled.' };
  }
}

export const authService = new AuthService();
