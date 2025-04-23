import express from 'express';

import {  checkAuth } from '@/middleware/auth.middleware';
import { getFiles, newUpload } from '@/controllers/upload.controller';
import multer from 'multer';

const router = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // make sure this folder exists
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed!'));
      }
    },
  });

 

router.post('/new', upload.single('document'), newUpload);
router.get('/', checkAuth, getFiles);


export default router;

