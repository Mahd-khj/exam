import type { Request, Response } from 'express';
import Room from '../models/Room';

// Get all rooms
export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms', error });
  }
};

// Get a single room by ID
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room', error });
  }
};

// Create a new room
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, capacity } = req.body;

    // Optional: validation before creating
    if (!name || !capacity) {
      return res.status(400).json({ message: 'Name and capacity are required' });
    }

    const newRoom = await Room.create({ name, capacity });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create room', error });
  }
};

// Update a room by ID
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updated] = await Room.update(req.body, { where: { id } });

    if (updated === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update room', error });
  }
};

// Delete a room by ID
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Room.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete room', error });
  }
};
