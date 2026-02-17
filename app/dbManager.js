const mysql = require("mysql2/promise");

let connection;

async function dbConnect() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'posense'
    });
    console.log("Database connected");
}

async function displayRecords (SQLQuery) {
    if (connection) {
        const [rows, fields] = await connection.query(SQLQuery);
        return rows;
    }
    throw new Error("Database not connected");
}

async function sqlManager (SQLQuery) {
    if (connection) {
        const [result] = await connection.query(SQLQuery);
        return result;
    }
}
module.exports = { dbConnect, displayRecords, sqlManager };
