import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../db";
import User from "./User";
import Room from "./Room";
import ClassCode from "./ClassCode";

class ExamTable extends Model<
  InferAttributes<ExamTable>,
  InferCreationAttributes<ExamTable>
> {
  declare id: CreationOptional<number>;
  declare title: string | null;
  declare day: string;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare userId: number | null;
  declare classCodeId: number;
  declare roomId: number;
}

ExamTable.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    classCodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "exam_tables",
    timestamps: true,
  }
);

// Associations
ExamTable.belongsTo(User, { foreignKey: "userId" });
ExamTable.belongsTo(ClassCode, { foreignKey: "classCodeId" });
ExamTable.belongsTo(Room, { foreignKey: "roomId" });

User.hasMany(ExamTable, { foreignKey: "userId" });
ClassCode.hasMany(ExamTable, { foreignKey: "classCodeId" });
Room.hasMany(ExamTable, { foreignKey: "roomId" });

export default ExamTable;
