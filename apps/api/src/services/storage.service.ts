import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

export class StorageService {
  private s3Client: S3Client | null = null;
  private localDir: string;

  constructor() {
    this.localDir = path.resolve(process.cwd(), config.LOCAL_STORAGE_DIR);
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }

    if (config.STORAGE_DRIVER === 's3' && config.S3_BUCKET && config.S3_ACCESS_KEY_ID) {
      this.s3Client = new S3Client({
        region: config.S3_REGION,
        endpoint: config.S3_ENDPOINT,
        credentials: {
          accessKeyId: config.S3_ACCESS_KEY_ID,
          secretAccessKey: config.S3_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  generateKey(tenantId: string, category: string, originalFilename: string): string {
    const ext = path.extname(originalFilename).toLowerCase();
    const safeExts = ['.jpg', '.jpeg', '.png', '.pdf', '.ogg', '.mp3', '.wav', '.csv'];
    if (!safeExts.includes(ext)) {
      throw AppError.badRequest(`File extension ${ext} is not permitted.`);
    }
    const safeName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `tenants/${tenantId}/${category}/${uuidv4()}-${safeName}${ext}`;
  }

  async createPresignedUploadUrl(
    tenantId: string,
    category: string,
    filename: string,
    contentType: string
  ): Promise<PresignedUrlResult> {
    const fileKey = this.generateKey(tenantId, category, filename);
    const expiresInSeconds = 900; // 15 minutes

    if (this.s3Client && config.S3_BUCKET) {
      const command = new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: fileKey,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      const downloadUrl = await this.getPresignedDownloadUrl(fileKey);

      return {
        uploadUrl,
        downloadUrl,
        fileKey,
        expiresInSeconds,
      };
    }

    // Local Storage Mock Upload URL
    const uploadUrl = `${config.API_BASE_URL}/api/v1/storage/local-upload?key=${encodeURIComponent(fileKey)}`;
    const downloadUrl = `${config.API_BASE_URL}/api/v1/storage/local-download?key=${encodeURIComponent(fileKey)}`;

    return {
      uploadUrl,
      downloadUrl,
      fileKey,
      expiresInSeconds,
    };
  }

  async getPresignedDownloadUrl(fileKey: string): Promise<string> {
    if (this.s3Client && config.S3_BUCKET) {
      const command = new GetObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: fileKey,
      });
      return getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    }

    return `${config.API_BASE_URL}/api/v1/storage/local-download?key=${encodeURIComponent(fileKey)}`;
  }

  async saveLocalFile(fileKey: string, buffer: Buffer): Promise<string> {
    const targetPath = path.join(this.localDir, fileKey);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.writeFile(targetPath, buffer);
    return targetPath;
  }

  getLocalFilePath(fileKey: string): string {
    const targetPath = path.join(this.localDir, fileKey);
    if (!fs.existsSync(targetPath)) {
      throw AppError.notFound('Requested file does not exist in storage.');
    }
    return targetPath;
  }
}

export const storageService = new StorageService();
