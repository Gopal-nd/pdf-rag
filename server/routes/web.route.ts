
import { getTheWebsiteDeatils, uploadTheWebsiteDeatils } from '@/controllers/web.controller';
import express from 'express';

const router = express.Router();

router.get('/', getTheWebsiteDeatils);
router.post('/', uploadTheWebsiteDeatils);







export default router;

