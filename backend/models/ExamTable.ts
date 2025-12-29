// backend/models/ExamTable.ts
import { DataTypes } from "sequelize";
import sequelize from "../db";
import User from "./User";
import Room from "./Room";
import ClassCode from "./ClassCode";

// Define the ExamTable model
const ExamTable = sequelize.define("ExamTable", {
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
    references: {
      model: "users",
      key: "id",
    },
  },
  classCodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "class_codes",
      key: "id",
    },
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "rooms",
      key: "id",
    },
  },
}, {
  tableName: "exam_tables",  // ✅ Explicitly define table name
  timestamps: true,
});

// Associations
ExamTable.belongsTo(User, { foreignKey: "userId" });
ExamTable.belongsTo(ClassCode, { foreignKey: "classCodeId" });
ExamTable.belongsTo(Room, { foreignKey: "roomId" });

User.hasMany(ExamTable, { foreignKey: "userId" });
ClassCode.hasMany(ExamTable, { foreignKey: "classCodeId" });
Room.hasMany(ExamTable, { foreignKey: "roomId" });

export default ExamTable;
