import mysql, { type RowDataPacket } from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "brochify",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

export { pool };

export async function dbQuery<T extends RowDataPacket[]>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}
