import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { continueChat, getAllChats, getChatHistory, newAiChat, newChat, test } from '@/controllers/webchat.controllers';

const router = express.Router();

router.get('/new',checkAuth, newAiChat);
router.get('/:chatId',checkAuth,continueChat)
router.get('/',checkAuth,getAllChats)
router.get('/history/:chatId',checkAuth,test)




export default router;

