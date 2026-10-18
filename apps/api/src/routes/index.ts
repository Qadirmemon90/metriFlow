import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { masterDataRoutes } from './masterData.routes.js';
import { inventoryRoutes } from './inventory.routes.js';
import { salesRoutes } from './sales.routes.js';
import { financeRoutes } from './finance.routes.js';
import { fieldRoutes } from './field.routes.js';
import { whatsappRoutes } from './whatsapp.routes.js';
import { geminiRoutes } from './gemini.routes.js';
import { reportingRoutes } from './reporting.routes.js';
import { platformRoutes } from './platform.routes.js';
import { publicRoutes } from './public.routes.js';
import { storageRoutes } from './storage.routes.js';

const apiV1Router = Router();

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/master-data', masterDataRoutes);
apiV1Router.use('/inventory', inventoryRoutes);
apiV1Router.use('/orders', salesRoutes);
apiV1Router.use('/finance', financeRoutes);
apiV1Router.use('/field', fieldRoutes);
apiV1Router.use('/integrations/whatsapp', whatsappRoutes);
apiV1Router.use('/ai', geminiRoutes);
apiV1Router.use('/reports', reportingRoutes);
apiV1Router.use('/platform', platformRoutes);
apiV1Router.use('/public', publicRoutes);
apiV1Router.use('/storage', storageRoutes);

export { apiV1Router };
