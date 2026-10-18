import { z } from 'zod';
import { Role } from './roles.js';

export const SignupSchema = z.object({
  organizationName: z.string().min(2).max(100),
  fullName: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export type ResetPasswordConfirmInput = z.infer<typeof ResetPasswordConfirmSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email().toLowerCase(),
  fullName: z.string().min(2).max(100),
  role: z.nativeEnum(Role),
  branchId: z.string().optional(),
  warehouseId: z.string().optional(),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
});

export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;

export const GoogleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;

export const MfaSetupVerifySchema = z.object({
  secret: z.string().min(1),
  code: z.string().length(6),
});

export type MfaSetupVerifyInput = z.infer<typeof MfaSetupVerifySchema>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  orgId: string;
  orgName: string;
  branchId?: string;
  warehouseId?: string;
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
  emailVerified: boolean;
}
