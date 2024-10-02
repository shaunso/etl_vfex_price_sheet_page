// *************** load the data to mysql database *******************
import mysql from 'mysql2';
import 'dotenv/config';

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
 
// connect to the database using a pool
export const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectionLimit: 10
});