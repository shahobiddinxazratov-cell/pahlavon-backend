// Bir martalik skript: birinchi admin hisobini yaratadi.
// Ishlatish: ADMIN_USERNAME va ADMIN_PASSWORD ni .env ga qo'ying, keyin: npm run seed-admin
const bcrypt = require("bcryptjs");
const pool = require("./db");
require("dotenv").config();

(async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error("ADMIN_USERNAME va ADMIN_PASSWORD ni .env fayliga qo'shing");
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, hash]
    );
    console.log(`Admin "${username}" muvaffaqiyatli yaratildi/yangilandi.`);
  } catch (e) {
    console.error("Xatolik:", e.message);
  } finally {
    await pool.end();
  }
})();
