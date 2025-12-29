import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../db';
import User from './User';
import Room from './Room';

// Define TypeScript interface for ClassCode attributes
interface ClassCodeAttributes {
  id: number;
  code: string;
  exam_date?: Date | null;
  start_time?: string | null;
  end_time?: string | null;
  teacher_id?: number | null;
  room_id?: number | null;
}

// For creation, id is optional because it auto-increments
interface ClassCodeCreationAttributes extends Optional<ClassCodeAttributes, 'id'> {}

// Define the ClassCode model
class ClassCode extends Model<ClassCodeAttributes, ClassCodeCreationAttributes>
  implements ClassCodeAttributes {
  public id!: number;
  public code!: string;
  public exam_date?: Date | null;
  public start_time?: string | null;
  public end_time?: string | null;
  public teacher_id?: number | null;
  public room_id?: number | null;
}

// Initialize the model
ClassCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Room,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'class_codes',
    timestamps: false,
  }
);

// ASSOCIATIONS

// Each class has one teacher
ClassCode.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });
User.hasMany(ClassCode, { as: 'classes', foreignKey: 'teacher_id' });

// Each class is assigned to one room
ClassCode.belongsTo(Room, { as: 'room', foreignKey: 'room_id' });
Room.hasMany(ClassCode, { as: 'classes', foreignKey: 'room_id' });

// Many students ↔ Many classes (join table)
ClassCode.belongsToMany(User, {
  through: 'StudentClassCodes',
  as: 'students',
  foreignKey: 'class_code_id',
});
User.belongsToMany(ClassCode, {
  through: 'StudentClassCodes',
  as: 'classCodes',
  foreignKey: 'student_id',
});

export default ClassCode;