import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { getApiKey, setApiKey } from '@/controllers/api.controller';
import { prisma } from '@/lib/db';

const router = express.Router();

router.get('/',checkAuth, getApiKey);
router.post('/',checkAuth,setApiKey)





export default router;

