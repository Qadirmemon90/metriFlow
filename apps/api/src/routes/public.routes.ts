import { Router } from 'express';
import { platformController } from '../controllers/platform.controller.js';

const router = Router();

router.post('/contact', (req, res, next) => platformController.submitContact(req, res, next));

export const publicRoutes = router;
