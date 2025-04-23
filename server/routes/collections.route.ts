import express from 'express';
import { createCollection, deleteCollection, getCollection, updateCollection } from '@/controllers/collection.controller';

const router = express.Router();

router.post('/new', createCollection);
router.put('/:id', updateCollection);
router.get('/', getCollection);
router.delete('/:id', deleteCollection);





export default router;

