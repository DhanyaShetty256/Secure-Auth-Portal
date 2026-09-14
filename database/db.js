const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "auth.db");

const db = new Database(dbPath);

// Enable foreign key support
db.pragma("foreign_keys = ON");

// Create users table
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        reset_token TEXT,
        reset_token_expires INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

module.exports = db;