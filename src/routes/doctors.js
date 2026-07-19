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
      "SELECT id, name, department, years, photo_url FROM doctors ORDER BY name ASC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: yangi shifokor qo'shish -> vaqtinchalik parol generatsiya qilinadi va qaytariladi
router.post("/", requireAuth(["admin"]), async (req, res) => {
  const { name, phone, department, years, photoUrl } = req.body || {};
  if (!name || !phone || !department) {
    return res.status(400).json({ error: "Ism, telefon va bo'lim majburiy" });
  }
  try {
    const tempPassword = crypto.randomBytes(4).toString("hex"); // masalan: 8 ta belgi
    const hash = await bcrypt.hash(tempPassword, 10);
    const { rows } = await pool.query(
      `INSERT INTO doctors (name, phone, password_hash, department, years, photo_url, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, name, phone, department, years, photo_url`,
      [name, phone, hash, department, Number(years) || 0, photoUrl || null]
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

// ADMIN: shifokor ma'lumotlarini tahrirlash (rasm, tajriba, bo'lim)
router.patch("/:id", requireAuth(["admin"]), async (req, res) => {
  const { department, years, photoUrl } = req.body || {};
  const hasPhotoField = Object.prototype.hasOwnProperty.call(req.body || {}, "photoUrl");
  try {
    const { rows } = await pool.query(
      `UPDATE doctors SET
         department = COALESCE($1, department),
         years = COALESCE($2, years),
         photo_url = CASE WHEN $3 THEN $4 ELSE photo_url END
       WHERE id = $5
       RETURNING id, name, phone, department, years, photo_url`,
      [department || null, years != null ? Number(years) : null, hasPhotoField, photoUrl || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Shifokor topilmadi" });
    res.json(rows[0]);
  } catch (e) {
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
