import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import "./models/UserClass";


dotenv.config();


// This file initializes the Sequelize ORM connection.
// It handles connecting to the MySQL database using environment variables,
// creating tables on first run, and ensuring stable schema synchronization.


// Create Sequelize instance using .env credentials
export const sequelize = new Sequelize(
  process.env.DB_NAME || "exam_schedule",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false, // change to console.log for debugging SQL
  }
);

// Initialize the database
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("Database connection established.");

    // Sync all models with the database.
    // `force: true`  → drops and recreates all tables (only use ONCE when resetting)
    // - `alter: false` → keeps structure stable after the first sync

    const shouldReset = process.env.DB_RESET === "true";

    await sequelize.sync({ force: shouldReset, alter: !shouldReset });

    if (shouldReset) {
      console.log("Tables dropped and recreated (force sync enabled).");
    }

    console.log("All models synchronized successfully.");
  } catch (error) {
    console.error("Database connection/sync error:", error);
    throw error;
  }
}

export default sequelize;
