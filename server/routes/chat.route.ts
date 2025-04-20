import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { newChat } from '@/controllers/chat.controller';

const router = express.Router();

router.get('/new',checkAuth, newChat);

export default router;

