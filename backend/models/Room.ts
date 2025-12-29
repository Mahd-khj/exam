import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class Room extends Model {
  public id!: number;
  public name!: string;
  public capacity!: number;
}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: 'rooms',
    sequelize,
  }
);

export default Room;
