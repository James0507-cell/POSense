import mysql from 'mysql2/promise';

let connection;

async function dbConnect() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'posense'
    });
    console.log("Database connected");
    return connection;
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
