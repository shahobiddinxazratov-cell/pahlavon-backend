const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// PUBLIC: barcha sozlamalarni olish (masalan telefon raqami)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM settings");
    const obj = {};
    rows.forEach((r) => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ADMIN: sozlamani yangilash (masalan clinic_phone)
router.put("/:key", requireAuth(["admin"]), async (req, res) => {
  const { value } = req.body || {};
  if (value === undefined) return res.status(400).json({ error: "Qiymat kerak" });
  try {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
