import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  googleSubjectId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    googleSubjectId: { type: String, sparse: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
