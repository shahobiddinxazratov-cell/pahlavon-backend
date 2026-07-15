// Bir martalik skript: 5 ta namunaviy shifokorni bazaga qo'shadi.
// Ishlatish: npm run seed-doctors
const bcrypt = require("bcryptjs");
const pool = require("./db");
require("dotenv").config();

const DOCTORS = [
  { name: "Sherzod Rahimov", phone: "+998901110001", department: "Kardiologiya", years: 22 },
  { name: "Nodira Yusupova", phone: "+998901110002", department: "Nevrologiya", years: 14 },
  { name: "Javlon Toshev", phone: "+998901110003", department: "Umumiy amaliyot", years: 9 },
  { name: "Madina Ergasheva", phone: "+998901110004", department: "Diagnostika", years: 7 },
  { name: "Otabek Qodirov", phone: "+998901110005", department: "Kardiologiya", years: 5 },
];

(async () => {
  try {
    for (const doc of DOCTORS) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(tempPassword, 10);
      await pool.query(
        `INSERT INTO doctors (name, phone, password_hash, department, years, must_change_password)
         VALUES ($1,$2,$3,$4,$5,true)
         ON CONFLICT (phone) DO NOTHING`,
        [doc.name, doc.phone, hash, doc.department, doc.years]
      );
      console.log(`${doc.name} (${doc.phone}) — vaqtinchalik parol: ${tempPassword}`);
    }
    console.log("Tayyor. Yuqoridagi parollarni yozib qo'ying — qayta ko'rsatilmaydi.");
  } catch (e) {
    console.error("Xatolik:", e.message);
  } finally {
    await pool.end();
  }
})();
