
import { getTheWebsiteDeatils, uploadTheWebsiteDeatils } from '@/controllers/web.controller';
import { getAllWeblinks } from '@/controllers/weblinks.controllers';
import express from 'express';

const router = express.Router();

// router.get('/', getTheWebsiteDeatils);
router.get('/stream', getAllWeblinks);


export default router;

