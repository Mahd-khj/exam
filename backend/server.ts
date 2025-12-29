// @ts-nocheck
import app from './app';
import sequelize from './db';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 5000;
console.log(PORT);
console.log("Loaded ENV:", process.env.DB_USER, process.env.DB_NAME);


const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync();
    console.log('All models were synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();
