import express from 'express';
import {
  getAllClassCodes,
  getClassCodeById,
  createClassCode,
  updateClassCode,
  deleteClassCode,
} from '../controllers/classCodeController';

const router = express.Router();

// GET all class codes
router.get('/', getAllClassCodes);

// GET single class code by ID
router.get('/:id', getClassCodeById);

// CREATE new class code
router.post('/', createClassCode);

// UPDATE class code by ID
router.put('/:id', updateClassCode);

// DELETE class code by ID
router.delete('/:id', deleteClassCode);

export default router;
