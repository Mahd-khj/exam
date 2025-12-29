// @ts-nocheck
import sequelize from "./db";

// Import all models (in correct dependency order)
import "./models/User";
import "./models/Room";
import "./models/ClassCode";
import "./models/ExamTable";      // ✅ must be before UserClass
import "./models/SessionToken";
import "./models/UserClass";      // ✅ last (depends on User + ExamTable)

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Use { alter: true } for safe updates without dropping tables
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized successfully (manual run).");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during database synchronization:", error);
    process.exit(1);
  }
}

syncDatabase();
