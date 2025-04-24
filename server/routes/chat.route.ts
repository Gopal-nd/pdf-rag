import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { continueChat, getAllChats, getChatHistory, newAiChat, newChat } from '@/controllers/chat.controller';

const router = express.Router();

router.get('/new',checkAuth, newAiChat);
router.get('/:chatId',checkAuth,continueChat)
router.get('/',checkAuth,getAllChats)
router.get('/history',checkAuth,getChatHistory)




export default router;

