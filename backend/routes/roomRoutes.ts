import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController';

const router = express.Router();

// GET all rooms
router.get('/', getAllRooms);

// GET single room by ID
router.get('/:id', getRoomById);

// CREATE new room
router.post('/', createRoom);

// UPDATE room by ID
router.put('/:id', updateRoom);

// DELETE room by ID
router.delete('/:id', deleteRoom);

export default router;
