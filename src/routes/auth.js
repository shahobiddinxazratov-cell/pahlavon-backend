const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth, SECRET } = require("../middleware/auth");

const router = express.Router();

// ADMIN LOGIN
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Login va parolni kiriting" });
  try {
    const { rows } = await pool.query("SELECT * FROM admins WHERE username = $1", [username]);
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: "Login yoki parol xato" });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: "Login yoki parol xato" });
    const token = jwt.sign({ role: "admin", adminId: admin.id, username: admin.username }, SECRET, { expiresIn: "12h" });
    res.json({ token, username: admin.username });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// DOCTOR LOGIN (login = phone)
router.post("/doctor/login", async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) return res.status(400).json({ error: "Telefon va parolni kiriting" });
  try {
    const { rows } = await pool.query("SELECT * FROM doctors WHERE phone = $1", [phone]);
    const doc = rows[0];
    if (!doc) return res.status(401).json({ error: "Telefon yoki parol xato" });
    const ok = await bcrypt.compare(password, doc.password_hash);
    if (!ok) return res.status(401).json({ error: "Telefon yoki parol xato" });
    const token = jwt.sign({ role: "doctor", doctorId: doc.id, name: doc.name }, SECRET, { expiresIn: "12h" });
    res.json({
      token,
      doctor: {
        id: doc.id,
        name: doc.name,
        department: doc.department,
        years: doc.years,
        mustChangePassword: doc.must_change_password,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// DOCTOR CHANGES OWN PASSWORD (birinchi kirishda majburiy, keyin ham ixtiyoriy)
router.post("/doctor/change-password", requireAuth(["doctor"]), async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" });
  }
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE doctors SET password_hash = $1, must_change_password = false WHERE id = $2",
      [hash, req.user.doctorId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
