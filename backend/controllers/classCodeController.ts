import type { Request, Response } from 'express';
import ClassCode from '../models/ClassCode';
import User from '../models/User';
import Room from '../models/Room';

// Get all class codes with associated teacher, room, and students
export const getAllClassCodes = async (req: Request, res: Response) => {
  try {
    const classes = await ClassCode.findAll({
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'name'] },
        { model: User, as: 'students', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch classes', error });
  }
};

// Get single class code by ID
export const getClassCodeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classCode = await ClassCode.findByPk(id, {
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'name'] },
        { model: User, as: 'students', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });

    if (!classCode) return res.status(404).json({ message: 'Class not found' });
    res.json(classCode);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch class', error });
  }
};

// Create new class code
export const createClassCode = async (req: Request, res: Response) => {
  try {
    const newClass = await ClassCode.create(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create class', error });
  }
};

// Update class code by ID
export const updateClassCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await ClassCode.update(req.body, { where: { id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update class', error });
  }
};

// Delete class code by ID
export const deleteClassCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await ClassCode.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete class', error });
  }
};
