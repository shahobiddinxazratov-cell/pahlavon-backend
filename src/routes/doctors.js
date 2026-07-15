const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// PUBLIC: hamma shifokorlar ro'yxati (bemorlar sayti uchun, parolsiz)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, department, years FROM doctors ORDER BY name ASC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: yangi shifokor qo'shish -> vaqtinchalik parol generatsiya qilinadi va qaytariladi
router.post("/", requireAuth(["admin"]), async (req, res) => {
  const { name, phone, department, years } = req.body || {};
  if (!name || !phone || !department) {
    return res.status(400).json({ error: "Ism, telefon va bo'lim majburiy" });
  }
  try {
    const tempPassword = crypto.randomBytes(4).toString("hex"); // masalan: 8 ta belgi
    const hash = await bcrypt.hash(tempPassword, 10);
    const { rows } = await pool.query(
      `INSERT INTO doctors (name, phone, password_hash, department, years, must_change_password)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, phone, department, years`,
      [name, phone, hash, department, Number(years) || 0]
    );
    res.json({ doctor: rows[0], tempPassword });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Bu telefon raqami bilan shifokor allaqachon mavjud" });
    }
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: shifokorni o'chirish
router.delete("/:id", requireAuth(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM doctors WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: shifokor parolini qayta tiklash (agar unutib qo'ysa)
router.post("/:id/reset-password", requireAuth(["admin"]), async (req, res) => {
  try {
    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.query(
      "UPDATE doctors SET password_hash = $1, must_change_password = true WHERE id = $2",
      [hash, req.params.id]
    );
    res.json({ tempPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
