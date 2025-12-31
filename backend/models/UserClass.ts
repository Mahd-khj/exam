import { DataTypes, Model } from "sequelize";
import sequelize from "../db";
import User from "./User";
import ExamTable from "./ExamTable";
import ClassCode from "./ClassCode";

class UserClass extends Model {
  public id!: number;
  public userId!: number;
  public examId!: number | null;
  public classCodeId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserClass.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    examId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "exam_tables",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    classCodeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "class_codes",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "user_classes",
    timestamps: true,
  }
);

// Associations (with aliases)
UserClass.belongsTo(User, { as: "User", foreignKey: "userId" });
UserClass.belongsTo(ExamTable, { as: "ExamTable", foreignKey: "examId" });
UserClass.belongsTo(ClassCode, { as: "ClassCode", foreignKey: "classCodeId" });

User.hasMany(UserClass, { as: "UserClasses", foreignKey: "userId" });
ExamTable.hasMany(UserClass, { as: "ExamUsers", foreignKey: "examId" });
ClassCode.hasMany(UserClass, { as: "ClassUsers", foreignKey: "classCodeId" });

export default UserClass;
