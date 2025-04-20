import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { newUpload } from '@/controllers/upload.controller';

const router = express.Router();

router.get('/new',checkAuth, newUpload);

export default router;

