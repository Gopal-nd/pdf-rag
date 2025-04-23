import express from 'express';
import { createCollection, getCollection, updateCollection } from '@/controllers/collection.controller';

const router = express.Router();

router.post('/new', createCollection);
router.put('/:id', updateCollection);
router.get('/', getCollection);




export default router;

