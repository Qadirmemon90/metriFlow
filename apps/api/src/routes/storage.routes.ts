import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { storageService } from '../services/storage.service.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Request presigned upload URL (authenticated)
router.post('/presigned-upload', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Schema = z.object({
      category: z.enum(['payments', 'deliveries', 'invoices', 'chat', 'general']),
      filename: z.string().min(1),
      contentType: z.string().min(1),
    });
    const input = Schema.parse(req.body);

    const result = await storageService.createPresignedUploadUrl(
      req.tenantId!.toString(),
      input.category,
      input.filename,
      input.contentType
    );

    res.status(200).json({ success: true, data: result, traceId: req.traceId });
  } catch (error) {
    next(error);
  }
});

// Request presigned download URL (authenticated)
router.get('/presigned-download', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileKey = req.query.key as string;
    if (!fileKey) throw AppError.badRequest('Missing key query parameter.');

    // Tenant boundary check: fileKey must start with `tenants/<tenantId>/`
    const tenantPrefix = `tenants/${req.tenantId!.toString()}/`;
    if (!fileKey.startsWith(tenantPrefix) && !req.user?.isSuperAdmin) {
      throw AppError.forbidden('Access denied. You cannot access files outside your tenant organization.');
    }

    const downloadUrl = await storageService.getPresignedDownloadUrl(fileKey);
    res.status(200).json({ success: true, data: { downloadUrl }, traceId: req.traceId });
  } catch (error) {
    next(error);
  }
});

// Local dev upload fallback
router.post('/local-upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileKey = req.query.key as string;
    if (!fileKey) throw AppError.badRequest('Missing key parameter.');
    if (!req.file) throw AppError.badRequest('No file uploaded.');

    await storageService.saveLocalFile(fileKey, req.file.buffer);
    res.status(200).json({ success: true, data: { fileKey, message: 'File uploaded locally.' } });
  } catch (error) {
    next(error);
  }
});

// Local dev download fallback
router.get('/local-download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileKey = req.query.key as string;
    if (!fileKey) throw AppError.badRequest('Missing key parameter.');

    const filePath = storageService.getLocalFilePath(fileKey);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

export const storageRoutes = router;
