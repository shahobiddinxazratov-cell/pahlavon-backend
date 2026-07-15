const { Pool } = require("pg");
require("dotenv").config();

// DATABASE_URL Supabase/Render/Neon panelidan olinadi, .env faylga qo'yiladi.
// Masalan: postgresql://user:password@host:5432/dbname
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

module.exports = pool;
