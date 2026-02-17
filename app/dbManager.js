import mysql from 'mysql2/promise';

let pool;

export async function dbConnect() {
    if (pool) return pool;

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    console.log("Database pool created");
    return pool;
}

export async function displayRecords(SQLQuery, params = []) {
    const db = await dbConnect();
    const [rows] = await db.execute(SQLQuery, params);
    return rows;
}

export async function sqlManager(SQLQuery, params = []) {
    const db = await dbConnect();
    const [result] = await db.execute(SQLQuery, params);
    return result;
}
