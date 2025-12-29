// @ts-nocheck
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory (one level up from backend)
// When running from backend/, go up one level; when running from root, use current dir
const rootDir = process.cwd().includes('backend') 
  ? path.resolve(process.cwd(), '..') 
  : process.cwd();
dotenv.config({ path: path.resolve(rootDir, '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || '',
  process.env.DB_USER || '',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);

// Remove the immediate authentication call - it will be called in server.ts
export default sequelize;
